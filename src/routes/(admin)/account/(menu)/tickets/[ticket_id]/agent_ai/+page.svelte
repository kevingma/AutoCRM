<script lang="ts">
  import { onMount } from "svelte"
  import type { PageData, ActionData } from "./$types"
  import { enhance } from "$app/forms"

  export let data: PageData
  export let form: ActionData | null

  // local state
  let generating = false
  let generateError: string | null = null
  let newDraft: string | null = null

  let confirmRejectDraftId: string | null = null
  let rejectFeedback = ""
  let isRejecting = false

  let gradingDraftId: string | null = null
  let isGrading = false
  let gradeResult: any = null

  // We'll use SvelteKit's "enhance" to do progressive enhancement
  const handleGenerate = () => {
    generating = true
    generateError = null
    newDraft = null

    return async ({ result, update }) => {
      generating = false
      await update()
      if (result.type === "failure") {
        generateError = result.data?.error || "Unknown error"
      } else if (result.type === "success") {
        newDraft = result.data?.draftText
      }
    }
  }

  const handleApprove = () => {
    return async ({ result, update }) => {
      await update()
      // on success or fail, just refresh the page
      location.reload()
    }
  }
  const handleReject = () => {
    isRejecting = true
    return async ({ result, update }) => {
      isRejecting = false
      await update()
      location.reload()
    }
  }

  const handleGrade = () => {
    isGrading = true
    gradeResult = null
    return async ({ result, update }) => {
      isGrading = false
      await update()
      if (result.type === "failure") {
        // just reload for now
        location.reload()
      } else if (result.type === "success") {
        gradeResult = result.data?.grade
      }
    }
  }
</script>

<h1 class="text-2xl font-bold mb-4">
  AI Tools for Ticket #{data.ticket.id.slice(0, 8)}
</h1>
<p class="text-sm text-gray-600">
  {data.ticket.title} - Status: {data.ticket.status}
</p>

<!-- Generate new AI Draft -->
<div class="card bg-base-100 shadow mt-6">
  <div class="card-body">
    <h2 class="card-title text-lg mb-2">Generate AI Draft</h2>
    <form method="POST" action="?/generateDraft" use:enhance={handleGenerate}>
      {#if generateError}
        <p class="text-red-600">{generateError}</p>
      {/if}
      <button class="btn btn-primary" type="submit" disabled={generating}>
        {generating ? "Generating..." : "Generate Draft"}
      </button>
    </form>

    {#if newDraft}
      <div class="mt-4 p-3 border border-primary/20 bg-primary/5 rounded">
        <p class="text-sm font-semibold">AI Draft Response:</p>
        <pre class="mt-2 whitespace-pre-wrap text-sm">{newDraft}</pre>
      </div>
    {/if}
  </div>
</div>

<!-- Existing Drafts -->
<div class="mt-8">
  <h2 class="text-xl font-bold">Existing Drafts</h2>
  {#if data.drafts.length === 0}
    <p class="text-sm mt-2 text-gray-500">No drafts found.</p>
  {:else}
    <div class="space-y-4 mt-4">
      {#each data.drafts as draft}
        <div class="card shadow bg-base-100">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <div>
                <span class="text-sm font-semibold">Draft:</span>
                <span class="badge badge-info ml-2">{draft.status}</span>
              </div>
              {#if draft.grade}
                <span class="badge badge-secondary">
                  Quality={draft.grade.quality_score}, Accuracy={draft.grade
                    .accuracy_score}
                </span>
              {/if}
            </div>
            <!-- Draft content or modified_content if present -->
            <pre class="whitespace-pre-wrap text-sm bg-base-200 p-2 rounded">
{draft.modified_content || draft.content}
            </pre>

            <!-- If Rejected, show feedback -->
            {#if draft.status === "rejected" && draft.feedback}
              <div class="mt-2 text-red-600 text-sm">
                <strong>Rejection Reason:</strong>
                {draft.feedback}
              </div>
            {/if}

            <!-- If there's a grade summary, show it fully -->
            {#if draft.grade?.summary}
              <div class="text-sm mt-2 italic">
                <strong>Grade Summary:</strong>
                {draft.grade.summary}
                {#if draft.grade.concerns && draft.grade.concerns.length > 0}
                  <br />
                  <strong>Concerns:</strong>
                  {draft.grade.concerns.join(", ")}
                {/if}
              </div>
            {/if}

            <!-- Actions: Approve / Reject / Grade -->
            {#if draft.status === "pending" || draft.status === "modified"}
              <div class="mt-4 flex gap-2 items-center">
                <!-- Approve -->
                <form
                  method="POST"
                  action="?/approveDraft"
                  use:enhance={handleApprove}
                >
                  <input type="hidden" name="draftId" value={draft.id} />
                  <button class="btn btn-sm btn-accent" type="submit"
                    >Approve</button
                  >
                </form>

                <!-- Reject -->
                <button
                  class="btn btn-sm"
                  on:click={() => {
                    confirmRejectDraftId = draft.id
                    rejectFeedback = ""
                  }}
                >
                  Reject
                </button>

                <!-- Grade -->
                <form
                  method="POST"
                  action="?/gradeDraft"
                  use:enhance={handleGrade}
                  class="inline"
                >
                  <input type="hidden" name="draftId" value={draft.id} />
                  <!-- We'll pass the actual content to be graded -->
                  <input
                    type="hidden"
                    name="content"
                    value={draft.modified_content || draft.content}
                  />
                  <button
                    class="btn btn-sm btn-secondary"
                    type="submit"
                    disabled={isGrading}
                  >
                    {isGrading && gradingDraftId === draft.id
                      ? "Grading..."
                      : "Grade"}
                  </button>
                </form>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Reject Confirmation Modal -->
{#if confirmRejectDraftId}
  <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="bg-base-100 p-4 rounded max-w-md w-full">
      <h3 class="text-lg font-bold mb-3">Reject Draft</h3>
      <p class="text-sm mb-2">
        Provide feedback on why you're rejecting this draft.
      </p>
      <textarea
        class="textarea textarea-bordered w-full"
        rows="3"
        bind:value={rejectFeedback}
      ></textarea>
      <div class="mt-4 flex gap-2 justify-end">
        <button
          class="btn"
          on:click={() => {
            confirmRejectDraftId = null
            rejectFeedback = ""
          }}
        >
          Cancel
        </button>
        <form
          method="POST"
          action="?/rejectDraft"
          use:enhance={handleReject}
          class="inline"
        >
          <input type="hidden" name="draftId" value={confirmRejectDraftId} />
          <input type="hidden" name="feedback" value={rejectFeedback} />
          <button class="btn btn-error" type="submit" disabled={isRejecting}>
            {isRejecting ? "Rejecting..." : "Reject"}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}
