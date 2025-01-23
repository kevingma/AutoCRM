<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  export let data: {
    ticket: {
      id: string
      user_id: string
      title: string
      description: string
      status: string
      priority?: string | null
      tags?: string[] | null
      created_at?: string | null
    }
    replies: {
      id: string
      user_id: string
      reply_text: string
      is_internal: boolean
      created_at?: string | null
    }[]
    userRole: string
  }

  let ticket = data.ticket
  let replies = data.replies
  let userRole = data.userRole

  let replyLoading = false
  let replyError: string | null = null
  let updateLoading = false
  let updateError: string | null = null

  const handleAddReply: SubmitFunction = () => {
    replyLoading = true
    replyError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      replyLoading = false
      if (result.type === "failure") {
        replyError = result.data?.errorMessage || "Unknown error"
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  const handleUpdateTicket: SubmitFunction = () => {
    updateLoading = true
    updateError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      updateLoading = false
      if (result.type === "failure") {
        updateError = result.data?.errorMessage || "Unknown error"
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  function canMarkInternal() {
    return userRole === "administrator" || userRole === "employee"
  }

  function canUpdateTicket() {
    return userRole === "administrator" || userRole === "employee"
  }
</script>

<svelte:head>
  <title>Ticket Details</title>
</svelte:head>

<div class="max-w-3xl">
  <h1 class="text-2xl font-bold mb-3">Ticket Details</h1>

  <div class="card shadow mb-6">
    <div class="card-body">
      <h2 class="card-title">{ticket.title}</h2>
      <div class="text-sm text-slate-600">
        Status: <span class="font-bold">{ticket.status}</span>
      </div>
      {#if ticket.priority}
        <div class="text-sm text-slate-600">
          Priority: <span class="font-bold">{ticket.priority}</span>
        </div>
      {/if}
      {#if ticket.tags && ticket.tags.length > 0}
        <div class="text-sm text-slate-600">
          Tags:
          {#each ticket.tags as tag}
            <span class="badge badge-outline badge-sm ml-1">{tag}</span>
          {/each}
        </div>
      {/if}
      <p class="mt-4">{ticket.description}</p>
      {#if ticket.created_at}
        <div class="text-xs text-slate-500 mt-2">
          Created: {new Date(ticket.created_at).toLocaleString()}
        </div>
      {/if}
    </div>
  </div>

  <h2 class="text-xl font-bold mb-2">Replies</h2>
  <div class="space-y-3">
    <!-- Removed ', i' from the loop to eliminate unused variable -->
    {#each replies as reply}
      <div class="card shadow">
        <div class="card-body">
          <div class="text-sm text-slate-600">
            {#if reply.is_internal}
              <span class="badge badge-warning mr-2">Internal Note</span>
            {/if}
            <span class="italic">User: {reply.user_id}</span>
            {#if reply.created_at}
              <span class="ml-2 text-xs text-slate-500"
                >{new Date(reply.created_at).toLocaleString()}</span
              >
            {/if}
          </div>
          <p class="mt-2">{reply.reply_text}</p>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-8 card shadow">
    <div class="card-body">
      <h3 class="card-title">Add Reply</h3>
      <form
        method="POST"
        action="?/addReply"
        use:enhance={handleAddReply}
        class="mt-2"
      >
        <textarea
          name="reply_text"
          rows="3"
          placeholder="Your reply"
          class="textarea textarea-bordered w-full mb-3"
        ></textarea>
        {#if canMarkInternal()}
          <label class="label cursor-pointer justify-start gap-3">
            <span class="label-text">Mark as internal note?</span>
            <input
              type="checkbox"
              name="is_internal"
              value="true"
              class="checkbox"
            />
          </label>
        {/if}
        {#if replyError}
          <div class="text-red-600">{replyError}</div>
        {/if}
        <button
          class="btn btn-primary btn-sm"
          type="submit"
          disabled={replyLoading}
        >
          {replyLoading ? "Saving..." : "Add Reply"}
        </button>
      </form>
    </div>
  </div>

  {#if canUpdateTicket()}
    <div class="mt-8 card shadow">
      <div class="card-body">
        <h3 class="card-title">Update Ticket</h3>
        <form
          method="POST"
          action="?/updateTicket"
          use:enhance={handleUpdateTicket}
          class="mt-2"
        >
          <label class="block mb-2">
            <span class="text-sm font-semibold">Status</span>
            <select
              name="status"
              class="select select-bordered w-full max-w-xs mt-1"
            >
              <option value="open" selected={ticket.status === "open"}
                >Open</option
              >
              <option
                value="in_progress"
                selected={ticket.status === "in_progress"}
              >
                In Progress
              </option>
              <option value="closed" selected={ticket.status === "closed"}
                >Closed</option
              >
            </select>
          </label>

          <label class="block mb-2">
            <span class="text-sm font-semibold">Priority</span>
            <input
              type="text"
              name="priority"
              value={ticket.priority ?? ""}
              placeholder="e.g. High, Medium, Low"
              class="input input-bordered w-full max-w-xs mt-1"
            />
          </label>

          <label class="block mb-2">
            <span class="text-sm font-semibold">Tags (comma separated)</span>
            <input
              type="text"
              name="tags"
              value={ticket.tags?.join(",") ?? ""}
              placeholder="e.g. bug,urgent"
              class="input input-bordered w-full max-w-xs mt-1"
            />
          </label>

          {#if updateError}
            <div class="text-red-600 mt-2">{updateError}</div>
          {/if}

          <button
            class="btn btn-accent btn-sm mt-2"
            type="submit"
            disabled={updateLoading}
          >
            {updateLoading ? "Saving..." : "Update Ticket"}
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>
