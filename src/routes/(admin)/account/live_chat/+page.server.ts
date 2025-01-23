import { redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Only allow "customer" to proceed
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "customer") {
    throw redirect(303, "/account")
  }

  // No extra data needed here, just show user chat page
  return {}
}

export const actions: Actions = {
  /**
   * Action: sendMessage
   * If no active chat, create one. Insert customer's message.
   * Optionally return AI reply if desired.
   */
  sendMessage: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Only "customer" can do this; optionally re-check if you'd like
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "customer") {
      return fail(403, { error: "Not authorized to send live chat message." })
    }

    const formData = await request.formData()
    const message = formData.get("message")?.toString() || ""

    if (!message.trim()) {
      return fail(400, { error: "Message is required." })
    }

    // Find or create a live_chats row that is still open for this user
    const { data: existingChat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()

    let chatId = existingChat?.id
    // Create a new chat if not found
    if (!chatId) {
      const { data: newChat, error: chatError } = await supabase
        .from("live_chats")
        .insert({
          user_id: user.id,
          is_connected_to_agent: false,
        })
        .select()
        .single()
      if (chatError || !newChat) {
        return fail(500, { error: "Failed to create a chat." })
      }
      chatId = newChat.id
    }

    // Insert message
    const { error: insertMsgError } = await supabase
      .from("live_chat_messages")
      .insert({
        live_chat_id: chatId,
        user_id: user.id,
        role: "customer", // or "user"
        message_text: message,
      })

    if (insertMsgError) {
      return fail(500, { error: "Failed to send message." })
    }

    // Optionally generate a placeholder AI reply
    // (You can integrate real AI with openai if you'd like.)
    const assistantReply = `Hello! (AI placeholder) Thanks for your message: "${message}". We'll get back to you soon.`

    // Return whether user is connected to agent
    const isConnectedToAgent = existingChat?.is_connected_to_agent ?? false

    return {
      assistantReply,
      isConnectedToAgent,
    }
  },

  /**
   * Action: connectToAgent
   * Marks is_connected_to_agent = true in live_chats, or creates a new one if none open.
   */
  connectToAgent: async ({ locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "customer") {
      return fail(403, { error: "Not authorized to connect to agent." })
    }

    // Find or create a live_chats row that is still open for this user
    const { data: existingChat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()

    let chatId = existingChat?.id
    if (!chatId) {
      // create new
      const { data: newChat, error: chatError } = await supabase
        .from("live_chats")
        .insert({
          user_id: user.id,
          is_connected_to_agent: true,
        })
        .select()
        .single()
      if (chatError || !newChat) {
        return fail(500, {
          error: "Failed to start a chat for agent connection.",
        })
      }
      chatId = newChat.id
    } else {
      // update to set is_connected_to_agent
      const { error: updateError } = await supabase
        .from("live_chats")
        .update({ is_connected_to_agent: true })
        .eq("id", chatId)
      if (updateError) {
        return fail(500, { error: "Failed to connect to agent." })
      }
    }

    return { isConnectedToAgent: true }
  },

  /**
   * Action: closeChat
   * Closes the open chat for the user.
   */
  closeChat: async ({ locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "customer") {
      return fail(403, { error: "Not authorized to close chat." })
    }

    // find open chat
    const { data: existingChat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()

    if (!existingChat) {
      return { success: true } // nothing to close
    }

    const { error: closeErr } = await supabase
      .from("live_chats")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", existingChat.id)

    if (closeErr) {
      return fail(500, { error: "Failed to close chat." })
    }

    return { success: true }
  },
}
