<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
</script>

<svelte:head>
  <title>Advanced Setup</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Advanced Setup</h1>
  <p class="mb-4">
    For power users and administrators, learn how to tailor configurations,
    manage roles, and automate complex workflows.
  </p>

  <h2 class="text-lg font-semibold">Highlights</h2>
  <ul class="list-disc list-inside space-y-2 mb-4">
    <li>Role-based access control (RBAC) for employees and admins.</li>
    <li>Custom fields in tickets or user profiles for specialized data.</li>
    <li>
      Scripting and webhooks to trigger external events on ticket updates.
    </li>
  </ul>

  <p class="text-sm text-gray-600">
    Browse our <a
      href="/account/knowledge_base/integrations"
      class="link link-primary">Integrations</a
    > page to connect advanced services.
  </p>
</div>
