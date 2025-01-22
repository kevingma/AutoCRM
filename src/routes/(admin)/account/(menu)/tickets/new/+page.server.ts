import { fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()
  if (!session) {
    throw redirect(303, "/login")
  }
  // No special data needed, just display the form.
  return {}
}

export const actions: Actions = {
  createTicket: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Fetch user profile to check approvals
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, employee_approved, customer_approved")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("Error fetching profile or missing", profileError)
      return fail(500, { errorMessage: "Unable to verify your profile" })
    }

    // For employees or customers, ensure they are approved before allowing ticket creation
    if (profile.role === "employee" && !profile.employee_approved) {
      return fail(403, {
        errorMessage:
          "Your employee account has not been approved by an administrator.",
      })
    }
    if (profile.role === "customer" && !profile.customer_approved) {
      return fail(403, {
        errorMessage:
          "Your customer account has not been approved by an administrator.",
      })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const priority = formData.get("priority") as string

    if (!title || title.length < 3) {
      return fail(400, {
        errorMessage: "Title must be at least 3 characters",
        errorFields: ["title"],
      })
    }
    if (!description || description.length < 5) {
      return fail(400, {
        errorMessage: "Description must be at least 5 characters",
        errorFields: ["description"],
      })
    }
    if (!priority) {
      return fail(400, {
        errorMessage: "Priority is required",
        errorFields: ["priority"],
      })
    }

    // Insert ticket
    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      title,
      description,
      priority,
    })

    if (error) {
      console.error("Error creating ticket", error)
      return fail(500, {
        errorMessage: "Could not create ticket, please try again",
      })
    }

    return { success: true }
  },
}