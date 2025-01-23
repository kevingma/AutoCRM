<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import Editor from "@tinymce/tinymce-svelte"

  // CHANGE BELOW: import from $env/dynamic/public instead of $env/static/public
  import { env as publicEnv } from "$env/dynamic/public"

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

  // Use the dynamic public env var, or fallback to an empty string
  const TINYMCE_API_KEY = publicEnv.PUBLIC_TINYMCE_API_KEY ?? ""

  // For the rich text editor
  let replyHtml = ""
  const editorConfig = {
    apiKey: TINYMCE_API_KEY, // pass the key here
    height: 300,
    menubar: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "charmap",
      "preview",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "table",
      "wordcount",
    ],
    toolbar:
      "undo redo | formatselect | " +
      "bold italic | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist | " +
      "removeformat",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
  }

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
      <!-- Show existing description as HTML (assuming it may contain HTML) -->
      <p class="mt-4">{@html ticket.description}</p>
      {#if ticket.created_at}
        <div class="text-xs text-slate-500 mt-2">
          Created: {new Date(ticket.created_at).toLocaleString()}
        </div>
      {/if}
    </div>
  </div>

  <h2 class="text-xl font-bold mb-2">Replies</h2>
  <div class="space-y-3">
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
          <!-- Render reply as HTML -->
          <div class="mt-2">
            {@html reply.reply_text}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Add a new reply (rich text) -->
  <div class="mt-8 card shadow">
    <div class="card-body">
      <h3 class="card-title">Add Reply</h3>
      <form
        method="POST"
        action="?/addReply"
        use:enhance={handleAddReply}
        class="mt-2"
      >
        <label for="reply-editor" class="block font-semibold mb-1">Reply</label>
        <Editor
          apiKey={TINYMCE_API_KEY}
          conf={editorConfig}
          bind:value={replyHtml}
          id="reply-editor"
        />
        <!-- Hidden input to submit the HTML content -->
        <input type="hidden" name="reply_text" value={replyHtml} />

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

  <!-- Allow ticket status/priority updates (for employees/admin) -->
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
              <option value="open" selected={ticket.status === "open"}>
                Open
              </option>
              <option
                value="in_progress"
                selected={ticket.status === "in_progress"}
              >
                In Progress
              </option>
              <option value="closed" selected={ticket.status === "closed"}>
                Closed
              </option>
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
