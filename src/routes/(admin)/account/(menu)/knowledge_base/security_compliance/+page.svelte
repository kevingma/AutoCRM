<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
</script>

<svelte:head>
  <title>Security & Compliance</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Security & Compliance</h1>
  <p class="mb-4">
    We take data protection seriously. Our platform adheres to industry
    standards like encryption in transit and at rest, secure credential storage,
    and optional multi-factor authentication.
  </p>

  <h2 class="text-lg font-semibold mt-6">Key Points</h2>
  <ul class="list-disc list-inside mb-4 space-y-2">
    <li>End-to-end encryption for sensitive data (including customer info).</li>
    <li>GDPR-compliant data handling and optional data residency.</li>
    <li>Regular security audits and patching cycles.</li>
  </ul>

  <p class="text-sm text-gray-600">
    Visit our <a class="link link-primary" href="/account/settings">Settings</a>
    page to enable MFA and manage security preferences.
  </p>
</div>
