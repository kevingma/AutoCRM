import { redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

/**
 * If the user is EMPLOYEE -> shows feedback for tickets assigned to them only.
 * If the user is ADMIN + optional `?employeeId=...`, show that user's or all employees' feedback.
 */
export const load: PageServerLoad = async ({
  url,
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // get profile
  const { data: myProfile, error: myProfileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()

  if (myProfileError || !myProfile) {
    console.error("Profile fetch error", myProfileError)
    throw fail(500, { errorMessage: "Could not load profile" })
  }

  // Only employees or admins can see this page
  if (myProfile.role !== "employee" && myProfile.role !== "administrator") {
    throw redirect(303, "/account")
  }

  // If employee, ignore any ?employeeId and show only their own assigned tickets
  let targetUserId = user.id

  if (myProfile.role === "administrator") {
    // Admin can optionally filter by employee
    const employeeIdParam = url.searchParams.get("employeeId")
    if (employeeIdParam) {
      targetUserId = employeeIdParam
    } else {
      // If no param, means "all employees in same company"
      targetUserId = ""
    }
  }

  // If targetUserId is empty => gather all tickets assigned to any employees in same org
  // Otherwise => gather tickets assigned to `targetUserId`
  let assignedIds: string[] = []

  if (targetUserId) {
    // confirm this user is in same company (or it's themselves)
    if (targetUserId !== user.id) {
      // admin is looking up a particular employee
      const { data: tProfile, error: tProfErr } = await supabaseServiceRole
        .from("profiles")
        .select("id, role, company_name, website")
        .eq("id", targetUserId)
        .single()

      // if missing or not same company => no results
      if (tProfErr || !tProfile) {
        return { feedback: [], role: myProfile.role }
      }
      if (
        tProfile.company_name !== myProfile.company_name &&
        tProfile.website !== myProfile.website
      ) {
        return { feedback: [], role: myProfile.role }
      }
    }
    // fetch tickets assigned to targetUserId
    const { data: assignedTickets } = await supabaseServiceRole
      .from("tickets")
      .select("id")
      .eq("assigned_to", targetUserId)
    assignedIds = assignedTickets?.map((t) => t.id) ?? []
  } else {
    // admin wants all employees in same company
    const { data: employees } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .eq("role", "employee")
      .or(
        `company_name.eq.${myProfile.company_name},website.eq.${myProfile.website}`,
      )
    const employeeIds = employees?.map((e) => e.id) ?? []
    if (employeeIds.length === 0) {
      return { feedback: [], role: myProfile.role }
    }

    const { data: assignedTickets } = await supabaseServiceRole
      .from("tickets")
      .select("id, assigned_to")
      .in("assigned_to", employeeIds)
    assignedIds = assignedTickets?.map((t) => t.id) ?? []
  }

  if (assignedIds.length === 0) {
    return { feedback: [], role: myProfile.role }
  }

  // fetch feedback for those tickets
  const { data: feedbackRows, error: fbErr } = await supabaseServiceRole
    .from("ticket_feedback")
    .select("id, ticket_id, user_id, rating, comment, created_at")
    .in("ticket_id", assignedIds)
    .order("created_at", { ascending: false })

  if (fbErr || !feedbackRows) {
    console.error("Error fetching feedback", fbErr)
    return { feedback: [], role: myProfile.role }
  }

  // gather ticket titles
  const { data: relevantTickets } = await supabaseServiceRole
    .from("tickets")
    .select("id, title, status")
    .in("id", assignedIds)

  const ticketMap = new Map<string, { title: string; status: string }>()
  relevantTickets?.forEach((t) => {
    ticketMap.set(t.id, { title: t.title, status: t.status })
  })

  const feedback = feedbackRows.map((fb) => ({
    id: fb.id,
    ticket_id: fb.ticket_id,
    user_id: fb.user_id,
    rating: fb.rating,
    comment: fb.comment,
    created_at: fb.created_at,
    ticket_title: ticketMap.get(fb.ticket_id)?.title || "",
    ticket_status: ticketMap.get(fb.ticket_id)?.status || "",
  }))

  return {
    feedback,
    role: myProfile.role,
  }
}

export const actions: Actions = {}