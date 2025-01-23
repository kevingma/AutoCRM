<script lang="ts">
  import { enhance } from "$app/forms" // removed onMount, applyAction
  import type { SubmitFunction } from "@sveltejs/kit"

  export let data: {
    employees: {
      id: string
      full_name: string | null
      company_name: string | null
      website: string | null
      role: string
      employee_approved: boolean
    }[]
    isAdmin: boolean
    form?: {
      errorMessage?: string
    }
  }

  let errors: Record<string, string> = {}

  const handleApprove: SubmitFunction = () => {
    errors = {}
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        if (result.data?.errorMessage) {
          errors["_"] = result.data.errorMessage
        }
      } else if (result.type === "success") {
        location.reload()
      }
    }
  }
</script>

<svelte:head>
  <title>Approve Employees</title>
</svelte:head>

{#if !data.isAdmin}
  <h2 class="text-2xl font-bold">Not Authorized</h2>
  <p>You must be an administrator to view this page.</p>
{:else}
  <h2 class="text-2xl font-bold mb-4">Pending Employees</h2>
  {#if data.employees.length === 0}
    <p>No pending employees found.</p>
  {:else}
    <table class="table table-zebra w-full max-w-xl">
      <thead>
        <tr>
          <th>Name</th>
          <th>Company</th>
          <th>Website</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.employees as emp}
          <tr>
            <td>{emp.full_name}</td>
            <td>{emp.company_name}</td>
            <td>{emp.website}</td>
            <td>
              <form
                method="POST"
                action="?/approve"
                use:enhance={handleApprove}
              >
                <input type="hidden" name="employeeId" value={emp.id} />
                <button class="btn btn-sm btn-primary" type="submit">
                  Approve
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if errors._}
      <div class="text-red-600 font-semibold mt-3">{errors._}</div>
    {/if}
  {/if}
{/if}
