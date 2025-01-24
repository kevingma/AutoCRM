import { redirect } from "@sveltejs/kit"
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

  // Existing filter parameters
  const statusParam = url.searchParams.get("status") || "open"
  const sortParam = url.searchParams.get("sort") || "desc"
  const priorityParam = url.searchParams.get("priority") || "all"
  const ascending = sortParam === "asc"

  // NEW: Search parameter
  const searchParam = url.searchParams.get("search") || ""

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

  // Updated search logic to handle OR with cast to text for tags
  if (searchParam) {
    const likePattern = `%${searchParam}%`
    query = query.or(
      `title.ilike.${likePattern},description.ilike.${likePattern},tags::text.ilike.${likePattern}`
    )
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
    searchParam, // expose search param to the front-end
  }
}
