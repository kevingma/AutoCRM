<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"
  import { enhance, applyAction } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  // Use the adminSection store to highlight this page in the sidebar
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("approvals")

  export let data: {
    pendingUsers: {
      id: string
      full_name: string | null
      role: string
      employee_approved: boolean
      customer_approved: boolean
    }[]
    isAdmin: boolean
  }

  let errorMessage = ""
  let loading = false

  const handleApprove: SubmitFunction = () => {
    loading = true
    errorMessage = ""
    return async ({ update, result }) => {
      await update({ reset: false })
      loading = false
      if (result.type === "failure") {
        errorMessage = result.data?.errorMessage ?? "Failed to approve user"
      } else if (result.type === "success") {
        // reload page
        location.reload()
      }
    }
  }
</script>

<svelte:head>
  <title>Approve Users</title>
</svelte:head>

<div class="flex flex-col">
  <h1 class="text-2xl font-bold mb-4">Approve Users</h1>

  {#if !data.isAdmin}
    <p class="text-red-500">You must be an administrator to view this page.</p>
  {:else if data.pendingUsers.length === 0}
    <p class="text-gray-600">No unapproved users found for your company.</p>
  {:else}
    <p class="mb-4">
      Below are <strong>unapproved employees or customers</strong> who share your
      company's name. Approving an employee or customer will allow them to create
      tickets.
    </p>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th class="text-center">Approve</th>
          </tr>
        </thead>
        <tbody>
          {#each data.pendingUsers as u}
            <tr>
              <td>{u.full_name || "(No Name)"} <small>({u.id})</small></td>
              <td class="uppercase">{u.role}</td>
              <td class="text-center">
                <form
                  method="POST"
                  action="?/approveUser"
                  use:enhance={handleApprove}
                >
                  <input type="hidden" name="targetUserId" value={u.id} />
                  <button class="btn btn-sm btn-primary" type="submit">
                    Approve
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if errorMessage}
      <p class="text-red-500 mt-3">{errorMessage}</p>
    {/if}
  {/if}
</div>
