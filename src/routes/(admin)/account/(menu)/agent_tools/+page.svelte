<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  export let data: {
    personalTemplates: {
      id: string
      title: string
      content: string
      is_shared: boolean
      created_at: string | null
    }[]
    sharedTemplates: {
      id: string
      title: string
      content: string
      is_shared: boolean
      created_at: string | null
    }[]
    form?: {
      error?: string
    }
  }

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("agent_tools")

  let createError: string | null = null
  let updateError: string | null = null
  let deleteError: string | null = null

  let newTitle = ""
  let newContent = ""
  let newIsShared = false

  let editingTemplateId: string | null = null
  let editingTitle = ""
  let editingContent = ""
  let editingIsShared = false

  const handleCreate: SubmitFunction = () => {
    createError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        createError = result.data?.error || "Unable to create template."
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  const handleUpdate: SubmitFunction = () => {
    updateError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        updateError = result.data?.error || "Unable to update template."
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  const handleDelete: SubmitFunction = () => {
    deleteError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        deleteError = result.data?.error || "Unable to delete template."
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  function startEditing(tmpl: {
    id: string
    title: string
    content: string
    is_shared: boolean
  }) {
    editingTemplateId = tmpl.id
    editingTitle = tmpl.title
    editingContent = tmpl.content
    editingIsShared = tmpl.is_shared
  }
</script>

<svelte:head>
  <title>Agent Tools</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">Agent Tools</h1>

  <h2 class="text-xl font-semibold mb-2">Create New Template</h2>
  <form method="POST" action="?/createTemplate" use:enhance={handleCreate}>
    <div class="mb-2">
      <label class="block mb-1">Title</label>
      <input
        type="text"
        name="title"
        bind:value={newTitle}
        class="input input-bordered w-full max-w-xl"
      />
    </div>
    <div class="mb-2">
      <label class="block mb-1">Content</label>
      <textarea
        name="content"
        rows="3"
        bind:value={newContent}
        class="textarea textarea-bordered w-full max-w-xl"
      ></textarea>
    </div>
    <!-- Updated label to nest the input for a11y -->
    <label class="label cursor-pointer gap-2">
      <span class="label-text">Shared (visible to all employees)?</span>
      <input
        type="checkbox"
        name="is_shared"
        value="true"
        bind:checked={newIsShared}
        class="checkbox"
      />
    </label>

    {#if createError}
      <div class="text-red-600 mt-1">{createError}</div>
    {/if}
    <button class="btn btn-primary btn-sm mt-2" type="submit">Create</button>
  </form>

  <div class="mt-8">
    <h2 class="text-xl font-semibold">Your Templates</h2>
    {#if data.personalTemplates.length === 0}
      <p class="text-gray-600 mt-2">No personal templates yet.</p>
    {:else}
      {#each data.personalTemplates as tmpl}
        <div class="card shadow mb-4">
          <div class="card-body">
            {#if tmpl.id === editingTemplateId}
              <!-- Edit form -->
              <form
                method="POST"
                action="?/updateTemplate"
                use:enhance={handleUpdate}
              >
                <input type="hidden" name="id" value={tmpl.id} />
                <div class="mb-2">
                  <label class="block mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    bind:value={editingTitle}
                    class="input input-bordered w-full max-w-xl"
                  />
                </div>
                <div class="mb-2">
                  <label class="block mb-1">Content</label>
                  <textarea
                    name="content"
                    rows="3"
                    bind:value={editingContent}
                    class="textarea textarea-bordered w-full max-w-xl"
                  ></textarea>
                </div>
                <!-- Updated label to nest the input for a11y -->
                <label class="label cursor-pointer gap-2">
                  <span class="label-text">Shared?</span>
                  <input
                    type="checkbox"
                    name="is_shared"
                    value="true"
                    bind:checked={editingIsShared}
                    class="checkbox"
                  />
                </label>
                {#if updateError}
                  <div class="text-red-600 mt-1">{updateError}</div>
                {/if}
                <div class="mt-2 space-x-2">
                  <button class="btn btn-sm btn-primary" type="submit">
                    Save
                  </button>
                  <button
                    class="btn btn-sm"
                    type="button"
                    on:click={() => (editingTemplateId = null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            {:else}
              <!-- View mode -->
              <div class="flex flex-row items-start justify-between">
                <div>
                  <h3 class="card-title font-semibold text-lg">{tmpl.title}</h3>
                  <p class="mt-1 text-sm whitespace-pre-wrap">{tmpl.content}</p>
                  {#if tmpl.is_shared}
                    <p class="text-xs text-green-700 mt-1 font-semibold">
                      Shared
                    </p>
                  {/if}
                </div>
                <div class="flex flex-col gap-2">
                  <button
                    class="btn btn-outline btn-xs"
                    on:click={() => startEditing(tmpl)}
                  >
                    Edit
                  </button>
                  <form
                    method="POST"
                    action="?/deleteTemplate"
                    use:enhance={handleDelete}
                  >
                    <input type="hidden" name="id" value={tmpl.id} />
                    <button class="btn btn-error btn-xs" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Shared Templates Section -->
  <div class="mt-8">
    <h2 class="text-xl font-semibold">Shared Templates</h2>
    {#if data.sharedTemplates.length === 0}
      <p class="text-gray-600 mt-2">No shared templates found.</p>
    {:else}
      {#each data.sharedTemplates as tmpl}
        <div class="card shadow mb-2">
          <div class="card-body">
            <h3 class="card-title font-semibold text-lg">{tmpl.title}</h3>
            <p class="mt-1 text-sm whitespace-pre-wrap">{tmpl.content}</p>
            <p class="text-xs text-green-700 mt-1 font-semibold">Shared</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
