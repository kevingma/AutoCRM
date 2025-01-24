<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("tickets")

  export let data: {
    tickets: {
      id: string
      title: string
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
    searchParam: string // new
  }

  // We'll bind this to the search input. If changed, user must click "Apply".
  let searchInput = data.searchParam
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

  <!-- Filters form -->
  <form method="GET" class="flex flex-wrap gap-4 items-end">
    <!-- Status -->
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
        >
          In Progress
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
        <option value="all" selected={data.statusParam === "all"}>All</option>
      </select>
    </div>

    <!-- Priority -->
    <div>
      <label for="priority" class="block font-semibold mb-1">Priority</label>
      <select
        id="priority"
        name="priority"
        class="select select-bordered"
        style="min-width: 150px;"
      >
        <option value="all" selected={data.priorityParam === "all"}>All</option>
        <option value="high" selected={data.priorityParam === "high"}
          >High</option
        >
        <option value="medium" selected={data.priorityParam === "medium"}>
          Medium
        </option>
        <option value="low" selected={data.priorityParam === "low"}>Low</option>
      </select>
    </div>

    <!-- Sort by time -->
    <div>
      <label for="sort" class="block font-semibold mb-1">Time</label>
      <select id="sort" name="sort" class="select select-bordered">
        <option value="desc" selected={data.sortParam === "desc"}
          >Newest First</option
        >
        <option value="asc" selected={data.sortParam === "asc"}
          >Oldest First</option
        >
      </select>
    </div>

    <!-- New: Search by text -->
    <div>
      <label for="search" class="block font-semibold mb-1">Search</label>
      <input
        id="search"
        name="search"
        type="text"
        placeholder="Keyword..."
        class="input input-bordered w-48"
        bind:value={searchInput}
      />
    </div>

    <button type="submit" class="btn btn-primary mt-2">Apply</button>
  </form>

  <!-- Ticket Table -->
  <div class="overflow-x-auto grow">
    <table class="table w-full mt-4">
      <thead>
        <tr>
          <th class="bg-base-200">Title</th>
          <th class="bg-base-200">Created</th>
          <th class="bg-base-200">Priority</th>
          <th class="bg-base-200">Status</th>
          <th class="bg-base-200"></th>
        </tr>
      </thead>
      <tbody>
        {#if data.tickets.length === 0}
          <tr>
            <td colspan="5" class="text-center text-gray-600 py-4">
              No matching tickets found
            </td>
          </tr>
        {:else}
          {#each data.tickets as ticket}
            <tr>
              <td class="font-bold">{ticket.title}</td>
              <td class="text-sm">
                {new Date(ticket.created_at).toLocaleString()}
              </td>
              <td>
                {#if ticket.priority === "high"}
                  <span class="badge bg-red-500 text-white">High</span>
                {:else if ticket.priority === "medium"}
                  <span class="badge bg-orange-400 text-white">Medium</span>
                {:else if ticket.priority === "low"}
                  <span class="badge bg-pink-300 text-black">Low</span>
                {:else}
                  —
                {/if}
              </td>
              <td>
                {#if ticket.status === "open"}
                  <span class="badge bg-blue-500 text-white">Open</span>
                {:else if ticket.status === "in_progress"}
                  <span class="badge bg-purple-500 text-white">In Progress</span
                  >
                {:else if ticket.status === "closed"}
                  <span class="badge bg-green-500 text-white">Closed</span>
                {:else}
                  {ticket.status}
                {/if}
              </td>
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
