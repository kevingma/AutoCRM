<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import { page } from "$app/stores"
  import { onMount, afterUpdate } from "svelte"

  export let data: {
    chatId: string | null
    isConnectedToAgent: boolean
    messages: {
      role: string
      message_text: string
      created_at: string | null
    }[]
  }

  let messageText = ""
  let sending = false
  let sendError: string | null = null

  let scrollContainer: HTMLDivElement | null = null

  function scrollToBottom() {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }

  onMount(() => {
    scrollToBottom()
  })
  afterUpdate(() => {
    scrollToBottom()
  })

  // Submit user’s message -> calls "sendMessage" action
  const handleSendMessage: SubmitFunction = () => {
    sending = true
    sendError = null
    return async ({ result, update }) => {
      await update({ reset: false }) // do not reset the entire form
      sending = false
      if (result.type === "failure") {
        sendError = result?.data?.error || "Failed to send"
      } else if (result.type === "success") {
        // clear the input, let load() re-run
        messageText = ""
        // We can also use `invalidate()` if we want to re-fetch. But you can rely on SvelteKit to re-load or use a store for real-time updates.
        // For simplicity, let's just do a quick manual reload:
        location.reload()
      }
    }
  }

  // For "Need Human"
  const handleNeedHuman: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        sendError = result?.data?.error || "Failed to connect to agent"
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  // For "End Chat"
  const handleCloseChat: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update({ reset: false })
      // Once ended, let's reload or redirect
      location.reload()
    }
  }

  function displayName(role: string) {
    if (role === "customer") return "You"
    if (role === "assistant") return "AI"
    if (role === "agent") return "Agent"
    return "System"
  }

  function messageBubbleClass(role: string) {
    // user => chat-start, assistant => chat-end, agent => chat-end, etc.
    if (role === "customer") return "chat chat-start"
    return "chat chat-end"
  }

  // Optional different color classes
  function bubbleColor(role: string) {
    if (role === "assistant") return "bg-base-200"
    if (role === "agent") return "bg-purple-200"
    if (role === "customer") return "bg-blue-200"
    return "bg-gray-200"
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
    {#if data.messages.length === 0}
      <div class="text-gray-500 text-sm mt-4">
        Start by typing a message below!
      </div>
    {:else}
      {#each data.messages as msg}
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
