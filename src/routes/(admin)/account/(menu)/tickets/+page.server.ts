import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    // Not logged in
    throw redirect(303, "/login")
  }

  // Fetch user's profile with normal supabase (this is allowed by the "Profiles are viewable by self." policy)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching profile or profile is missing", profileError)
    return { tickets: [], userRole: "" }
  }

  const role = profile.role
  const companyName = profile.company_name
  const website = profile.website

  let sharedUserIds: string[] = []

  // For finding all matching user IDs from the same company/website, use supabaseServiceRole to avoid the infinite recursion policy check
  if (role === "administrator") {
    // fetch all profiles with same company or website
    const { data: relatedProfiles, error: rpError } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${companyName},website.eq.${website}`)

    if (rpError || !relatedProfiles) {
      console.error("Error fetching related profiles", rpError)
      return { tickets: [], userRole: role }
    }
    sharedUserIds = relatedProfiles.map((p) => p.id)
  } else if (role === "employee") {
    if (profile.employee_approved) {
      // employees who are approved see all from same company or website
      const { data: relatedProfiles, error: rpError } = await supabaseServiceRole
        .from("profiles")
        .select("id")
        .or(`company_name.eq.${companyName},website.eq.${website}`)
      if (rpError || !relatedProfiles) {
        console.error("Error fetching related profiles", rpError)
        return { tickets: [], userRole: role }
      }
      sharedUserIds = relatedProfiles.map((p) => p.id)
    } else {
      // not approved => only see own tickets
      sharedUserIds = [user.id]
    }
  } else {
    // role === 'customer' or other => see own tickets + same company/website
    const { data: relatedProfiles, error: rpError } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${companyName},website.eq.${website}`)

    if (rpError || !relatedProfiles) {
      console.error("Error fetching related profiles", rpError)
      return { tickets: [], userRole: role }
    }

    sharedUserIds = relatedProfiles.map((p) => p.id)
    if (!sharedUserIds.includes(user.id)) {
      sharedUserIds.push(user.id)
    }
  }

  // Now fetch open tickets for these user_ids with the normal supabase client
  // (assuming you want RLS enforcement on the 'tickets' table if any).
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("*")
    .in("user_id", sharedUserIds)
    .eq("status", "open")
    .order("created_at", { ascending: false })

  if (ticketsError) {
    console.error("Error fetching tickets", ticketsError)
    return { tickets: [], userRole: role }
  }

  return {
    tickets,
    userRole: role,
    companyName,
    website,
  }
}

export const actions: Actions = {
  createTicket: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!title || title.length < 3) {
      return fail(400, {
        errorMessage: "Title must be at least 3 characters",
        errorFields: ["title"],
        title,
        description,
      })
    }
    if (!description || description.length < 5) {
      return fail(400, {
        errorMessage: "Description must be at least 5 characters",
        errorFields: ["description"],
        title,
        description,
      })
    }

    // Insert new ticket
    const { error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        title,
        description,
      })

    if (error) {
      console.error("Error creating ticket", error)
      return fail(500, {
        errorMessage: "Could not create ticket, please try again",
        title,
        description,
      })
    }

    return { success: true }
  },
}