<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  // Existing code for side-menu highlight:
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")

  // Keep the existing FAQ logic:
  interface KBEntry {
    question: string
    answer: string
  }

  const kbData: KBEntry[] = [
    {
      question: "How do I create a new ticket?",
      answer:
        "Go to the Tickets page and click 'Create Ticket' to open a new support request.",
    },
    {
      question: "Where can I change my password?",
      answer:
        "Navigate to Settings → Password, then follow the prompts to change your password.",
    },
    {
      question:
        "What is the difference between 'open' and 'in_progress' tickets?",
      answer:
        "'Open' means no one has started working on it yet, while 'in_progress' indicates a team member has taken ownership.",
    },
    {
      question: "How do I subscribe or unsubscribe from emails?",
      answer:
        "Visit Settings → Email Subscription to update your preferences. If unsubscribed, you'll no longer receive email notifications.",
    },
  ]

  let searchQuery = ""
  $: filteredResults = kbData.filter((entry) => {
    const q = searchQuery.toLowerCase()
    return (
      entry.question.toLowerCase().includes(q) ||
      entry.answer.toLowerCase().includes(q)
    )
  })
</script>

<svelte:head>
  <title>Knowledge Base</title>
</svelte:head>

<div class="flex flex-col gap-4 w-full max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mt-6">Knowledge Base</h1>
  <p class="text-sm text-gray-600">
    Find quick answers to frequently asked questions below, or browse detailed
    articles by category.
  </p>

  <!-- Simple local search -->
  <label class="text-sm font-semibold mt-4" for="kb-search"
    >Search in Knowledge Base</label
  >
  <input
    id="kb-search"
    type="text"
    bind:value={searchQuery}
    placeholder="Type a keyword..."
    class="input input-bordered w-full max-w-md"
  />

  <!-- FAQ Section -->
  <div class="mt-4">
    {#if filteredResults.length === 0 && searchQuery.length > 0}
      <p class="text-gray-500 mt-4">No results found for "{searchQuery}".</p>
    {:else}
      {#each filteredResults as entry}
        <div
          class="collapse collapse-arrow border border-base-200 bg-base-100 rounded-box mb-2"
        >
          <input type="checkbox" />
          <div class="collapse-title text-md font-medium">
            {entry.question}
          </div>
          <div class="collapse-content">
            <p class="py-2">{entry.answer}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- New 3x2 Category Grid -->
  <h2 class="text-xl font-bold mt-8">Browse by Category</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
    <a
      href="/account/knowledge_base/getting_started"
      class="border border-base-300 rounded p-4 hover:bg-base-200 transition cursor-pointer"
    >
      <h3 class="font-semibold">Getting Started</h3>
      <p class="text-sm text-gray-600 mt-1">
        Installation steps, initial configuration, and quick start guides.
      </p>
    </a>

    <a
      href="/account/knowledge_base/security_compliance"
      class="border border-base-300 rounded p-4 hover:bg-base-200 transition cursor-pointer"
    >
      <h3 class="font-semibold">Security & Compliance</h3>
      <p class="text-sm text-gray-600 mt-1">
        Learn about data protection, encryption, and industry standards.
      </p>
    </a>

    <a
      href="/account/knowledge_base/integrations"
      class="border border-base-300 rounded p-4 hover:bg-base-200 transition cursor-pointer"
    >
      <h3 class="font-semibold">Integrations</h3>
      <p class="text-sm text-gray-600 mt-1">
        Connect with Stripe, email providers, or CRM tools.
      </p>
    </a>

    <a
      href="/account/knowledge_base/advanced_setup"
      class="border border-base-300 rounded p-4 hover:bg-base-200 transition cursor-pointer"
    >
      <h3 class="font-semibold">Advanced Setup</h3>
      <p class="text-sm text-gray-600 mt-1">
        Delve into custom configurations and advanced features.
      </p>
    </a>

    <a
      href="/account/knowledge_base/billing_payments"
      class="border border-base-300 rounded p-4 hover:bg-base-200 transition cursor-pointer"
    >
      <h3 class="font-semibold">Billing & Payments</h3>
      <p class="text-sm text-gray-600 mt-1">
        Subscription plans, invoices, and payment troubleshooting.
      </p>
    </a>

    <a
      href="/account/knowledge_base/troubleshooting"
      class="border border-base-300 rounded p-4 hover:bg-base-200 transition cursor-pointer"
    >
      <h3 class="font-semibold">Troubleshooting</h3>
      <p class="text-sm text-gray-600 mt-1">
        Common fixes, debugging, and solutions to known issues.
      </p>
    </a>
  </div>
</div>
