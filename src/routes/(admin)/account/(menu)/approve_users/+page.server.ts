import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

// Loads unapproved employees/customers in the same company as the admin
export const load: PageServerLoad = async ({
  locals: { safeGetSession, supabase }
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Fetch the admin's profile
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("role, company_name")
    .eq("id", user.id)
    .single()

  if (adminProfileError || !adminProfile) {
    return { pendingUsers: [], isAdmin: false }
  }

  if (adminProfile.role !== "administrator") {
    // Only administrators can approve
    return { pendingUsers: [], isAdmin: false }
  }

  const adminCompany = adminProfile.company_name ?? ""
  if (!adminCompany) {
    // Edge case: admin has no company name. No results
    return { pendingUsers: [], isAdmin: true }
  }

  // Retrieve employees or customers that have the same company_name, not approved
  // We'll gather them in a single list with some extra info
  const { data: pendingProfiles, error: pendingError } = await supabase
    .from("profiles")
    .select("id, full_name, role, employee_approved, customer_approved")
    .eq("company_name", adminCompany)
    .or("role.eq.employee,role.eq.customer")  // only employees or customers
    .or("employee_approved.eq.false,customer_approved.eq.false") // unapproved
    // The above or() calls might need parentheses if you want to strictly combine them
    // but Supabase doesn't always require it if the logic is or(and(and()))
    // if needed, could do .filter('employee_approved', 'eq', false).or('customer_approved.eq.false')

  if (pendingError) {
    return { pendingUsers: [], isAdmin: true }
  }

  // Filter out any that are actually approved
  // (In case the or() logic picks up partial).
  const unapprovedList = (pendingProfiles || []).filter((p) => {
    if (p.role === "employee" && p.employee_approved === false) return true
    if (p.role === "customer" && p.customer_approved === false) return true
    return false
  })

  return {
    pendingUsers: unapprovedList,
    isAdmin: true,
  }
}

// Approve selected user
export const actions: Actions = {
  approveUser: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    // Check if this user is an administrator
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, company_name")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }
    const formData = await request.formData()
    const targetUserId = formData.get("targetUserId") as string | null

    if (!targetUserId) {
      return fail(400, { errorMessage: "No user specified" })
    }

    // Retrieve the target's role and approval fields
    const { data: targetProfile, error: tgtError } = await supabase
      .from("profiles")
      .select("id, role, company_name, employee_approved, customer_approved")
      .eq("id", targetUserId)
      .single()

    if (tgtError || !targetProfile) {
      return fail(404, { errorMessage: "Target user not found" })
    }

    // Must be same company as the admin's company
    if (targetProfile.company_name !== adminProfile.company_name) {
      return fail(403, {
        errorMessage: "This user is not in your company",
      })
    }

    let updates: Record<string, boolean> = {}
    if (targetProfile.role === "employee") {
      updates.employee_approved = true
    } else if (targetProfile.role === "customer") {
      updates.customer_approved = true
    } else {
      return fail(400, { errorMessage: "User is not an employee or customer" })
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId)

    if (updateErr) {
      return fail(500, {
        errorMessage: "Failed to approve user. Try again later."
      })
    }

    return { success: true }
  },
}