<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("home")

  export let data: {
    userRole: string
    stats: {
      activeTicketsCount: number
      ticketsResolvedTodayCount: number
      feedbackReceivedCount: number
    }
    recentTickets: {
      id: string
      title: string
      status: string
      created_at: string | null
    }[]
  }
</script>

<svelte:head>
  <title>Account Dashboard</title>
</svelte:head>

<!-- If not employee or admin, show simpler placeholders or a friendly message -->
{#if data.userRole !== "employee" && data.userRole !== "administrator"}
  <h1 class="text-2xl font-bold mb-3">Dashboard</h1>
  <p class="mb-6">Welcome to your account area!</p>

  <!-- Example placeholders (unchanged) -->
  <div class="my-6">
    <h2 class="text-xl font-bold mb-1">Users</h2>
    <div class="stats shadow stats-vertical sm:stats-horizontal sm:w-[420px]">
      <div class="stat place-items-center">
        <div class="stat-title">Downloads</div>
        <div class="stat-value">31K</div>
        <div class="stat-desc">↗︎ 546 (2%)</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">Users</div>
        <div class="stat-value text-secondary">4,200</div>
        <div class="stat-desc">↗︎ 40 (2%)</div>
      </div>
    </div>
  </div>
  <div class="my-6">
    <h2 class="text-xl font-bold mb-1">Accounts</h2>
    <div class="stats shadow stats-vertical sm:stats-horizontal sm:w-[420px]">
      <div class="stat place-items-center">
        <div class="stat-title">New Registers</div>
        <div class="stat-value">1,200</div>
        <div class="stat-desc">↘︎ 90 (14%)</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">Churned Accounts</div>
        <div class="stat-value">42</div>
        <div class="stat-desc">↘︎ 6 (12%)</div>
      </div>
    </div>
  </div>
  <div class="my-6">
    <h2 class="text-xl font-bold mb-1">Revenue</h2>
    <div class="stats shadow stats-vertical sm:stats-horizontal sm:w-[420px]">
      <div class="stat place-items-center">
        <div class="stat-title text-success">Revenue</div>
        <div class="stat-value text-success">$4200</div>
        <div class="stat-desc">↗︎ $180 (4%)</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">New Subscribers</div>
        <div class="stat-value">16</div>
        <div class="stat-desc">↘︎ 1 (%7)</div>
      </div>
    </div>
  </div>
{:else}
  <!-- Employee or Administrator -->
  <h1 class="text-2xl font-bold mb-3">Employee Dashboard</h1>

  <div class="stats shadow stats-vertical sm:stats-horizontal sm:w-[420px]">
    <div class="stat place-items-center">
      <div class="stat-title">Active Tickets</div>
      <div class="stat-value">{data.stats.activeTicketsCount}</div>
      <div class="stat-desc">Open/In Progress, has your replies</div>
    </div>
    <div class="stat place-items-center">
      <div class="stat-title">Resolved Today</div>
      <div class="stat-value">{data.stats.ticketsResolvedTodayCount}</div>
      <div class="stat-desc">Closed with your reply after midnight</div>
    </div>
    <!-- NEW: Link to feedback page -->
    <a
      href="/account/employee_feedback"
      class="stat place-items-center hover:bg-base-200"
    >
      <div class="stat-title">Feedback Received</div>
      <div class="stat-value">{data.stats.feedbackReceivedCount}</div>
      <div class="stat-desc">Click to see feedback</div>
    </a>
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-2">Recent Tickets You Contributed To</h2>
    {#if data.recentTickets.length === 0}
      <p class="text-sm">No recent tickets found.</p>
    {:else}
      <ul class="list-disc list-inside">
        {#each data.recentTickets as t}
          <li class="my-1">
            <a href={"/account/tickets/" + t.id} class="link link-primary">
              {t.title} (status: {t.status})
            </a>
            {#if t.created_at}
              <span class="text-sm text-gray-500 ml-1">
                — {new Date(t.created_at).toLocaleString()}
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
