<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  // We'll receive data from +page.server.ts
  export let data: {
    userRole: string
    stats: {
      openTicketsCount?: number
      averageResponseTime?: number
      averageResolutionTime?: number
      customerSatisfaction?: number
    }
    recentActivity: {
      type: "ticket" | "chat"
      id: string
      created_at: string
    }[]
    adminStats: {
      numberOfAgents: number
      numberOfClients: number
      openTicketsCount: number
      averageResolutionTime: number
    } | null
  }

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("home")

  const { userRole, stats, recentActivity, adminStats } = data
</script>

<svelte:head>
  <title>Account Dashboard</title>
</svelte:head>

<!-- ADMIN DASHBOARD -->
{#if userRole === "administrator" && adminStats}
  <h1 class="text-2xl font-bold mb-4">Administrator Dashboard</h1>
  <!-- TOP ROW: 4 statistic boxes -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- # of Agents -->
    <div class="stat shadow">
      <div class="stat-title">Agents</div>
      <div class="stat-value">{adminStats.numberOfAgents}</div>
      <div class="stat-desc">in your company</div>
    </div>

    <!-- # of Clients -->
    <div class="stat shadow">
      <div class="stat-title">Clients</div>
      <div class="stat-value">{adminStats.numberOfClients}</div>
      <div class="stat-desc">approved customers</div>
    </div>

    <!-- Open Tickets -->
    <div class="stat shadow">
      <div class="stat-title">Open Tickets</div>
      <div class="stat-value">{adminStats.openTicketsCount}</div>
      <div class="stat-desc">at this moment</div>
    </div>

    <!-- Average Resolution Time (today) -->
    <div class="stat shadow">
      <div class="stat-title">Avg Resolution (today)</div>
      <div class="stat-value">
        {adminStats.averageResolutionTime}
        <span class="text-lg ml-1">hrs</span>
      </div>
      <div class="stat-desc">recent closed tickets</div>
    </div>
  </div>

  <!-- BOTTOM SECTION: Quick links & simple placeholders for visualizations -->
  <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Example Visualization or Chart -->
    <div class="col-span-2 card shadow bg-base-100">
      <div class="card-body">
        <h2 class="card-title text-lg">Organization Overview</h2>
        <p class="text-sm">
          Placeholder for charts or graphs. You could integrate a chart library
          to display data (e.g., tickets by day, agent performance, etc.).
        </p>
        <!-- For demonstration, just a fake "chart" box -->
        <div
          class="mt-4 border border-base-200 h-32 flex items-center justify-center text-gray-500"
        >
          [Chart Placeholder]
        </div>
      </div>
    </div>
    <!-- Quick Links -->
    <div class="card shadow bg-base-100">
      <div class="card-body">
        <h2 class="card-title text-lg">Administrator Quick Links</h2>
        <div class="mt-2">
          <ul class="list-disc list-inside text-sm space-y-2">
            <li>
              <a class="link link-primary" href="/account/agent_management"
                >Manage Agents</a
              >
            </li>
            <li>
              <a class="link link-primary" href="/account/teams">Manage Teams</a
              >
            </li>
            <li>
              <a class="link link-primary" href="/account/tickets"
                >View All Tickets</a
              >
            </li>
            <li>
              <a class="link link-primary" href="/account/billing">Billing</a>
            </li>
            <li>
              <a class="link link-primary" href="/account/settings"
                >Account Settings</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- EMPLOYEE DASHBOARD -->
{:else if userRole === "employee"}
  <h1 class="text-2xl font-bold mb-4">Employee Dashboard</h1>

  <!-- TOP ROW: 4 statistic boxes -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- 1) Open Tickets -->
    <div class="stat shadow">
      <div class="stat-title">Open Tickets</div>
      <div class="stat-value">{stats.openTicketsCount ?? 0}</div>
      <div class="stat-desc">Assigned to you</div>
    </div>

    <!-- 2) Avg. Response Time -->
    <div class="stat shadow">
      <div class="stat-title">Avg Response Time</div>
      <div class="stat-value">
        {stats.averageResponseTime
          ? stats.averageResponseTime.toFixed(1)
          : "0.0"}
        <span class="text-lg ml-1">min</span>
      </div>
      <div class="stat-desc">to first reply</div>
    </div>

    <!-- 3) Avg. Resolution Time -->
    <div class="stat shadow">
      <div class="stat-title">Avg Resolution Time</div>
      <div class="stat-value">
        {stats.averageResolutionTime
          ? stats.averageResolutionTime.toFixed(1)
          : "0.0"}
        <span class="text-lg ml-1">hr</span>
      </div>
      <div class="stat-desc">for closed tickets</div>
    </div>

    <!-- 4) Customer Satisfaction -->
    <div class="stat shadow">
      <div class="stat-title">Customer Satisfaction</div>
      <div class="stat-value">
        {stats.customerSatisfaction
          ? stats.customerSatisfaction.toFixed(1)
          : "0.0"}
        <span class="text-lg ml-1">/ 5</span>
      </div>
      <div class="stat-desc">ticket feedback rating</div>
    </div>
  </div>

  <!-- BOTTOM SECTION: two columns, left "Recent Activity", right "Quick Links" -->
  <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Left: Recent Activity -->
    <div class="col-span-2 card shadow bg-base-100">
      <div class="card-body">
        <h2 class="card-title text-lg">Recent Activity</h2>
        {#if recentActivity.length === 0}
          <p class="text-gray-500 mt-2">No recent activity found.</p>
        {:else}
          <ul class="mt-2 space-y-2">
            {#each recentActivity as act}
              <li class="border-b pb-2">
                <span class="text-sm text-gray-500 mr-2">
                  {new Date(act.created_at).toLocaleString()}
                </span>
                {#if act.type === "ticket"}
                  <a
                    href={`/account/tickets/${act.id}`}
                    class="link link-primary"
                  >
                    Ticket #{act.id.slice(0, 8)}
                  </a>
                  <span class="text-xs ml-1">(reply)</span>
                {:else if act.type === "chat"}
                  <a
                    href={`/account/live_chat_agent/${act.id}`}
                    class="link link-secondary"
                  >
                    Live Chat #{act.id.slice(0, 8)}
                  </a>
                  <span class="text-xs ml-1">(agent message)</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <!-- Right: Quick Links -->
    <div class="card shadow bg-base-100">
      <div class="card-body">
        <h2 class="card-title text-lg">Quick Links</h2>
        <div class="mt-2">
          <ul class="list-disc list-inside text-sm space-y-2">
            <li>
              <a class="link link-primary" href="/account/tickets"
                >View Tickets</a
              >
            </li>
            <li>
              <a class="link link-primary" href="/account/agent_tools"
                >Agent Tools</a
              >
            </li>
            <li>
              <a class="link link-primary" href="/account/live_chat_agent"
                >Agent Live Chat</a
              >
            </li>
            <li>
              <a class="link link-primary" href="/account/billing">Billing</a>
            </li>
            <li>
              <a class="link link-primary" href="/account/settings"
                >Account Settings</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- NON-EMPLOYEE / NON-ADMIN VIEW -->
{:else}
  <h1 class="text-2xl font-bold mb-3">User Dashboard</h1>
  <p>Welcome to your account area!</p>
  <div class="mt-6 text-sm">
    <p>Explore your tickets, billing, and profile settings in the side menu.</p>
  </div>
{/if}
