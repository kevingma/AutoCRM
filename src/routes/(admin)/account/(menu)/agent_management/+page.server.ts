import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { createClient } from "@supabase/supabase-js"
import { PRIVATE_SUPABASE_SERVICE_ROLE } from "$env/static/private"
import { PUBLIC_SUPABASE_URL } from "$env/static/public"

/**
 * Provides a single "Agent Management" page for administrators, allowing them to:
 *   - Approve new employees or customers
 *   - View and remove existing employees or customers
 *   - Assign employees (agents) to teams
 *   - Remove employees from teams
 *   - Add or remove skill assignments for employees
 */
export const load: PageServerLoad = async ({
  locals: { safeGetSession, supabaseServiceRole },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Must be an administrator
  const { data: adminProfile, error: adminProfileError } =
    await supabaseServiceRole
      .from("profiles")
      .select("role, company_name, website")
      .eq("id", user.id)
      .single()

  if (
    adminProfileError ||
    !adminProfile ||
    adminProfile.role !== "administrator"
  ) {
    throw redirect(303, "/account")
  }

  const companyName = adminProfile.company_name ?? ""
  const companyWebsite = adminProfile.website ?? ""

  // 1) Pending Approvals (both employees and customers not yet approved)
  //   - employee => employee_approved=false
  //   - customer => customer_approved=false
  const { data: pendingProfiles } = await supabaseServiceRole
    .from("profiles")
    .select("id, full_name, role, employee_approved, customer_approved")
    .or("role.eq.employee,role.eq.customer")
    .or("employee_approved.eq.false,customer_approved.eq.false")
    .or(`company_name.eq.${companyName},website.eq.${companyWebsite}`)

  const pendingApprovals = (pendingProfiles || []).filter((p) => {
    if (p.role === "employee" && !p.employee_approved) return true
    if (p.role === "customer" && !p.customer_approved) return true
    return false
  })

  // 2) Current Agents (employees who are employee_approved=true)
  const { data: approvedAgents } = await supabaseServiceRole
    .from("profiles")
    .select("id, full_name, role, employee_approved")
    .eq("role", "employee")
    .eq("employee_approved", true)
    .or(`company_name.eq.${companyName},website.eq.${companyWebsite}`)

  // 3) Current Customers (customers who are customer_approved=true)
  const { data: approvedCustomers } = await supabaseServiceRole
    .from("profiles")
    .select("id, full_name, role, customer_approved")
    .eq("role", "customer")
    .eq("customer_approved", true)
    .or(`company_name.eq.${companyName},website.eq.${companyWebsite}`)

  // 4) All Teams (for assignment)
  const { data: teams } = await supabaseServiceRole
    .from("teams")
    .select("id, name, focus_area")

  // 5) Team memberships to see who is in which team
  //    We'll gather for the approved agents
  const agentIds = (approvedAgents || []).map((a) => a.id)
  let teamMemberships: { user_id: string; team_id: string }[] = []
  if (agentIds.length > 0) {
    const { data: memberships } = await supabaseServiceRole
      .from("team_members")
      .select("user_id, team_id")
      .in("user_id", agentIds)
    teamMemberships = memberships || []
  }

  // 6) Skills
  const { data: allSkills } = await supabaseServiceRole
    .from("skills")
    .select("id, skill_name")

  // 7) Employee skill assignments
  let employeeSkills: { user_id: string; skill_id: string }[] = []
  if (agentIds.length > 0) {
    const { data: es } = await supabaseServiceRole
      .from("employee_skills")
      .select("user_id, skill_id")
      .in("user_id", agentIds)
    employeeSkills = es || []
  }

  return {
    isAdmin: true,
    pendingApprovals,
    currentAgents: approvedAgents ?? [],
    currentCustomers: approvedCustomers ?? [],
    teams: teams ?? [],
    teamMemberships,
    allSkills: allSkills ?? [],
    employeeSkills,
  }
}

export const actions: Actions = {
  approveUser: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Must be admin
    const { data: adminProfile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId")?.toString()

    if (!targetUserId) {
      return fail(400, { errorMessage: "No user specified" })
    }

    // fetch target
    const { data: targetProfile, error: fetchError } = await supabaseServiceRole
      .from("profiles")
      .select("id, role, employee_approved, customer_approved")
      .eq("id", targetUserId)
      .single()

    if (fetchError || !targetProfile) {
      return fail(404, { errorMessage: "User not found" })
    }

    let updates: Record<string, boolean> = {}
    if (targetProfile.role === "employee") {
      if (targetProfile.employee_approved) {
        return fail(400, { errorMessage: "Employee is already approved" })
      }
      updates = { employee_approved: true }
    } else if (targetProfile.role === "customer") {
      if (targetProfile.customer_approved) {
        return fail(400, { errorMessage: "Customer is already approved" })
      }
      updates = { customer_approved: true }
    } else {
      return fail(400, { errorMessage: "Not employee or customer role" })
    }

    const { error: updateError } = await supabaseServiceRole
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId)

    if (updateError) {
      return fail(500, { errorMessage: "Could not update user approval." })
    }

    return { success: true }
  },

  removeUser: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    // Must be admin
    const { data: adminProfile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId")?.toString()
    if (!targetUserId) {
      return fail(400, { errorMessage: "No user specified" })
    }

    // Finally remove user with supabase service role
    const { error: deleteError } =
      await supabaseServiceRole.auth.admin.deleteUser(targetUserId, true)

    if (deleteError) {
      return fail(500, { errorMessage: "Failed to remove user." })
    }

    return { success: true }
  },

  assignTeam: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    // Must be admin
    const { data: adminProfile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId")?.toString()
    const teamId = formData.get("teamId")?.toString()

    if (!targetUserId || !teamId) {
      return fail(400, { errorMessage: "Missing user or team." })
    }

    const generatedId = crypto.randomUUID()

    const { error: insertError } = await supabaseServiceRole
      .from("team_members")
      .insert({
        id: generatedId, // <-- ensure we supply an ID if needed
        user_id: targetUserId,
        team_id: teamId,
      })

    if (insertError && !insertError.message.includes("duplicate key")) {
      return fail(500, { errorMessage: "Failed to assign team." })
    }

    return { success: true }
  },

  removeTeam: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    // Must be admin
    const { data: adminProfile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId")?.toString()
    const teamId = formData.get("teamId")?.toString()

    if (!targetUserId || !teamId) {
      return fail(400, { errorMessage: "Missing user or team." })
    }

    // Remove from team
    const { error: deleteErr } = await supabaseServiceRole
      .from("team_members")
      .delete()
      .eq("user_id", targetUserId)
      .eq("team_id", teamId)

    if (deleteErr) {
      return fail(500, { errorMessage: "Failed to remove from team." })
    }

    return { success: true }
  },

  addSkill: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    // Must be admin
    const { data: adminProfile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId")?.toString()
    const skillId = formData.get("skillId")?.toString()

    if (!targetUserId || !skillId) {
      return fail(400, { errorMessage: "Missing user or skill." })
    }

    // Insert if not exists
    const { error: insertError } = await supabaseServiceRole
      .from("employee_skills")
      .insert({ user_id: targetUserId, skill_id: skillId })

    if (insertError && !insertError.message.includes("duplicate key")) {
      return fail(500, { errorMessage: "Failed to add skill." })
    }

    return { success: true }
  },

  removeSkill: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    // Must be admin
    const { data: adminProfile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId")?.toString()
    const skillId = formData.get("skillId")?.toString()

    if (!targetUserId || !skillId) {
      return fail(400, { errorMessage: "Missing user or skill." })
    }

    const { error: deleteErr } = await supabaseServiceRole
      .from("employee_skills")
      .delete()
      .eq("user_id", targetUserId)
      .eq("skill_id", skillId)

    if (deleteErr) {
      return fail(500, { errorMessage: "Failed to remove skill." })
    }

    return { success: true }
  },
}
