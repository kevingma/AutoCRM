<script lang="ts">
  import { enhance, applyAction } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  let messageError: string | null = null
  let loading = false
  let lastAssistantReply: string = ""
  let connectedToAgent = false

  const handleSendMessage: SubmitFunction = () => {
    loading = true
    messageError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      loading = false
      if (result.type === "failure") {
        messageError = result.data?.error ?? "Failed to send message."
      } else if (result.type === "success") {
        if (result.data.assistantReply) {
          lastAssistantReply = result.data.assistantReply
        }
        connectedToAgent = !!result.data.isConnectedToAgent
      }
    }
  }

  const handleConnectAgent: SubmitFunction = () => {
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        messageError = result.data?.error ?? "Failed to connect to agent."
      } else {
        connectedToAgent = true
      }
    }
  }

  const handleCloseChat: SubmitFunction = () => {
    return async ({ update }) => {
      await update({ reset: false })
      // Just reload or navigate away
      location.reload()
    }
  }
</script>

<svelte:head>
  <title>Live Chat</title>
</svelte:head>

<div class="max-w-xl mx-auto py-4">
  <h1 class="text-2xl font-bold mb-4">Live Chat</h1>

  <form
    method="POST"
    action="?/sendMessage"
    use:enhance={handleSendMessage}
    class="mb-4"
  >
    <label for="message" class="block font-semibold mb-1">Message</label>
    <textarea
      id="message"
      name="message"
      rows="3"
      class="textarea textarea-bordered w-full mb-2"
    ></textarea>
    {#if messageError}
      <div class="text-red-600 mb-2">{messageError}</div>
    {/if}
    <button class="btn btn-primary" type="submit" disabled={loading}>
      {loading ? "Sending..." : "Send Message"}
    </button>
  </form>

  {#if lastAssistantReply}
    <div class="alert alert-info shadow-sm mb-4">
      <div>
        <span class="font-bold">AI Reply:</span>
        <span>{lastAssistantReply}</span>
      </div>
    </div>
  {/if}

  {#if !connectedToAgent}
    <form
      method="POST"
      action="?/connectToAgent"
      use:enhance={handleConnectAgent}
    >
      <button class="btn btn-accent" type="submit"> Connect to Agent </button>
    </form>
  {:else}
    <div class="mb-4">
      <p class="text-green-700">
        You are connected to a live agent. Please continue sending messages
        above.
      </p>
    </div>
    <form method="POST" action="?/closeChat" use:enhance={handleCloseChat}>
      <button class="btn btn-warning" type="submit"> Close Chat </button>
    </form>
  {/if}
</div>
