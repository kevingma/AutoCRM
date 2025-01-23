<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  // ADD THESE LINES:
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("knowledge_base")
  // END ADD

  // Example knowledge base articles or FAQs
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

  let searchQuery = $state("")
  let filteredResults = $derived(
    kbData.filter((entry) => {
      // Simple case-insensitive search in question and answer
      const q = searchQuery.toLowerCase()
      return (
        entry.question.toLowerCase().includes(q) ||
        entry.answer.toLowerCase().includes(q)
      )
    }),
  )
</script>

<svelte:head>
  <title>Knowledge Base</title>
</svelte:head>

<div class="flex flex-col gap-4 w-full max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mt-6">Knowledge Base</h1>
  <p class="text-sm text-gray-600">
    Find quick answers to frequently asked questions below.
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
</div>
