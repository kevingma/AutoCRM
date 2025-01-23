import { redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Only employees or administrators can access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    !profile ||
    (profile.role !== "employee" && profile.role !== "administrator")
  ) {
    throw redirect(303, "/account")
  }

  // Load all open, agent-connected chats
  const { data: activeChats, error: activeChatsError } = await supabase
    .from("live_chats")
    .select(
      "id, user_id, agent_id, created_at, closed_at, is_connected_to_agent",
    )
    .eq("is_connected_to_agent", true)
    .is("closed_at", null)
    .order("created_at", { ascending: false })

  if (activeChatsError) {
    console.error("Error fetching active chats:", activeChatsError)
    return {
      openChats: [],
      role: profile.role,
    }
  }

  return {
    openChats: activeChats,
    role: profile.role,
  }
}

export const actions: Actions = {
  joinChat: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const chatId = formData.get("chatId")?.toString()

    if (!chatId) {
      return { error: "Missing chatId" }
    }

    // Confirm role is employee or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return { error: "Not authorized." }
    }

    // find the chat
    const { data: chat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("id", chatId)
      .single()

    if (!chat || chat.closed_at) {
      return { error: "Chat not found or already closed." }
    }

    // Assign the agent
    const { error: updateError } = await supabase
      .from("live_chats")
      .update({ agent_id: user.id })
      .eq("id", chatId)

    if (updateError) {
      console.error("Error assigning agent:", updateError)
      return { error: "Could not assign agent." }
    }

    return { success: true }
  },

  sendAgentMessage: async ({
    request,
    locals: { supabase, safeGetSession },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const chatId = formData.get("chatId")?.toString()
    const message = formData.get("message")?.toString() ?? ""

    if (!chatId || !message) {
      return { error: "Missing chatId or message" }
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
      return { error: "Not authorized." }
    }

    // confirm chat is assigned or user is admin
    const { data: chat } = await supabase
      .from("live_chats")
      .select("id, agent_id, closed_at, is_connected_to_agent")
      .eq("id", chatId)
      .single()

    if (!chat) {
      return { error: "Chat not found." }
    }
    if (chat.closed_at) {
      return { error: "Chat is already closed." }
    }
    if (
      chat.agent_id &&
      chat.agent_id !== user.id &&
      profile.role !== "administrator"
    ) {
      return { error: "You are not assigned to this chat." }
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
      console.error("Error storing agent message:", insertError)
      return { error: "Could not store agent message." }
    }

    return { success: true }
  },

  closeChat: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const chatId = formData.get("chatId")?.toString()

    if (!chatId) {
      return { error: "Missing chatId" }
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
      return { error: "Not authorized." }
    }

    // confirm chat is assigned or user is admin
    const { data: chat } = await supabase
      .from("live_chats")
      .select("id, agent_id, closed_at")
      .eq("id", chatId)
      .single()

    if (!chat) {
      return { error: "Chat not found." }
    }
    if (chat.closed_at) {
      return { error: "Chat is already closed." }
    }
    if (
      chat.agent_id &&
      chat.agent_id !== user.id &&
      profile.role !== "administrator"
    ) {
      return { error: "You are not assigned to this chat." }
    }

    const { error: closeError } = await supabase
      .from("live_chats")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", chatId)

    if (closeError) {
      console.error("Error closing chat:", closeError)
      return { error: "Could not close chat." }
    }

    return { success: true }
  },
}
