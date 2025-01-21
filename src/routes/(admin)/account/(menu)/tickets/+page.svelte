<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"
  import { enhance, applyAction } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  // Use the adminSection store to highlight this page in the sidebar
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("tickets")

  export let data: {
    tickets: {
      id: string
      title: string
      description: string
      status: string
      created_at: string
    }[]
    userRole: string
    companyName?: string
    website?: string
    form?: {
      errorMessage?: string
      errorFields?: string[]
      title?: string
      description?: string
    }
  }

  let loading = false
  let errors: Record<string, string> = {}

  // We'll wire up the form using progressive enhancement
  const handleCreateTicket: SubmitFunction = () => {
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
        // reload the page so we see the new ticket
        location.reload()
      }
    }
  }
</script>

<svelte:head>
  <title>Tickets</title>
</svelte:head>

<div class="flex flex-col gap-4 max-w-4xl">
  <h1 class="text-2xl font-bold mb-2">Your Tickets</h1>
  {#if data.userRole === "customer"}
    <p class="text-gray-700 text-sm mb-4">
      As a <strong>customer</strong>, you can see open tickets from anyone who
      shares your company name (<em>{data.companyName}</em>) or website (<em
        >{data.website}</em
      >), plus your own tickets.
    </p>
  {:else}
    <p class="text-gray-700 text-sm mb-4">
      You are <strong>{data.userRole}</strong>. Displaying your own open tickets
      only.
    </p>
  {/if}

  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th class="bg-base-200">Title</th>
          <th class="bg-base-200">Description</th>
          <th class="bg-base-200">Created</th>
          <th class="bg-base-200">Status</th>
        </tr>
      </thead>
      <tbody>
        {#if data.tickets.length === 0}
          <tr>
            <td colspan="4" class="text-center text-gray-600 py-4">
              No open tickets found
            </td>
          </tr>
        {:else}
          {#each data.tickets as ticket}
            <tr>
              <td class="font-bold">{ticket.title}</td>
              <td class="text-sm">{ticket.description}</td>
              <td class="text-sm">
                {new Date(ticket.created_at).toLocaleString()}
              </td>
              <td class="uppercase font-semibold">{ticket.status}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <div class="divider my-8"></div>

  <h2 class="text-xl font-bold mb-2">Create New Ticket</h2>
  <form
    method="POST"
    action="?/createTicket"
    use:enhance={handleCreateTicket}
    class="max-w-md"
  >
    <label for="title" class="block font-semibold mb-1">Title</label>
    <input
      id="title"
      name="title"
      type="text"
      placeholder="Short title"
      class="input input-bordered w-full mb-3 {errors.title
        ? 'input-error'
        : ''}"
      value={data.form?.title ?? ""}
    />
    <label for="description" class="block font-semibold mb-1">Description</label
    >
    <textarea
      id="description"
      name="description"
      placeholder="Describe your issue"
      rows="3"
      class="textarea textarea-bordered w-full mb-3 {errors.description
        ? 'textarea-error'
        : ''}">{data.form?.description ?? ""}</textarea
    >

    {#if errors._}
      <div class="text-red-600 font-semibold mb-2">{errors._}</div>
    {/if}

    <button class="btn btn-primary" type="submit" disabled={loading}>
      {loading ? "Creating..." : "Create Ticket"}
    </button>
  </form>
</div>
