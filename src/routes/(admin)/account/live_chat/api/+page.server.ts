import { fail, redirect } from "@sveltejs/kit"
import { chatWithOpenAIGpt4o } from "$lib/openai"
import type { Actions, PageServerLoad } from "./$types"
import type { ChatCompletionRequestMessage } from "openai"

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()
  if (!session) {
    throw redirect(303, "/login")
  }

  // No special data needed for the user chat page load
  return {}
}

/**
 * The user can:
 *  - sendMessage: sends a user message, 
 *    if not connected to agent => get GPT-4 reply 
 *  - connectToAgent: sets is_connected_to_agent = true
 *  - closeChat: sets closed_at
 */
export const actions: Actions = {
  /**
   * Create or fetch an open live_chat for this user, 
   * then record the user's message, 
   * optionally call GPT-4 and store the assistant response (role='assistant').
   */
  sendMessage: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    if (!session) {
      throw redirect(303, "/login")
    }
    const user_id = session.user.id

    const formData = await request.formData()
    const userMessage = formData.get("message")?.toString() ?? ""

    if (!userMessage) {
      return fail(400, { error: "Message cannot be empty." })
    }

    // 1) find an existing chat that is not closed
    let { data: existingChat, error: chatError } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user_id)
      .is("closed_at", null)
      .single()

    if (chatError && chatError.code !== "PGRST116") {
      // PGRST116 => no rows
      console.error("Error looking up chat:", chatError)
      return fail(500, { error: "Could not lookup chat." })
    }

    // 2) If no existing chat, create one
    if (!existingChat) {
      const { data: newChat, error: newChatError } = await supabase
        .from("live_chats")
        .insert({ user_id })
        .select("*")
        .single()
      if (newChatError || !newChat) {
        console.error("Error creating chat:", newChatError)
        return fail(500, { error: "Could not create chat." })
      }
      existingChat = newChat
    }

    // 3) Insert the user's message
    const { data: msgInsert, error: msgError } = await supabase
      .from("live_chat_messages")
      .insert({
        live_chat_id: existingChat.id,
        user_id,
        role: "user",
        message_text: userMessage,
      })
      .select("*")
      .single()
    if (msgError || !msgInsert) {
      console.error("Error inserting user message:", msgError)
      return fail(500, { error: "Could not store user message." })
    }

    // If chat is not connected to agent => respond with GPT-4
    let assistantReply = ""
    if (!existingChat.is_connected_to_agent) {
      // gather last ~10 messages from this chat for context
      const { data: recentMsgs } = await supabase
        .from("live_chat_messages")
        .select("role,message_text")
        .eq("live_chat_id", existingChat.id)
        .order("created_at", { ascending: true })
        .limit(10)

      // Convert to openAI format
      const openaiMessages: ChatCompletionRequestMessage[] = recentMsgs?.map(
        (m) => ({
          role:
            m.role === "agent" || m.role === "assistant"
              ? "assistant"
              : m.role === "system"
              ? "system"
              : "user",
          content: m.message_text ?? "",
        }),
      ) ?? []

      assistantReply = await chatWithOpenAIGpt4o(openaiMessages)

      // store assistant reply
      const { error: storeAssistantError } = await supabase
        .from("live_chat_messages")
        .insert({
          live_chat_id: existingChat.id,
          role: "assistant",
          message_text: assistantReply,
        })
      if (storeAssistantError) {
        console.error("Error storing assistant reply:", storeAssistantError)
      }
    }

    return {
      success: true,
      chatId: existingChat.id,
      assistantReply,
      isConnectedToAgent: existingChat.is_connected_to_agent,
    }
  },

  /**
   * The user toggles to connect with a live agent
   */
  connectToAgent: async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    if (!session) {
      throw redirect(303, "/login")
    }
    const user_id = session.user.id

    // find an existing open chat
    const { data: existingChat, error } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user_id)
      .is("closed_at", null)
      .single()

    if (!existingChat || error) {
      return fail(404, { error: "No open chat found to connect to agent." })
    }

    // set is_connected_to_agent = true
    const { error: updateError } = await supabase
      .from("live_chats")
      .update({ is_connected_to_agent: true })
      .eq("id", existingChat.id)

    if (updateError) {
      console.error("Error connecting to agent:", updateError)
      return fail(500, { error: "Could not update chat." })
    }

    return { success: true }
  },

  /**
   * The user closes the chat
   */
  closeChat: async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    if (!session) {
      throw redirect(303, "/login")
    }
    const user_id = session.user.id

    // find open chat
    const { data: existingChat, error } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user_id)
      .is("closed_at", null)
      .single()

    if (!existingChat || error) {
      return fail(404, { error: "No open chat to close." })
    }

    const { error: closeError } = await supabase
      .from("live_chats")
      .update({ closed_at: new Date() })
      .eq("id", existingChat.id)

    if (closeError) {
      console.error("Error closing chat:", closeError)
      return fail(500, { error: "Could not close chat." })
    }
    return { success: true }
  },
}
