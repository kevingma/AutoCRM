<script lang="ts">
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  export let data: {
    teams: {
      id: string
      name: string
      focus_area: string | null
      coverage_start_time_utc: number | null
      coverage_end_time_utc: number | null
      created_at?: string
    }[]
    form?: {
      error?: string
    }
  }

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("teams")

  let createError: string | null = null
  let deleteError: string | null = null

  const handleCreate: SubmitFunction = () => {
    createError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        createError = result.data?.error || "Unable to create team."
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }

  const handleDelete: SubmitFunction = () => {
    deleteError = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        deleteError = result.data?.error || "Unable to delete team."
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }
</script>

<svelte:head>
  <title>Manage Teams</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-4">Team Management</h1>

<div class="card shadow mb-6 max-w-xl p-4">
  <h2 class="text-xl font-semibold mb-2">Create Team</h2>
  <form method="POST" action="?/createTeam" use:enhance={handleCreate}>
    <div class="mb-3">
      <label for="teamName" class="block font-semibold">Team Name</label>
      <input
        type="text"
        id="teamName"
        name="teamName"
        class="input input-bordered w-full mt-1"
        placeholder="E.g. Billing Team"
      />
    </div>
    <div class="mb-3">
      <label for="focusArea" class="block font-semibold">Focus Area</label>
      <input
        type="text"
        id="focusArea"
        name="focusArea"
        class="input input-bordered w-full mt-1"
        placeholder="E.g. billing, priority, general"
      />
    </div>
    <div class="mb-3 flex gap-4">
      <div>
        <label for="coverageStart" class="block font-semibold"
          >Coverage Start (UTC hour)</label
        >
        <input
          type="number"
          id="coverageStart"
          name="coverageStart"
          class="input input-bordered w-28 mt-1"
          min="0"
          max="23"
          value="0"
        />
      </div>
      <div>
        <label for="coverageEnd" class="block font-semibold"
          >Coverage End (UTC hour)</label
        >
        <input
          type="number"
          id="coverageEnd"
          name="coverageEnd"
          class="input input-bordered w-28 mt-1"
          min="0"
          max="23"
          value="23"
        />
      </div>
    </div>
    {#if createError}
      <div class="text-red-600 mb-2">{createError}</div>
    {/if}
    <button class="btn btn-primary" type="submit">Create Team</button>
  </form>
</div>

<div class="card shadow max-w-xl p-4">
  <h2 class="text-xl font-semibold mb-2">Existing Teams</h2>

  {#if data.teams.length === 0}
    <p class="text-gray-600">No teams found.</p>
  {:else}
    <table class="table w-full mt-4">
      <thead>
        <tr>
          <th>Name</th>
          <th>Focus Area</th>
          <th>Coverage</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.teams as team}
          <tr>
            <td>{team.name}</td>
            <td>{team.focus_area ?? "general"}</td>
            <td>
              {team.coverage_start_time_utc} - {team.coverage_end_time_utc}
              (UTC)
            </td>
            <td>
              <form
                method="POST"
                action="?/deleteTeam"
                use:enhance={handleDelete}
              >
                <input type="hidden" name="teamId" value={team.id} />
                <button class="btn btn-sm btn-error" type="submit">
                  Delete
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  {#if deleteError}
    <div class="text-red-600 mt-2">{deleteError}</div>
  {/if}
</div>
