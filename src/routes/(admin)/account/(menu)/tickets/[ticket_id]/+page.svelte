<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import Editor from "@tinymce/tinymce-svelte"

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
      assigned_to?: string | null
    }
    replies: {
      id: string
      user_id: string
      reply_text: string
      is_internal: boolean
      created_at?: string | null
    }[]
    userRole: string
    isAssigned: boolean
    isAssignedToMe: boolean
    employeeOptions?: { id: string; full_name: string }[]
    templates?: {
      id: string
      title: string
      content: string
      is_shared: boolean
    }[] // NEW
  }

  let ticket = data.ticket
  let replies = data.replies
  let userRole = data.userRole

  let employees = data.employeeOptions ?? []

  let replyLoading = false
  let replyError: string | null = null
  let updateLoading = false
  let updateError: string | null = null
  let claimLoading = false
  let claimError: string | null = null

  // TinyMCE API key from environment
  const TINYMCE_API_KEY = publicEnv.PUBLIC_TINYMCE_API_KEY ?? ""

  // This holds the rich-text content for a new reply
  let replyHtml = ""

  const editorConfig = {
    apiKey: TINYMCE_API_KEY,
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

  // Handle adding a new reply
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

  // Handle ticket updates (status, priority, tags, assigned_to)
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

  // Employee/Admin: claim unassigned ticket
  const handleClaimTicket: SubmitFunction = () => {
    claimLoading = true
    claimError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      claimLoading = false
      if (result.type === "failure") {
        claimError = result.data?.errorMessage || "Could not claim"
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

  // NEW: Insert a template
  function insertTemplateContent(templateId: string) {
    if (!data.templates) return
    const selected = data.templates.find((t) => t.id === templateId)
    if (selected) {
      replyHtml += (replyHtml ? "\n\n" : "") + selected.content
    }
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
      <div class="mt-2" {...{ innerHTML: ticket.description }}></div>
    </div>
  </div>

  <h2 class="text-xl font-bold mb-2">Replies</h2>
  <div class="space-y-3">
    {#each replies as r}
      <div
        class="border-l-4 pl-3 pb-2"
        style="border-color: {r.is_internal ? '#ffaa00' : '#444'};"
      >
        <p class="text-sm text-gray-600">
          {r.is_internal ? "Internal Note" : "Public Reply"}
          <span class="ml-2 text-xs">
            {#if r.created_at}
              {new Date(r.created_at).toLocaleString()}
            {/if}
          </span>
        </p>
        <div class="mt-1">
          {@html r.reply_text}
        </div>
      </div>
    {/each}
    {#if replies.length === 0}
      <p class="text-gray-500">No replies yet.</p>
    {/if}
  </div>

  <!-- Add new reply -->
  <div class="mt-8 card shadow">
    <div class="card-body">
      <h3 class="card-title">Add Reply</h3>

      <!-- Example: Template select menu (for employee/admin only) -->
      {#if (userRole === "administrator" || userRole === "employee") && data.templates && data.templates.length > 0}
        <div class="mb-3 mt-2">
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

        <!-- This hidden input is crucial for sending the replyHtml content to the server -->
        <input type="hidden" name="reply_text" value={replyHtml} />

        {#if canMarkInternal()}
          <label class="label cursor-pointer justify-start gap-3 mt-2">
            <span class="label-text">
              Mark as internal note?
              <input
                type="checkbox"
                name="is_internal"
                value="true"
                class="checkbox"
              />
            </span>
          </label>
        {/if}
        {#if replyError}
          <div class="text-red-600">{replyError}</div>
        {/if}
        <button
          class="btn btn-primary btn-sm mt-3"
          type="submit"
          disabled={replyLoading}
        >
          {replyLoading ? "Saving..." : "Add Reply"}
        </button>
      </form>
    </div>
  </div>

  <!-- Claim ticket if unassigned (employee or admin) -->
  {#if ticket.assigned_to == null && (userRole === "administrator" || userRole === "employee")}
    <form
      method="POST"
      action="?/claimTicket"
      use:enhance={handleClaimTicket}
      class="mt-4"
    >
      {#if claimError}
        <div class="text-red-600 mb-2">{claimError}</div>
      {/if}
      <button
        class="btn btn-sm btn-accent"
        type="submit"
        disabled={claimLoading}
      >
        {claimLoading ? "Claiming..." : "Claim Ticket"}
      </button>
    </form>
  {/if}

  <!-- Update ticket form (employees/admin only) -->
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
            <select
              name="priority"
              class="select select-bordered w-full max-w-xs mt-1"
            >
              <option value="high" selected={ticket.priority === "high"}
                >High</option
              >
              <option value="medium" selected={ticket.priority === "medium"}
                >Medium</option
              >
              <option value="low" selected={ticket.priority === "low"}
                >Low</option
              >
            </select>
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

          {#if userRole === "administrator"}
            <!-- Admin can assign to any employee or admin in the org -->
            <label class="block mb-2">
              <span class="text-sm font-semibold">Assigned To</span>
              <select
                name="assigned_to"
                class="select select-bordered w-full max-w-xs mt-1"
              >
                <option value=""> -- None -- </option>
                {#each employees as emp}
                  <option
                    value={emp.id}
                    selected={ticket.assigned_to === emp.id}
                  >
                    {emp.full_name}
                  </option>
                {/each}
              </select>
            </label>
          {/if}

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
