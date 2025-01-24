<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import { page } from "$app/stores"
  import { onMount, afterUpdate } from "svelte"

  /**
   * Passed in from +page.server.ts:
   *   data.chatId (string|null)
   *   data.isConnectedToAgent (boolean)
   *   data.messages (array of existing messages)
   *
   * We also need to access supabase from $page.data
   *   let supabase = $page.data.supabase
   */
  export let data: {
    chatId: string | null
    isConnectedToAgent: boolean
    messages: {
      role: string
      message_text: string
      created_at: string | null
    }[]
  }

  // We will manage messages locally
  let messages = [...data.messages]

  // Text typed by the user for the next message
  let messageText = ""
  let sending = false
  let sendError: string | null = null

  // Scroll container ref
  let scrollContainer: HTMLDivElement | null = null

  // Get the supabase client from the page data
  let supabase
  $: supabase = $page.data.supabase

  // Auto-scroll to bottom whenever messages update
  function scrollToBottom() {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }
  onMount(() => {
    scrollToBottom()
    // If a chatId exists, subscribe to new messages in real-time
    if (data.chatId) {
      const channel = supabase
        .channel(`realtime:live_chat_messages:${data.chatId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "live_chat_messages",
            filter: `live_chat_id=eq.${data.chatId}`,
          },
          (payload) => {
            // The 'payload.new' contains the newly inserted message row
            const newMsg = payload.new
            // If it's not already in our local messages, push it
            // (We assume 'id' is unique, or you can check by matching other fields)
            if (!messages.find((m) => m.id === newMsg.id)) {
              messages = [...messages, newMsg]
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  })

  afterUpdate(() => {
    scrollToBottom()
  })

  // Instead of full page reload, we just call the form action once
  // and let real-time handle the new AI/agent messages
  const handleSendMessage: SubmitFunction = () => {
    sending = true
    sendError = null
    return async ({ result, update }) => {
      await update({ reset: false })
      sending = false
      if (result.type === "failure") {
        sendError = result?.data?.error || "Failed to send"
      } else if (result.type === "success") {
        // Clear the input but don't reload the page
        messageText = ""
        // The real-time listener will pick up the AI/agent response
      }
    }
  }

  const handleNeedHuman: SubmitFunction = () => {
    sendError = null
    return async ({ result, update }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        sendError = result?.data?.error || "Failed to connect to agent"
      } else if (result.type === "success") {
        // No reload needed; isConnectedToAgent would update if reloaded, but for now
        // let's just assume the user will see an agent join eventually
      }
    }
  }

  const handleCloseChat: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update({ reset: false })
      // If success, you can clear the local messages or redirect
      // For simplicity, let's just do a local reset
      if (result.type === "success") {
        messages = []
      }
    }
  }

  // Show "You" messages on the right, AI/agent on the left
  function messageBubbleClass(role: string) {
    // Customer (the user) is on the right
    if (role === "customer") return "chat chat-end"
    // Agent / Assistant on the left
    return "chat chat-start"
  }

  // Use different bubble colors
  function bubbleColor(role: string) {
    if (role === "customer") return "bg-blue-200"
    // AI or agent can remain gray / purple
    if (role === "assistant") return "bg-base-200"
    if (role === "agent") return "bg-purple-200"
    return "bg-gray-200"
  }

  function displayName(role: string) {
    if (role === "customer") return "You"
    if (role === "assistant") return "AI"
    if (role === "agent") return "Agent"
    return "System"
  }
</script>

<svelte:head>
  <title>Live Chat</title>
</svelte:head>

<div class="max-w-xl mx-auto py-4 flex flex-col gap-4 h-[80vh]">
  <h1 class="text-2xl font-bold">Live Chat with AI</h1>

  <!-- Chat Window -->
  <div
    bind:this={scrollContainer}
    class="flex-1 overflow-auto border border-base-200 rounded p-2"
  >
    {#if messages.length === 0}
      <div class="text-gray-500 text-sm mt-4">
        Start by typing a message below!
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        <div class="{messageBubbleClass(msg.role)} my-2">
          <div class="chat-header text-sm mb-1">
            {displayName(msg.role)}
            <span class="text-xs text-gray-400 ml-2">
              {#if msg.created_at}
                {new Date(msg.created_at).toLocaleTimeString()}
              {/if}
            </span>
          </div>
          <div class="chat-bubble {bubbleColor(msg.role)}">
            {msg.message_text}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Buttons: "Need Human" + "End Chat" -->
  <div class="flex justify-between items-center">
    <form method="POST" action="?/connectToAgent" use:enhance={handleNeedHuman}>
      <button
        type="submit"
        class="btn btn-secondary"
        disabled={data.isConnectedToAgent}
      >
        {data.isConnectedToAgent ? "Agent Requested" : "Need Human"}
      </button>
    </form>

    <form method="POST" action="?/closeChat" use:enhance={handleCloseChat}>
      <button type="submit" class="btn btn-warning">End Chat</button>
    </form>
  </div>

  <!-- Send message form -->
  <form
    method="POST"
    action="?/sendMessage"
    use:enhance={handleSendMessage}
    class="flex flex-col gap-2"
  >
    <textarea
      name="message"
      class="textarea textarea-bordered w-full"
      rows="2"
      bind:value={messageText}
      placeholder="Type your message..."
    ></textarea>

    {#if sendError}
      <div class="text-red-600 font-semibold">{sendError}</div>
    {/if}

    <button class="btn btn-primary self-end" type="submit" disabled={sending}>
      {sending ? "Sending..." : "Send"}
    </button>
  </form>
</div>
