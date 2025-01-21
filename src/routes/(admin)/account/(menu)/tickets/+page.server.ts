import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    // Not logged in
    throw redirect(303, "/login")
  }

  // Fetch user's profile to see role, company, website
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Error fetching profile", profileError)
    return { tickets: [], userRole: "" }
  }

  // If not customer, we can handle differently or just show no tickets
  // But as requested, only 'customer' sees the combined open tickets
  if (profile.role !== "customer") {
    // For demonstration, if user is not 'customer', just return tickets from themselves
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (ticketsError) {
      console.error("Error fetching tickets for non-customer", ticketsError)
      return { tickets: [], userRole: profile.role }
    }

    return { tickets, userRole: profile.role }
  }

  // For 'customer' role: show open tickets for
  //    - user_id = me
  //    - OR same company_name
  //    - OR same website
  // We can do it in a single supabase query with an OR
  //  eq("status", "open").or(`company_name.eq.${profile.company_name},website.eq.${profile.website}`) doesn't work directly
  // We'll do a join or multiple queries for demonstration. Or we can do 2 queries. 
  // For simplicity, let's fetch user IDs that share the same company or website.

  // first find all profiles that share company or website
  const { data: sharedProfiles, error: sharedProfilesError } = await supabase
    .from("profiles")
    .select("id")
    .or(`company_name.eq.${profile.company_name},website.eq.${profile.website}`)

  if (sharedProfilesError) {
    console.error("Error fetching shared profiles", sharedProfilesError)
    return { tickets: [], userRole: profile.role }
  }

  // create an array of user_ids including self
  const sharedUserIds = sharedProfiles.map((p) => p.id)
  if (!sharedUserIds.includes(user.id)) {
    sharedUserIds.push(user.id)
  }

  // now fetch open tickets from these user_ids
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("*")
    .in("user_id", sharedUserIds)
    .eq("status", "open")
    .order("created_at", { ascending: false })

  if (ticketsError) {
    console.error("Error fetching tickets", ticketsError)
    return { tickets: [], userRole: profile.role }
  }

  return {
    tickets,
    userRole: profile.role,
    companyName: profile.company_name,
    website: profile.website
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
        description
      })
    }
    if (!description || description.length < 5) {
      return fail(400, {
        errorMessage: "Description must be at least 5 characters",
        errorFields: ["description"],
        title,
        description
      })
    }

    // Insert new ticket
    const { error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        title,
        description
      })

    if (error) {
      console.error("Error creating ticket", error)
      return fail(500, {
        errorMessage: "Could not create ticket, please try again",
        title,
        description
      })
    }

    return { success: true }
  }
}
