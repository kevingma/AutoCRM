<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  export let data: {
    employeeName: string
    role: string
    dayStats: {
      closedCount: number
      averageResponseTime: number
      customerSatisfaction: number
      resolutionTime: number
      feedback: {
        ticket_id: string
        rating: number
        comment: string | null
        created_at: string | null
      }[]
    } | null
    weekStats:
      | {
          /* same shape as dayStats */
        }
      | null
    monthStats:
      | {
          /* same shape as dayStats */
        }
      | null
  }

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("agent_management")

  const { employeeName, dayStats, weekStats, monthStats } = data
</script>

<svelte:head>
  <title>Employee Analytics: {employeeName}</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">
    Analytics for {employeeName}
  </h1>

  {#if !dayStats}
    <p class="text-gray-500">No data found or user not in your organization.</p>
  {:else}
    <!-- Show three cards: day, week, month -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Day -->
      <div class="card shadow">
        <div class="card-body">
          <h2 class="card-title">Today</h2>
          <p>Closed Tickets: {dayStats.closedCount}</p>
          <p>
            Avg Response Time (min): {dayStats.averageResponseTime.toFixed(1)}
          </p>
          <p>Avg Resolution (hrs): {dayStats.resolutionTime.toFixed(1)}</p>
          <p>
            Customer Satisfaction: {dayStats.customerSatisfaction.toFixed(1)}
          </p>
        </div>
      </div>

      <!-- Week -->
      <div class="card shadow">
        <div class="card-body">
          <h2 class="card-title">This Week</h2>
          <p>Closed Tickets: {weekStats.closedCount}</p>
          <p>
            Avg Response Time (min): {weekStats.averageResponseTime.toFixed(1)}
          </p>
          <p>Avg Resolution (hrs): {weekStats.resolutionTime.toFixed(1)}</p>
          <p>
            Customer Satisfaction: {weekStats.customerSatisfaction.toFixed(1)}
          </p>
        </div>
      </div>

      <!-- Month -->
      <div class="card shadow">
        <div class="card-body">
          <h2 class="card-title">This Month</h2>
          <p>Closed Tickets: {monthStats.closedCount}</p>
          <p>
            Avg Response Time (min): {monthStats.averageResponseTime.toFixed(1)}
          </p>
          <p>Avg Resolution (hrs): {monthStats.resolutionTime.toFixed(1)}</p>
          <p>
            Customer Satisfaction: {monthStats.customerSatisfaction.toFixed(1)}
          </p>
        </div>
      </div>
    </div>

    <!-- Also show feedback from monthStats as an example -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold mb-2">Recent Feedback (Last 30 Days)</h2>
      {#if monthStats.feedback.length === 0}
        <p class="text-gray-500">No feedback found.</p>
      {:else}
        <table class="table w-full">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {#each monthStats.feedback as f}
              <tr>
                <td>{f.ticket_id.slice(0, 8)}...</td>
                <td>{f.rating}</td>
                <td>{f.comment ?? ""}</td>
                <td>
                  {#if f.created_at}
                    {new Date(f.created_at).toLocaleString()}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>
