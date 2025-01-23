<script lang="ts">
  import "../../../../app.css"
  import { writable } from "svelte/store"
  import { setContext } from "svelte"
  import { WebsiteName } from "../../../../config"
  import { page } from "$app/stores"

  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()

  const adminSectionStore = writable("")
  setContext("adminSection", adminSectionStore)

  const userRole = $derived($page.data.userRole ?? "")
  const adminSectionValue = $derived($adminSectionStore)

  function closeDrawer(): void {
    const adminDrawer = document.getElementById(
      "admin-drawer",
    ) as HTMLInputElement
    adminDrawer.checked = false
  }
</script>

<div class="drawer lg:drawer-open">
  <input id="admin-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <div class="navbar bg-base-100 lg:hidden">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl" href="/">{WebsiteName}</a>
      </div>
      <div class="flex-none">
        <label for="admin-drawer" class="btn btn-ghost btn-circle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </label>
      </div>
    </div>
    <div class="container px-6 lg:px-12 py-3 lg:py-6">
      {@render children?.()}
    </div>
  </div>

  <div class="drawer-side">
    <label for="admin-drawer" class="drawer-overlay"></label>
    <ul
      class="menu p-4 w-64 min-h-full bg-base-100 lg:border-r text-sm text-primary"
    >
      <li>
        <div
          class="normal-case menu-title text-xl font-bold text-primary flex flex-row"
        >
          <a href="/" class="grow">{WebsiteName}</a>
          <label for="admin-drawer" class="lg:hidden ml-3"> &#x2715; </label>
        </div>
      </li>

      <li>
        <a
          href="/account"
          class={adminSectionValue === "home" ? "active" : ""}
          onclick={closeDrawer}
        >
          Home
        </a>
      </li>

      <li>
        <a
          href="/account/tickets"
          class={adminSectionValue === "tickets" ? "active" : ""}
          onclick={closeDrawer}
        >
          Tickets
        </a>
      </li>

      <li>
        <a
          href="/account/billing"
          class={adminSectionValue === "billing" ? "active" : ""}
          onclick={closeDrawer}
        >
          Billing
        </a>
      </li>

      {#if userRole === "administrator"}
        <li>
          <a
            href="/account/approve_users"
            class={adminSectionValue === "approvals" ? "active" : ""}
            onclick={closeDrawer}
          >
            Approve Users
          </a>
        </li>
        <!-- NEW: Teams link for admin -->
        <li>
          <a
            href="/account/teams"
            class={adminSectionValue === "teams" ? "active" : ""}
            onclick={closeDrawer}
          >
            Teams
          </a>
        </li>
      {/if}

      <li class="my-2"><div class="divider"></div></li>

      <li>
        <a
          href="/account/knowledge_base"
          class={adminSectionValue === "knowledge_base" ? "active" : ""}
          onclick={closeDrawer}
        >
          Knowledge Base
        </a>
      </li>

      {#if userRole === "customer"}
        <li>
          <a
            href="/account/live_chat"
            class={adminSectionValue === "live_chat" ? "active" : ""}
            onclick={closeDrawer}
          >
            Live Chat
          </a>
        </li>
      {/if}

      {#if userRole === "employee" || userRole === "administrator"}
        <li>
          <a
            href="/account/live_chat_agent"
            class={adminSectionValue === "live_chat_agent" ? "active" : ""}
            onclick={closeDrawer}
          >
            Agent Live Chat
          </a>
        </li>
      {/if}

      <li class="mt-auto flex flex-row items-center gap-4">
        <a
          href="/account/settings"
          class={adminSectionValue === "settings" ? "active" : ""}
          onclick={closeDrawer}
        >
          Settings
        </a>
        <a href="/account/sign_out" onclick={closeDrawer}> Sign Out </a>
      </li>
    </ul>
  </div>
</div>
