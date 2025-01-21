<script lang="ts">
  import { page } from "$app/stores"
  import { enhance, applyAction } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("tickets")

  export let data: {
    ticket: {
      id: string
      user_id: string
      title: string
      description: string
      status: string
      created_at: string
    } | null
    replies: {
      id: string
      user_id: string
      reply_text: string
      created_at: string
    }[]
    canReply: boolean
    form?: {
      errorMessage?: string
    }
  }

  const handleReply: SubmitFunction = () => {
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "success") {
        // reload
        location.reload()
      }
    }
  }
</script>

<svelte:head>
  <title>Ticket Detail</title>
</svelte:head>

{#if !data.ticket}
  <h2 class="text-xl">Ticket not found or no permission</h2>
{:else}
  <h2 class="text-2xl font-bold mb-2">Ticket: {data.ticket.title}</h2>
  <div class="bg-base-200 p-4 rounded">
    <p class="text-sm text-gray-700 mb-2">
      Created at: {new Date(data.ticket.created_at).toLocaleString()}
    </p>
    <p class="text-base mb-3">{data.ticket.description}</p>
    <p class="text-sm font-semibold">
      Status: {data.ticket.status.toUpperCase()}
    </p>
  </div>

  <h3 class="text-xl font-bold mt-6">Replies</h3>
  {#if data.replies.length === 0}
    <div class="text-sm text-gray-500 my-2">No replies yet.</div>
  {:else}
    <div class="space-y-3 mt-3">
      {#each data.replies as r}
        <div class="bg-base-200 p-2 rounded">
          <div class="text-sm italic text-gray-600">
            {new Date(r.created_at).toLocaleString()}
          </div>
          <div class="mt-1">{r.reply_text}</div>
        </div>
      {/each}
    </div>
  {/if}

  {#if data.canReply}
    <form method="POST" action="?/reply" use:enhance={handleReply} class="mt-8">
      <textarea
        name="reply_text"
        rows="3"
        class="textarea textarea-bordered w-full"
        placeholder="Type your reply here..."
      ></textarea>
      {#if data.form?.errorMessage}
        <div class="text-red-600 font-semibold mt-1">
          {data.form.errorMessage}
        </div>
      {/if}
      <button class="btn btn-primary mt-2">Submit Reply</button>
    </form>
  {:else}
    <div class="text-sm text-gray-500 mt-4">
      You do not have permission to reply to this ticket.
    </div>
  {/if}
{/if}
