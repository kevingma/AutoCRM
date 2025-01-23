import { redirect } from "@sveltejs/kit" // removed fail import
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  url,
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching profile or missing", profileError)
    return { tickets: [], userRole: "" }
  }

  const role = profile.role
  const companyName = profile.company_name
  const website = profile.website
  let sharedUserIds: string[] = []

  // Admin or (approved) employee => see same-company tickets. Otherwise see your own & same company/website.
  if (role === "administrator") {
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${companyName},website.eq.${website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
  } else if (role === "employee") {
    if (profile.employee_approved) {
      const { data: relatedProfiles } = await supabaseServiceRole
        .from("profiles")
        .select("id")
        .or(`company_name.eq.${companyName},website.eq.${website}`)
      sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    } else {
      // not approved => only own
      sharedUserIds = [user.id]
    }
  } else {
    // role === 'customer'
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${companyName},website.eq.${website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    if (!sharedUserIds.includes(user.id)) {
      sharedUserIds.push(user.id)
    }
  }

  // Filter by status and priority, then sort by time
  const statusParam = url.searchParams.get("status") || "open"
  const sortParam = url.searchParams.get("sort") || "desc"
  const priorityParam = url.searchParams.get("priority") || "all"
  const ascending = sortParam === "asc"

  let query = supabase.from("tickets").select("*").in("user_id", sharedUserIds)

  if (statusParam === "all") {
    // no filter
  } else if (statusParam === "open_and_in_progress") {
    query = query.in("status", ["open", "in_progress"])
  } else {
    query = query.eq("status", statusParam)
  }

  if (priorityParam !== "all") {
    query = query.eq("priority", priorityParam)
  }

  query = query.order("created_at", { ascending })

  const { data: tickets, error: ticketsError } = await query
  if (ticketsError) {
    console.error("Error fetching tickets", ticketsError)
    return { tickets: [], userRole: role }
  }

  return {
    tickets,
    userRole: role,
    companyName,
    website,
    statusParam,
    sortParam,
    priorityParam,
  }
}

// Removed createTicket action from this file. That action is now in /tickets/new/+page.server.ts