<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"
  import { enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  export let data: {
    isAdmin: boolean
    pendingApprovals: {
      id: string
      full_name: string | null
      role: string
      employee_approved: boolean
      customer_approved: boolean
    }[]
    currentAgents: {
      id: string
      full_name: string | null
      role: string
      employee_approved: boolean
    }[]
    currentCustomers: {
      id: string
      full_name: string | null
      role: string
      customer_approved: boolean
    }[]
    teams: {
      id: string
      name: string
      focus_area: string | null
    }[]
    teamMemberships: {
      user_id: string
      team_id: string
    }[]
    allSkills: {
      id: string
      skill_name: string
    }[]
    employeeSkills: {
      user_id: string
      skill_id: string
    }[]
  }

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("agent_management")

  // Error placeholders for dynamic actions
  let errorMsg: string | null = null
  let confirmRemoveUserId: string | null = null

  // Approve user
  const handleApprove: SubmitFunction = () => {
    errorMsg = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        errorMsg = result.data?.errorMessage || "Failed to approve user"
      } else {
        location.reload()
      }
    }
  }

  // Remove user
  const handleRemove: SubmitFunction = () => {
    errorMsg = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        errorMsg = result.data?.errorMessage || "Failed to remove user"
      } else {
        location.reload()
      }
    }
  }

  // Assign or remove a team
  const handleAssignTeam: SubmitFunction = () => {
    errorMsg = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        errorMsg = result.data?.errorMessage || "Team assignment failed"
      } else {
        location.reload()
      }
    }
  }
  const handleRemoveTeam: SubmitFunction = handleAssignTeam

  // Add or remove skill
  const handleAddSkill: SubmitFunction = () => {
    errorMsg = null
    return async ({ update, result }) => {
      await update({ reset: false })
      if (result.type === "failure") {
        errorMsg = result.data?.errorMessage || "Adding skill failed"
      } else {
        location.reload()
      }
    }
  }
  const handleRemoveSkill: SubmitFunction = handleAddSkill
</script>

<svelte:head>
  <title>Agent Management</title>
</svelte:head>

{#if !data.isAdmin}
  <h2 class="text-2xl font-bold">Not Authorized</h2>
  <p>You must be an administrator to view this page.</p>
{:else}
  <h1 class="text-2xl font-bold mb-4">Agent Management</h1>

  {#if errorMsg}
    <div class="alert alert-error mb-4">
      <span>{errorMsg}</span>
    </div>
  {/if}

  <!-- SECTION 1: Pending Approvals -->
  <div class="mb-8">
    <h2 class="text-xl font-semibold">Pending Approvals</h2>
    {#if data.pendingApprovals.length === 0}
      <p class="text-gray-600 mt-2">No pending employees or customers.</p>
    {:else}
      <div class="overflow-x-auto mt-2">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Approve</th>
            </tr>
          </thead>
          <tbody>
            {#each data.pendingApprovals as u}
              <tr>
                <td>{u.full_name ?? "(No Name)"}</td>
                <td>{u.role}</td>
                <td>
                  <form
                    method="POST"
                    action="?/approveUser"
                    use:enhance={handleApprove}
                  >
                    <input type="hidden" name="targetUserId" value={u.id} />
                    <button class="btn btn-sm btn-primary" type="submit"
                      >Approve</button
                    >
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- SECTION 2: Current Agents (Employees) -->
  <div class="mb-8">
    <h2 class="text-xl font-semibold">Current Agents</h2>
    {#if data.currentAgents.length === 0}
      <p class="text-gray-600 mt-2">No approved agents found.</p>
    {:else}
      <div class="overflow-x-auto mt-2">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Teams</th>
              <th>Skills</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.currentAgents as a}
              <tr>
                <td>{a.full_name ?? a.id}</td>
                <td>
                  <!-- Show the teams this agent is in -->
                  {#each data.teamMemberships.filter((m) => m.user_id === a.id) as membership}
                    <div class="badge badge-info mr-1">
                      {#each data.teams.filter((t) => t.id === membership.team_id) as t}
                        {t.name}
                      {/each}
                      <!-- Remove button -->
                      <form
                        method="POST"
                        action="?/removeTeam"
                        use:enhance={handleRemoveTeam}
                        class="inline ml-2"
                      >
                        <input type="hidden" name="targetUserId" value={a.id} />
                        <input
                          type="hidden"
                          name="teamId"
                          value={membership.team_id}
                        />
                        <button
                          type="submit"
                          class="btn btn-xs btn-outline btn-circle ml-1"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  {/each}

                  <!-- Add a team -->
                  <details class="dropdown dropdown-left inline-block">
                    <summary class="btn btn-xs btn-outline ml-1">
                      + Team
                    </summary>
                    <ul
                      class="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-40 mt-1"
                    >
                      {#each data.teams as t}
                        <!-- only show if not in that team already -->
                        {#if !data.teamMemberships.find((m) => m.user_id === a.id && m.team_id === t.id)}
                          <li>
                            <form
                              method="POST"
                              action="?/assignTeam"
                              use:enhance={handleAssignTeam}
                            >
                              <input
                                type="hidden"
                                name="targetUserId"
                                value={a.id}
                              />
                              <input type="hidden" name="teamId" value={t.id} />
                              <button type="submit">{t.name}</button>
                            </form>
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  </details>
                </td>
                <td>
                  <!-- Show existing skills -->
                  {#each data.employeeSkills.filter((s) => s.user_id === a.id) as es}
                    <div class="badge badge-secondary mr-1">
                      {#each data.allSkills.filter((skill) => skill.id === es.skill_id) as sk}
                        {sk.skill_name}
                      {/each}
                      <form
                        method="POST"
                        action="?/removeSkill"
                        use:enhance={handleRemoveSkill}
                        class="inline ml-2"
                      >
                        <input type="hidden" name="targetUserId" value={a.id} />
                        <input
                          type="hidden"
                          name="skillId"
                          value={es.skill_id}
                        />
                        <button
                          type="submit"
                          class="btn btn-xs btn-outline btn-circle ml-1"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  {/each}

                  <!-- Add a skill -->
                  <details class="dropdown dropdown-left inline-block">
                    <summary class="btn btn-xs btn-outline ml-1">
                      + Skill
                    </summary>
                    <ul
                      class="p-2 shadow menu dropdown-content bg-base-100 rounded-box w-40 mt-1"
                    >
                      {#each data.allSkills as sk}
                        {#if !data.employeeSkills.find((es) => es.user_id === a.id && es.skill_id === sk.id)}
                          <li>
                            <form
                              method="POST"
                              action="?/addSkill"
                              use:enhance={handleAddSkill}
                            >
                              <input
                                type="hidden"
                                name="targetUserId"
                                value={a.id}
                              />
                              <input
                                type="hidden"
                                name="skillId"
                                value={sk.id}
                              />
                              <button type="submit">{sk.skill_name}</button>
                            </form>
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  </details>
                </td>
                <td>
                  <form
                    method="POST"
                    action="?/removeUser"
                    use:enhance={handleRemove}
                  >
                    <input type="hidden" name="targetUserId" value={a.id} />
                    <button
                      class="btn btn-sm btn-error"
                      type="submit"
                      onclick={() => (confirmRemoveUserId = a.id)}
                    >
                      Remove
                    </button>
                  </form>
                  <a
                    href={`/account/agent_management/${a.id}`}
                    class="btn btn-sm btn-outline"
                  >
                    View Stats
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- SECTION 3: Current Customers -->
  <div class="mb-8">
    <h2 class="text-xl font-semibold">Current Customers</h2>
    {#if data.currentCustomers.length === 0}
      <p class="text-gray-600 mt-2">No approved customers found.</p>
    {:else}
      <div class="overflow-x-auto mt-2">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.currentCustomers as c}
              <tr>
                <td>{c.full_name ?? c.id}</td>
                <td>
                  <form
                    method="POST"
                    action="?/removeUser"
                    use:enhance={handleRemove}
                  >
                    <input type="hidden" name="targetUserId" value={c.id} />
                    <button class="btn btn-sm btn-error" type="submit">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
{/if}
