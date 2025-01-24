<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
</script>

<svelte:head>
  <title>Billing & Payments</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Billing & Payments</h1>
  <p class="mb-4">
    This section covers subscription plans, payment methods, and common billing
    questions.
  </p>

  <h2 class="text-lg font-semibold">Key Information</h2>
  <ul class="list-disc list-inside space-y-2 mb-4">
    <li>
      <strong>Plan Tiers:</strong> We offer Free, Pro, and Enterprise tiers with
      varying limits and support levels.
    </li>
    <li>
      <strong>Payment Methods:</strong> Stripe integration allows you to pay via
      credit card or alternative payment methods.
    </li>
    <li>
      <strong>Billing Portal:</strong> Access invoices and update your plan in
      the
      <a href="/account/billing" class="link link-primary">Billing</a> section.
    </li>
  </ul>

  <p class="text-sm text-gray-600">
    Need help? <a href="/account/tickets" class="link link-primary"
      >Open a Ticket</a
    > or talk to our live chat support.
  </p>
</div>
