<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  export let data: {
    openChats: {
      id: string
      user_id: string
      agent_id: string | null
      is_connected_to_agent: boolean
      created_at: string | null
      closed_at: string | null
    }[]
    role: string
  }

  let adminSection: Writable<string> = getContext("adminSection")
  // Use "live_chat_agent" to highlight the nav
  adminSection.set("live_chat_agent")

  function joinChat(chatId: string) {
    const formData = new FormData()
    formData.append("chatId", chatId)
    fetch("?/joinChat", {
      method: "POST",
      body: formData,
    }).then(() => {
      location.reload()
    })
  }

  function closeChat(chatId: string) {
    const formData = new FormData()
    formData.append("chatId", chatId)
    fetch("?/closeChat", {
      method: "POST",
      body: formData,
    }).then(() => {
      location.reload()
    })
  }
</script>

<svelte:head>
  <title>Agent Live Chats</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Agent Live Chats</h1>
<p class="text-sm">
  Below are user chats that have requested an agent or are assigned to you.
</p>

{#if data.openChats.length === 0}
  <div class="mt-4">No active chats.</div>
{:else}
  <div class="overflow-x-auto mt-4">
    <table class="table w-full">
      <thead>
        <tr>
          <th>Chat ID</th>
          <th>Created At</th>
          <th>Agent</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.openChats as chat}
          <tr>
            <td>
              <a
                href={"/account/live_chat_agent/" + chat.id}
                class="link link-primary"
              >
                {chat.id.slice(0, 8)}...
              </a>
            </td>
            <td>{chat.created_at}</td>
            <td>{chat.agent_id ? chat.agent_id : "Unassigned"}</td>
            <td>
              {#if !chat.agent_id}
                <button
                  class="btn btn-sm btn-primary"
                  on:click={() => joinChat(chat.id)}
                >
                  Take Chat
                </button>
              {:else}
                <button
                  class="btn btn-sm btn-warning"
                  on:click={() => closeChat(chat.id)}
                >
                  Close Chat
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
