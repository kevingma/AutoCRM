<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import Editor from "@tinymce/tinymce-svelte"

  // CHANGE BELOW: import from $env/dynamic/public instead of $env/static/public
  import { env as publicEnv } from "$env/dynamic/public"

  let errors: Record<string, string> = {}
  let loading = false

  // Use the dynamic public env var, or fallback to an empty string
  const TINYMCE_API_KEY = publicEnv.PUBLIC_TINYMCE_API_KEY ?? ""

  // For the rich text editor
  let descriptionHtml = ""

  const editorConfig = {
    apiKey: TINYMCE_API_KEY, // pass the key here
    height: 300,
    menubar: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "charmap",
      "preview",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "table",
      "wordcount",
    ],
    toolbar:
      "undo redo | formatselect | " +
      "bold italic | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist | " +
      "removeformat",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
  }

  const handleSubmit: SubmitFunction = () => {
    loading = true
    errors = {}
    return async ({ update, result }) => {
      await update({ reset: false })
      loading = false
      if (result.type === "failure") {
        if (result.data?.errorMessage) {
          errors["_"] = result.data.errorMessage
        }
        const fieldErrs = result.data?.errorFields ?? []
        fieldErrs.forEach((f: string) => {
          errors[f] = "Error"
        })
      } else if (result.type === "success") {
        window.location.href = "/account/tickets"
      }
    }
  }
</script>

<svelte:head>
  <title>Create Ticket</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-xl mx-auto mt-8">
  <h1 class="text-2xl font-bold">Create a New Ticket</h1>

  <form
    method="POST"
    action="?/createTicket"
    use:enhance={handleSubmit}
    class="flex flex-col gap-4"
  >
    <!-- Title -->
    <div>
      <label for="title" class="block font-semibold mb-1">Title</label>
      <input
        id="title"
        name="title"
        type="text"
        placeholder="Short title..."
        class="input input-bordered w-full {errors.title ? 'input-error' : ''}"
      />
    </div>

    <!-- Details (Rich Text) -->
    <div>
      <label for="description" class="block font-semibold mb-1">Details</label>
      <Editor
        apiKey={TINYMCE_API_KEY}
        conf={editorConfig}
        bind:value={descriptionHtml}
        id="description"
      />
      <input type="hidden" name="description" value={descriptionHtml} />
      {#if errors.description}
        <div class="text-red-600">Please provide more details.</div>
      {/if}
    </div>

    <!-- Priority -->
    <div>
      <label for="priority" class="block font-semibold mb-1">Priority</label>
      <select
        id="priority"
        name="priority"
        class="select select-bordered w-full {errors.priority
          ? 'border-error'
          : ''}"
      >
        <option value="high">High</option>
        <option value="medium" selected>Medium</option>
        <option value="low">Low</option>
      </select>
    </div>

    <!-- Any error message -->
    {#if errors._}
      <div class="text-red-600 font-semibold">{errors._}</div>
    {/if}

    <!-- Submit -->
    <button type="submit" class="btn btn-primary" disabled={loading}>
      {loading ? "Creating..." : "Create Ticket"}
    </button>
  </form>
</div>
