<script lang="ts">
  import { enhance, applyAction } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  let errors: Record<string, string> = {}
  let loading = false

  // We'll use a local action "createTicket" in new/+page.server.ts
  const handleSubmit: SubmitFunction = () => {
    loading = true
    errors = {}
    return async ({ update, result }) => {
      await update({ reset: false })
      loading = false

      if (result.type === "failure") {
        if (result.data?.errorMessage) {
          errors["_"] = result.data.errorMessage
        }
        const fieldErrs = result.data?.errorFields ?? []
        fieldErrs.forEach((f: string) => {
          errors[f] = "Error"
        })
      } else if (result.type === "success") {
        // Ticket created, go back to tickets listing
        window.location.href = "/account/tickets"
      }
    }
  }
</script>

<svelte:head>
  <title>Create Ticket</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-xl mx-auto mt-8">
  <h1 class="text-2xl font-bold">Create a New Ticket</h1>

  <form
    method="POST"
    action="?/createTicket"
    use:enhance={handleSubmit}
    class="flex flex-col gap-4"
  >
    <!-- Title -->
    <div>
      <label for="title" class="block font-semibold mb-1">Title</label>
      <input
        id="title"
        name="title"
        type="text"
        placeholder="Short title..."
        class="input input-bordered w-full {errors.title ? 'input-error' : ''}"
      />
    </div>

    <!-- Details -->
    <div>
      <label for="description" class="block font-semibold mb-1">Details</label>
      <textarea
        id="description"
        name="description"
        rows="4"
        placeholder="Describe your issue in detail..."
        class="textarea textarea-bordered w-full {errors.description
          ? 'textarea-error'
          : ''}"
      ></textarea>
    </div>

    <!-- Priority -->
    <div>
      <label for="priority" class="block font-semibold mb-1">Priority</label>
      <select
        id="priority"
        name="priority"
        class="select select-bordered w-full {errors.priority
          ? 'border-error'
          : ''}"
      >
        <option value="high">High</option>
        <option value="medium" selected>Medium</option>
        <option value="low">Low</option>
      </select>
    </div>

    <!-- Any error message -->
    {#if errors._}
      <div class="text-red-600 font-semibold">{errors._}</div>
    {/if}

    <!-- Submit -->
    <button type="submit" class="btn btn-primary" disabled={loading}>
      {loading ? "Creating..." : "Create Ticket"}
    </button>
  </form>
</div>
