<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
</script>

<svelte:head>
  <title>Getting Started</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Getting Started</h1>
  <p class="mb-4">
    Welcome to our platform! This guide helps you set up your environment
    quickly and start exploring features:
  </p>

  <ol class="list-decimal list-inside mb-4 space-y-2">
    <li>
      <strong>Create an Account:</strong> Sign up with your email or OAuth provider.
    </li>
    <li>
      <strong>Complete Your Profile:</strong> Provide your company details and role.
    </li>
    <li>
      <strong>Explore Tickets & Chat:</strong> Learn how to open tickets or chat
      with our AI assistant.
    </li>
    <li>
      <strong>Check Out Integrations:</strong> Connect popular services like Stripe
      for a seamless workflow.
    </li>
  </ol>

  <p class="text-sm text-gray-600">
    You can also access our <a
      class="link link-primary"
      href="/account/knowledge_base/troubleshooting">Troubleshooting</a
    > page if you encounter any issues.
  </p>
</div>
