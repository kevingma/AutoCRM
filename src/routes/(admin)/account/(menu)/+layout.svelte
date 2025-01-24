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
      <!-- Home -->
      <li>
        <div
          class="normal-case menu-title text-xl font-bold text-primary flex flex-row"
        >
          <a href="/" class="grow">{WebsiteName}</a>
          <label for="admin-drawer" class="lg:hidden ml-3"> &#x2715; </label>
        </div>
      </li>

      <!-- Home (always visible) -->
      <li>
        <a
          href="/account"
          class={adminSectionValue === "home" ? "active" : ""}
          onclick={closeDrawer}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 
              1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 
              .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 
              1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 
              0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Home
        </a>
      </li>

      <!-- Agent Management (Admin only) -->
      {#if userRole === "administrator"}
        <li>
          <a
            href="/account/agent_management"
            class={adminSectionValue === "agent_management" ? "active" : ""}
            onclick={closeDrawer}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 
                 6a3.75 3.75 0 1 1-7.5 
                 0 3.75 3.75 0 0 1 7.5 
                 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 
                 17.933 0 0 1 12 21.75c-2.676 
                 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            Agent Management
          </a>
        </li>
      {/if}

      <!-- Teams (Admin only) -->
      {#if userRole === "administrator"}
        <li>
          <a
            href="/account/teams"
            class={adminSectionValue === "teams" ? "active" : ""}
            onclick={closeDrawer}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 
                 18.72a9.094 9.094 0 
                 0 0 3.741-.479 3 3 0 
                 0 0-4.682-2.72m.94 
                 3.198.001.031c0 
                 .225-.012.447-.037.666A11.944 
                 11.944 0 0 1 12 
                 21c-2.17 0-4.207-.576-5.963-1.584A6.062 
                 6.062 0 0 1 6 
                 18.719m12 
                 0a5.971 5.971 0 0 0-.941-3.197m0 
                 0A5.995 5.995 0 0 0 12 
                 12.75a5.995 5.995 0 0 0-5.058 
                 2.772m0 
                 0a3 3 0 0 0-4.681 
                 2.72 8.986 8.986 0 
                 0 0 3.74.477m.94-3.197a5.971 
                 5.971 0 0 0-.94 
                 3.197M15 
                 6.75a3 3 0 1 
                 1-6 0 3 3 0 
                 0 1 6 
                 0Zm6 
                 3a2.25 2.25 0 1 
                 1-4.5 0 2.25 2.25 0 0 1 
                 4.5 0Zm-13.5 
                 0a2.25 2.25 0 1 
                 1-4.5 0 2.25 2.25 0 0 1 4.5 
                 0Z"
              />
            </svg>
            Teams
          </a>
        </li>
      {/if}

      <!-- Tickets (visible to all roles) -->
      <li>
        <a
          href="/account/tickets"
          class={adminSectionValue === "tickets" ? "active" : ""}
          onclick={closeDrawer}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.5 6v.75m0 3v.75m0 3v.75m0 
               3V18m-9-5.25h5.25M7.5 15h3M3.375 
               5.25c-.621 0-1.125.504-1.125 
               1.125v3.026a2.999 2.999 0 0 1 
               0 5.198v3.026c0 .621.504 1.125 
               1.125 1.125h17.25c.621 0 1.125-.504 
               1.125-1.125v-3.026a2.999 2.999 0 
               0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
            />
          </svg>
          Tickets
        </a>
      </li>

      <!-- Live Chat (Customer) -->
      {#if userRole === "customer"}
        <li>
          <a
            href="/account/live_chat"
            class={adminSectionValue === "live_chat" ? "active" : ""}
            onclick={closeDrawer}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 
                 12.76c0 1.6 1.123 2.994 2.707 
                 3.227 1.087.16 2.185.283 
                 3.293.369V21l4.076-4.076a1.526 
                 1.526 0 0 1 1.037-.443 48.282 
                 48.282 0 0 0 5.68-.494c1.584-.233 
                 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 
                 48.394 0 0 0 12 
                 3c-2.392 0-4.744.175-7.043.513C3.373 
                 3.746 2.25 5.14 2.25 
                 6.741v6.018Z"
              />
            </svg>
            Live Chat
          </a>
        </li>
      {/if}

      <!-- Agent Live Chat (Employee or Admin) -->
      {#if userRole === "employee" || userRole === "administrator"}
        <li>
          <a
            href="/account/live_chat_agent"
            class={adminSectionValue === "live_chat_agent" ? "active" : ""}
            onclick={closeDrawer}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 
                 12.76c0 1.6 1.123 2.994 2.707 
                 3.227 1.087.16 2.185.283 
                 3.293.369V21l4.076-4.076a1.526 
                 1.526 0 0 1 1.037-.443 48.282 
                 48.282 0 0 0 5.68-.494c1.584-.233 
                 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 
                 48.394 0 0 0 12 
                 3c-2.392 0-4.744.175-7.043.513C3.373 
                 3.746 2.25 5.14 2.25 
                 6.741v6.018Z"
              />
            </svg>
            Agent Live Chat
          </a>
        </li>

        <!-- Agent Tools (Employee or Admin) -->
        <li>
          <a
            href="/account/agent_tools"
            class={adminSectionValue === "agent_tools" ? "active" : ""}
            onclick={closeDrawer}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 
                 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 
                 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 
                 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.867 19.125h.008v.008h-.008v-.008Z"
              />
            </svg>
            Agent Tools
          </a>
        </li>
      {/if}

      <li class="my-2">
        <div class="divider"></div>
      </li>

      <!-- Knowledge Base (all roles) -->
      <li>
        <a
          href="/account/knowledge_base"
          class={adminSectionValue === "knowledge_base" ? "active" : ""}
          onclick={closeDrawer}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 
               14.25v-2.625a3.375 3.375 0 
               0 0-3.375-3.375h-1.5A1.125 1.125 
               0 0 1 13.5 7.125v-1.5a3.375 
               3.375 0 0 0-3.375-3.375H8.25m0 
               12.75h7.5m-7.5 3H12M10.5 
               2.25H5.625c-.621 0-1.125.504-1.125 
               1.125v17.25c0 
               .621.504 1.125 1.125 1.125h12.75c.621 
               0 1.125-.504 1.125-1.125V11.25a9 
               9 0 0 0-9-9Z"
            />
          </svg>
          Knowledge Base
        </a>
      </li>

      <!-- Billing (all roles) -->
      <li>
        <a
          href="/account/billing"
          class={adminSectionValue === "billing" ? "active" : ""}
          onclick={closeDrawer}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M2.25 8.25h19.5M2.25 
               9h19.5m-16.5 5.25h6m-6 
               2.25h3m-3.75 3h15a2.25 2.25 
               0 0 0 2.25-2.25V6.75A2.25 2.25 
               0 0 0 19.5 4.5h-15a2.25 2.25 
               0 0 0-2.25 2.25v10.5A2.25 
               2.25 0 0 0 4.5 19.5Z"
            />
          </svg>
          Billing
        </a>
      </li>

      <!-- Settings and Sign out (always at bottom) -->
      <li class="mt-auto flex flex-row items-center gap-4">
        <a
          href="/account/settings"
          class={adminSectionValue === "settings" ? "active" : ""}
          onclick={closeDrawer}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.594 
               3.94c.09-.542.56-.94 1.11-.94h2.593c.55 
               0 1.02.398 1.11.94l.213 
               1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 
               1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 
               2.247a1.125 1.125 0 0 1-.26 
               1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 
               0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 
               1.43l-1.298 
               2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 
               6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 
               1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 
               0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 
               6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 
               1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 
               .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 
               6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 
               1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 
               1.37-.491l1.216.456c.356.133.751.072 
               1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 
               12a3 3 0 1 
               1-6 0 3 3 0 
               0 1 6 0Z"
            />
          </svg>
          Settings
        </a>
        <a href="/account/sign_out" onclick={closeDrawer}> Sign Out </a>
      </li>
    </ul>
  </div>
</div>
