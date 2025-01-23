import { redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Confirm this is an employee or admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw fail(500, { error: "Could not load profile" })
  }

  if (profile.role !== "employee" && profile.role !== "administrator") {
    throw redirect(303, "/account")
  }

  // Load the chat
  const chatId = params.chat_id
  const { data: chat, error: chatError } = await supabase
    .from("live_chats")
    .select("*")
    .eq("id", chatId)
    .is("closed_at", null) // If you also want to show closed chats, remove this
    .single()

  if (chatError || !chat) {
    throw redirect(303, "/account/live_chat_agent")
  }

  // Optionally ensure the user is in the same company if you track that on the agent_id or user_id
  // fetch chat.user_id’s profile, confirm same company, etc. For brevity, omitted here.

  // Load chat messages
  const { data: messages, error: msgError } = await supabase
    .from("live_chat_messages")
    .select("*")
    .eq("live_chat_id", chatId)
    .order("created_at", { ascending: true })

  if (msgError || !messages) {
    throw fail(500, { error: "Could not load chat messages" })
  }

  return {
    chat,
    messages,
    userRole: profile.role,
    isAssigned: !!chat.agent_id,
    isAssignedToMe: chat.agent_id === user.id,
  }
}

export const actions: Actions = {
  joinChat: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    const chatId = params.chat_id

    // confirm user is employee or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return fail(403, { error: "Not authorized." })
    }

    // find chat
    const { data: chat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("id", chatId)
      .single()

    if (!chat || chat.closed_at) {
      return fail(404, { error: "Chat not found or closed." })
    }
    if (
      chat.agent_id &&
      chat.agent_id !== user.id &&
      profile.role !== "administrator"
    ) {
      return fail(403, {
        error: "Another agent is already assigned to this chat.",
      })
    }

    // assign agent
    const { error: updateError } = await supabase
      .from("live_chats")
      .update({ agent_id: user.id, is_connected_to_agent: true })
      .eq("id", chatId)

    if (updateError) {
      return fail(500, { error: "Could not assign agent." })
    }

    return { success: true }
  },

  sendAgentMessage: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const chatId = params.chat_id
    const formData = await request.formData()
    const message = formData.get("message")?.toString() ?? ""

    // confirm role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return fail(403, { error: "Not authorized." })
    }
    if (!message) {
      return fail(400, { error: "Message is required." })
    }

    // confirm chat is assigned or user is admin
    const { data: chat } = await supabase
      .from("live_chats")
      .select("id, agent_id, closed_at")
      .eq("id", chatId)
      .single()

    if (!chat) {
      return fail(404, { error: "Chat not found." })
    }
    if (chat.closed_at) {
      return fail(400, { error: "Chat is already closed." })
    }
    if (
      chat.agent_id &&
      chat.agent_id !== user.id &&
      profile.role !== "administrator"
    ) {
      return fail(403, { error: "You are not assigned to this chat." })
    }

    // insert agent message
    const { error: insertError } = await supabase
      .from("live_chat_messages")
      .insert({
        live_chat_id: chatId,
        user_id: user.id,
        role: "agent",
        message_text: message,
      })

    if (insertError) {
      return fail(500, { error: "Could not store agent message." })
    }

    return { success: true }
  },

  closeChat: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // confirm role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return fail(403, { error: "Not authorized." })
    }

    const chatId = params.chat_id
    // confirm chat is assigned or user is admin
    const { data: chat } = await supabase
      .from("live_chats")
      .select("id, agent_id, closed_at")
      .eq("id", chatId)
      .single()

    if (!chat) {
      return fail(404, { error: "Chat not found." })
    }
    if (chat.closed_at) {
      return fail(400, { error: "Chat is already closed." })
    }
    if (
      chat.agent_id &&
      chat.agent_id !== user.id &&
      profile.role !== "administrator"
    ) {
      return fail(403, { error: "You are not assigned to this chat." })
    }

    const { error: closeErr } = await supabase
      .from("live_chats")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", chatId)

    if (closeErr) {
      return fail(500, { error: "Could not close chat." })
    }

    return { success: true }
  },
}
