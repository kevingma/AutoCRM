<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("tickets")

  export let data: {
    tickets: {
      id: string
      title: string
      description: string
      status: string
      created_at: string
      priority: string | null
    }[]
    userRole: string
    companyName?: string
    website?: string
    statusParam: string
    sortParam: string
    priorityParam: string
  }
</script>

<svelte:head>
  <title>Tickets</title>
</svelte:head>

<div class="flex flex-col gap-4 w-full">
  <div class="flex flex-row items-center justify-between">
    <h1 class="text-2xl font-bold">Your Tickets</h1>
    <a href="/account/tickets/new">
      <button class="btn btn-primary">Create Ticket</button>
    </a>
  </div>

  <form method="GET" class="flex flex-wrap gap-4 items-end">
    <div>
      <label for="status" class="block font-semibold mb-1">Status</label>
      <select
        id="status"
        name="status"
        class="select select-bordered"
        style="min-width: 150px;"
      >
        <option value="open" selected={data.statusParam === "open"}>Open</option
        >
        <option
          value="in_progress"
          selected={data.statusParam === "in_progress"}
          >In Progress
        </option>
        <option
          value="open_and_in_progress"
          selected={data.statusParam === "open_and_in_progress"}
        >
          Open & In Progress
        </option>
        <option value="closed" selected={data.statusParam === "closed"}>
          Closed
        </option>
        <option value="all" selected={data.statusParam === "all"}> All </option>
      </select>
    </div>

    <div>
      <label for="priority" class="block font-semibold mb-1">Priority</label>
      <select
        id="priority"
        name="priority"
        class="select select-bordered"
        style="min-width: 150px;"
      >
        <option value="all" selected={data.priorityParam === "all"}>
          All
        </option>
        <option value="high" selected={data.priorityParam === "high"}>
          High
        </option>
        <option value="medium" selected={data.priorityParam === "medium"}>
          Medium
        </option>
        <option value="low" selected={data.priorityParam === "low"}>
          Low
        </option>
      </select>
    </div>

    <div>
      <label for="sort" class="block font-semibold mb-1">Time</label>
      <select id="sort" name="sort" class="select select-bordered">
        <option value="desc" selected={data.sortParam === "desc"}>
          Newest First
        </option>
        <option value="asc" selected={data.sortParam === "asc"}>
          Oldest First
        </option>
      </select>
    </div>

    <!-- Larger button by removing btn-sm -->
    <button type="submit" class="btn btn-primary mt-2"> Apply </button>
  </form>

  <div class="overflow-x-auto grow">
    <table class="table w-full mt-4">
      <thead>
        <tr>
          <th class="bg-base-200">Title</th>
          <th class="bg-base-200">Description</th>
          <th class="bg-base-200">Created</th>
          <th class="bg-base-200">Priority</th>
          <th class="bg-base-200">Status</th>
          <th class="bg-base-200"></th>
        </tr>
      </thead>
      <tbody>
        {#if data.tickets.length === 0}
          <tr>
            <td colspan="6" class="text-center text-gray-600 py-4">
              No matching tickets found
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
              <td class="uppercase font-semibold">{ticket.priority ?? "—"}</td>
              <td class="uppercase font-semibold">{ticket.status}</td>
              <td>
                <a
                  href={`/account/tickets/${ticket.id}`}
                  class="link link-primary">View</a
                >
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
