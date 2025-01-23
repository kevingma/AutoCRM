import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Check if current user is an administrator
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("role, company_name, website")
    .eq("id", user.id)
    .single()

  if (adminProfileError || !adminProfile) {
    return { employees: [], isAdmin: false }
  }

  if (adminProfile.role !== "administrator") {
    return { employees: [], isAdmin: false }
  }

  // fetch employees with role=employee, employee_approved=false
  // that match same company_name or website
  const { data: unapproved, error: unapprovedError } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, website, role, employee_approved")
    .eq("role", "employee")
    .eq("employee_approved", false)
    .or(
      `company_name.eq.${adminProfile.company_name},website.eq.${adminProfile.website}`,
    )
    .order("updated_at", { ascending: false })

  if (unapprovedError) {
    console.error("Error fetching unapproved employees", unapprovedError)
    return { employees: [], isAdmin: true }
  }

  return {
    employees: unapproved,
    isAdmin: true,
  }
}

export const actions: Actions = {
  approve: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // check if user is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, company_name, website")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "administrator") {
      return fail(403, { errorMessage: "Not authorized" })
    }

    const formData = await request.formData()
    const employeeId = formData.get("employeeId") as string

    // ensure the user is indeed an employee for the same company or website
    const { data: empProfile, error: empError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", employeeId)
      .single()

    if (empError || !empProfile) {
      return fail(404, { errorMessage: "Employee not found" })
    }
    if (empProfile.role !== "employee") {
      return fail(400, { errorMessage: "Target user is not an employee" })
    }
    if (empProfile.employee_approved) {
      return fail(400, { errorMessage: "Already approved" })
    }

    // confirm same company or website
    if (
      empProfile.company_name !== adminProfile.company_name &&
      empProfile.website !== adminProfile.website
    ) {
      return fail(403, {
        errorMessage: "Employee does not match your company.",
      })
    }

    // Approve the employee
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ employee_approved: true })
      .eq("id", employeeId)

    if (updateError) {
      console.error("Error approving employee", updateError)
      return fail(500, { errorMessage: "Failed to approve employee." })
    }

    return { approved: true }
  },
}
