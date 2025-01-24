import { redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { chatWithOpenAIGpt4o } from "$lib/openai" // <--- import our GPT-4 function

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Only "customer" can do this page
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "customer") {
    throw redirect(303, "/account")
  }

  // Find any open chat for this user
  const { data: existingChat } = await supabase
    .from("live_chats")
    .select("id, is_connected_to_agent, closed_at")
    .eq("user_id", user.id)
    .is("closed_at", null)
    .maybeSingle()

  // If there's an open chat, fetch all messages for it
  let messages = []
  if (existingChat?.id) {
    const { data: chatMessages } = await supabase
      .from("live_chat_messages")
      .select("role, message_text, created_at")
      .eq("live_chat_id", existingChat.id)
      .order("created_at", { ascending: true })
    if (chatMessages) {
      messages = chatMessages
    }
  }

  return {
    chatId: existingChat?.id || null,
    isConnectedToAgent: existingChat?.is_connected_to_agent ?? false,
    messages,
  }
}

export const actions: Actions = {
  sendMessage: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Confirm user is customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "customer") {
      return fail(403, { error: "Not authorized to send live chat message." })
    }

    // Get form
    const formData = await request.formData()
    const message = (formData.get("message")?.toString() || "").trim()

    if (!message) {
      return fail(400, { error: "Message is required." })
    }

    // Find or create an open chat
    let { data: existingChat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()

    if (!existingChat) {
      // create a new chat
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
      existingChat = newChat
    }

    const chatId = existingChat.id

    // Insert user’s message as role = 'customer'
    const { error: insertMsgError } = await supabase
      .from("live_chat_messages")
      .insert({
        live_chat_id: chatId,
        user_id: user.id,
        role: "customer",
        message_text: message,
      })

    if (insertMsgError) {
      return fail(500, { error: "Failed to send message." })
    }

    // If chat is not yet handed off to an agent, call OpenAI for an AI reply
    if (!existingChat.is_connected_to_agent) {
      // Gather conversation so far: user & assistant messages only
      const { data: allMessages } = await supabase
        .from("live_chat_messages")
        .select("role, message_text")
        .eq("live_chat_id", chatId)
        .order("created_at", { ascending: true })

      if (allMessages) {
        // Convert DB messages to OpenAI Chat format
        // skipping any 'agent' messages
        const openAiConversation = allMessages
          .filter((m) => m.role === "customer" || m.role === "assistant")
          .map((m) => ({
            role: m.role === "customer" ? "user" : "assistant",
            content: m.message_text,
          }))

        // Add our new user message at the end
        const aiReply = await chatWithOpenAIGpt4o(openAiConversation)

        // Store the AI's response
        if (aiReply && aiReply.trim().length > 0) {
          await supabase.from("live_chat_messages").insert({
            live_chat_id: chatId,
            user_id: user.id, // or possibly user.id for consistent foreign key
            role: "assistant",
            message_text: aiReply,
          })
        }
      }
    }

    return {
      success: true,
    }
  },

  connectToAgent: async ({ locals: { supabase, safeGetSession } }) => {
    // same as before, just the user’s “Need human” button
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

    const { data: existingChat } = await supabase
      .from("live_chats")
      .select("*")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()

    let chatId = existingChat?.id
    if (!chatId) {
      // create new if doesn't exist
      const { data: newChat, error: chatErr } = await supabase
        .from("live_chats")
        .insert({
          user_id: user.id,
          is_connected_to_agent: true,
        })
        .select()
        .single()
      if (chatErr || !newChat) {
        return fail(500, { error: "Failed to start a chat for agent." })
      }
      chatId = newChat.id
    } else {
      // set is_connected_to_agent
      const { error: updateError } = await supabase
        .from("live_chats")
        .update({ is_connected_to_agent: true })
        .eq("id", chatId)
      if (updateError) {
        return fail(500, { error: "Failed to request human agent." })
      }
    }

    return { isConnectedToAgent: true }
  },

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
      .select("id")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1)
      .maybeSingle()

    if (!existingChat) {
      return { success: true }
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