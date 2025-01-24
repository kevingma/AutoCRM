<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
</script>

<svelte:head>
  <title>Integrations</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Integrations</h1>
  <p class="mb-4">
    Connect your account with various third-party services to enhance
    productivity and automate workflows.
  </p>

  <h2 class="text-lg font-semibold">Popular Integrations</h2>
  <ul class="list-disc list-inside space-y-2 mb-4">
    <li>
      <strong>Stripe:</strong> Use Stripe for subscription billing, invoicing, and
      payment handling.
    </li>
    <li>
      <strong>Email Providers (e.g., Resend):</strong> Automatically send notifications,
      password resets, or promotional materials.
    </li>
    <li>
      <strong>CRM Tools:</strong> Sync customers, leads, or tickets with your existing
      CRM solution.
    </li>
  </ul>

  <p class="text-sm text-gray-600">
    Check our <a href="/account/tickets" class="link link-primary">Tickets</a> section
    if you need help integrating any service.
  </p>
</div>
