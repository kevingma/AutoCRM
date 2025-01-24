<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import { onMount } from "svelte"

  // Mark the nav tab as active:
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("live_chat_agent")

  export let data: {
    chat: {
      id: string
      user_id: string
      agent_id: string | null
      is_connected_to_agent: boolean
      created_at: string | null
      closed_at: string | null
    }
    messages: {
      id: string
      user_id: string
      role: string
      message_text: string
      created_at: string | null
    }[]
    userRole: string
    isAssigned: boolean
    isAssignedToMe: boolean

    // Additional: pass an array of agent response templates (or load them via universal fetch).
    // We'll pretend they've been loaded here:
    templates?: {
      id: string
      title: string
      content: string
    }[]
  }

  let joinError: string | null = null
  let joinLoading = false

  const handleJoinChat: SubmitFunction = () => {
    joinLoading = true
    joinError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      joinLoading = false
      if (result.type === "failure") {
        joinError = result.data?.error ?? "Could not join chat."
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  let sendError: string | null = null
  let sendLoading = false

  const handleSendMsg: SubmitFunction = () => {
    sendLoading = true
    sendError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      sendLoading = false
      if (result.type === "failure") {
        sendError = result.data?.error ?? "Failed to send message"
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  let closeError: string | null = null
  let closeLoading = false

  const handleCloseChat: SubmitFunction = () => {
    closeLoading = true
    closeError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      closeLoading = false
      if (result.type === "failure") {
        closeError = result.data?.error ?? "Failed to close chat"
      } else if (result.type === "success") {
        // redirect back to chat list
        window.location.href = "/account/live_chat_agent"
      }
    }
  }

  // Our typed message for the agent
  let newMessage = ""

  // Insert template function
  function insertTemplateContent(templateId: string) {
    if (!data.templates) return
    const selected = data.templates.find((t) => t.id === templateId)
    if (selected) {
      // Append to existing text, or replace entirely as you prefer:
      newMessage += (newMessage ? "\n\n" : "") + selected.content
    }
  }
</script>

<svelte:head>
  <title>Agent Chat: {data.chat.id.slice(0, 8)}...</title>
</svelte:head>

<div class="max-w-2xl mx-auto py-4">
  <h1 class="text-2xl font-bold mb-3">Agent Chat</h1>

  <!-- Chat Info -->
  <div class="card shadow mb-6">
    <div class="card-body">
      <h2 class="card-title">
        Chat ID: <span class="font-mono text-sm">{data.chat.id}</span>
      </h2>
      <div class="text-sm">
        <p>User ID: {data.chat.user_id}</p>
        <p>Agent ID: {data.chat.agent_id || "None"}</p>
        {#if data.chat.created_at}
          <p>Created: {new Date(data.chat.created_at).toLocaleString()}</p>
        {/if}
      </div>
      <div class="text-sm text-slate-600">
        {#if data.chat.closed_at}
          <span class="text-red-500 font-bold">Closed</span>
          <p>Closed at: {new Date(data.chat.closed_at).toLocaleString()}</p>
        {:else}
          <span class="text-green-700 font-bold">Open</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- If not assigned, button to join -->
  {#if !data.isAssigned}
    <form method="POST" action="?/joinChat" use:enhance={handleJoinChat}>
      {#if joinError}
        <div class="text-red-600 mb-2">{joinError}</div>
      {/if}
      <button class="btn btn-primary" disabled={joinLoading}>
        {joinLoading ? "Joining..." : "Take This Chat"}
      </button>
    </form>
  {:else if !data.isAssignedToMe && data.userRole !== "administrator"}
    <p class="mb-4 text-slate-600">
      Another agent is assigned to this chat. If you are an admin, you can still
      forcibly join or close, but otherwise you won't be able to reply.
    </p>
  {/if}

  <!-- Show existing messages -->
  <div class="my-6">
    <h3 class="text-lg font-semibold mb-1">Messages</h3>
    {#each data.messages as msg}
      <div
        class="border-l-4 mb-3 pl-2"
        style="border-color: {msg.role === 'agent' ? 'var(--p)' : '#999'};"
      >
        <div class="text-sm text-gray-500">
          {msg.role === "agent" ? "Agent" : msg.role} –
          {#if msg.created_at}
            {new Date(msg.created_at).toLocaleString()}
          {/if}
        </div>
        <div class="mt-1">{msg.message_text}</div>
      </div>
    {/each}
    {#if data.messages.length === 0}
      <p class="text-gray-500">No messages yet.</p>
    {/if}
  </div>

  <!-- If assigned to me or I'm an admin, show reply form -->
  {#if (data.isAssignedToMe || data.userRole === "administrator") && !data.chat.closed_at}
    <div class="card shadow mb-8">
      <div class="card-body">
        <h3 class="card-title">Send a Message</h3>

        <!-- Example: Template select menu -->
        {#if data.templates && data.templates.length > 0}
          <div class="mb-3">
            <label for="templateSelect" class="block mb-1 text-sm"
              >Insert Template</label
            >
            <select
              id="templateSelect"
              class="select select-bordered w-full max-w-sm"
              on:change={(evt) =>
                insertTemplateContent((evt.target as HTMLSelectElement).value)}
            >
              <option value="">-- Choose Template --</option>
              {#each data.templates as t}
                <option value={t.id}>{t.title}</option>
              {/each}
            </select>
          </div>
        {/if}

        <form
          method="POST"
          action="?/sendAgentMessage"
          use:enhance={handleSendMsg}
        >
          <input type="hidden" name="chatId" value={data.chat.id} />

          <label for="agentMessage" class="block mt-2 mb-1 font-semibold">
            Message
          </label>
          <textarea
            id="agentMessage"
            name="message"
            rows="3"
            class="textarea textarea-bordered w-full"
            bind:value={newMessage}
          ></textarea>

          {#if sendError}
            <div class="text-red-600 mt-2">{sendError}</div>
          {/if}
          <button
            class="btn btn-sm btn-primary mt-3"
            type="submit"
            disabled={sendLoading}
          >
            {sendLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  {/if}

  <!-- Close chat button (if assigned to me or admin) -->
  {#if (data.isAssignedToMe || data.userRole === "administrator") && !data.chat.closed_at}
    <form method="POST" action="?/closeChat" use:enhance={handleCloseChat}>
      {#if closeError}
        <div class="text-red-600 mb-2">{closeError}</div>
      {/if}
      <button class="btn btn-warning" disabled={closeLoading}>
        {closeLoading ? "Closing..." : "Close Chat"}
      </button>
    </form>
  {/if}
</div>
