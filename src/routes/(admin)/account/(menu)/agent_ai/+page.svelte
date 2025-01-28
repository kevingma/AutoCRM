<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import { onMount } from "svelte"

  /**
   * We receive data from +page.server.ts, which currently returns an empty
   * messages array. We'll manage messages locally (ephemerally).
   */
  export let data: {
    messages: { role: string; content: string }[] // from server load
    // ...you could include other fields as needed
  }

  // We'll keep a local array of all chat messages, including user & agent
  let chatMessages = [...data.messages]

  // The user's current input text
  let userMessage = ""
  let sending = false
  let errorMessage = ""

  // Called upon form submit
  const handleSend: SubmitFunction = () => {
    errorMessage = ""
    sending = true

    return async ({ result, update }) => {
      // update = function that merges the returned form data into $page.form
      // we don't rely on $page.form for storing the chat, so we pass `reset: false`
      await update({ reset: false })
      sending = false

      if (result.type === "failure") {
        // The server returned a fail(...) response
        errorMessage = result.data?.error ?? "Error sending message."
      } else if (result.type === "success") {
        /**
         * The server action returns { response: "...some text..." }
         * We'll push the user's message and the agent's response to our local array.
         */
        // Add user message
        chatMessages.push({ role: "user", content: userMessage })

        // Add agent's response from result.data.response
        const agentReply = result.data?.response || "No response"
        chatMessages.push({ role: "assistant", content: agentReply })

        // Clear the text input
        userMessage = ""
      }
    }
  }
</script>

<!-- A simple Chat UI -->
<div class="max-w-xl mx-auto pt-6 px-4">
  <h1 class="text-2xl font-bold mb-4">AI Agent Assistant</h1>
  <p class="text-sm text-gray-500 mb-4">
    Ask the AI to manage tickets, employees, or other tasks. It can perform
    actions like updating ticket status, replying to tickets, assigning
    employees, and more.
  </p>

  <!-- Chat messages list -->
  <div
    class="border border-base-300 rounded p-3 h-[60vh] overflow-auto space-y-4"
  >
    {#each chatMessages as msg, i}
      <div
        class="flex flex-col mb-2"
        style="align-items: {msg.role === 'user' ? 'flex-end' : 'flex-start'};"
      >
        <div
          class="rounded-lg px-3 py-2 whitespace-pre-wrap text-sm my-1 shadow-sm border border-base-200"
          class:bg-primary={msg.role === "user"}
          class:text-primary-foreground={msg.role === "user"}
          style="max-width: 80%;"
        >
          <strong>{msg.role === "user" ? "You" : "Agent"}:</strong>
          {msg.content}
        </div>
      </div>
    {/each}
  </div>

  <!-- Send message form -->
  <form
    method="POST"
    action="?/send"
    use:enhance={handleSend}
    class="mt-4 flex flex-col gap-2"
  >
    <textarea
      name="userMessage"
      rows="3"
      class="textarea textarea-bordered w-full"
      bind:value={userMessage}
      placeholder="Ask the agent to do something..."
    ></textarea>
    {#if errorMessage}
      <div class="text-red-600 text-sm">{errorMessage}</div>
    {/if}
    <button class="btn btn-primary self-end" type="submit" disabled={sending}>
      {sending ? "Sending..." : "Send"}
    </button>
  </form>
</div>
