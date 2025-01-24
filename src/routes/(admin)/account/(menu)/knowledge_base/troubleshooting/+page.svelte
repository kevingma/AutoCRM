<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
</script>

<svelte:head>
  <title>Troubleshooting</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Troubleshooting</h1>
  <p class="mb-4">
    Encountering issues? Here are some common problems and their quick fixes. If
    your issue isn't listed, feel free to open a ticket or reach out via live
    chat.
  </p>

  <h2 class="text-lg font-semibold">Common Problems</h2>
  <ul class="list-disc list-inside space-y-2 mb-4">
    <li>
      <strong>Login Failures:</strong> Clear your browser cache, ensure you use the
      correct credentials, or reset your password.
    </li>
    <li>
      <strong>Page Load Errors:</strong> Check your internet connection, then refresh.
      If persistent, open a ticket for further analysis.
    </li>
    <li>
      <strong>Billing Discrepancies:</strong> Verify your payment method in our
      <a href="/account/billing" class="link link-primary">Billing</a> page and contact
      support if unresolved.
    </li>
  </ul>

  <p class="text-sm text-gray-600">
    Still stuck? <a href="/account/live_chat" class="link link-primary"
      >Chat with AI</a
    >
    or
    <a href="/account/tickets" class="link link-primary">open a new ticket</a>.
  </p>
</div>
