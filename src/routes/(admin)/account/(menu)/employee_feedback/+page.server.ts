import { redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

/**
 * If the user is an EMPLOYEE -> shows all feedback for tickets assigned to them.
 * If the user is ADMIN + query param `?employeeId=...`, show that user's assigned tickets feedback.
 * If the user is ADMIN with no param, show feedback for all employees in same company.
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

  // only employees or admins can see this page
  if (myProfile.role !== "employee" && myProfile.role !== "administrator") {
    throw redirect(303, "/account")
  }

  const employeeIdParam = url.searchParams.get("employeeId")

  // if admin and employeeId is given, show that user's feedback
  // if admin and no employeeId, show all assigned in the same company
  // if employee, show only those assigned to yourself
  let targetUserId = user.id
  if (myProfile.role === "administrator") {
    if (employeeIdParam) {
      targetUserId = employeeIdParam
    } else {
      // we'll handle "all employees in same company" by returning a special placeholder
      // then queries can find them
      targetUserId = ""
    }
  }

  // find all feedback rows for tickets assigned to `targetUserId`
  // (or assigned to any user in same company, if targetUserId = "")
  let assignedIds: string[] = []

  if (targetUserId) {
    // check if the target user is truly in the same company
    const { data: tProfile, error: tProfErr } = await supabaseServiceRole
      .from("profiles")
      .select("id, role, company_name, website")
      .eq("id", targetUserId)
      .single()

    if (tProfErr || !tProfile) {
      // no such user => return empty
      return { feedback: [], role: myProfile.role }
    }
    if (
      tProfile.company_name !== myProfile.company_name &&
      tProfile.website !== myProfile.website
    ) {
      // not in same org => no results
      return { feedback: [], role: myProfile.role }
    }

    // fetch all tickets assigned to that user
    const { data: assignedTickets } = await supabaseServiceRole
      .from("tickets")
      .select("id")
      .eq("assigned_to", targetUserId)
    assignedIds = assignedTickets?.map((t) => t.id) ?? []
  } else {
    // admin wants all employees in same company
    // first find all employees in same company
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

    // fetch all tickets assigned to those employees
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

  // optional: join with tickets to get title
  const ticketMap = new Map<string, { title: string; status: string }>()
  const { data: relevantTickets } = await supabaseServiceRole
    .from("tickets")
    .select("id, title, status")
    .in("id", assignedIds)

  relevantTickets?.forEach((t) => {
    ticketMap.set(t.id, { title: t.title, status: t.status })
  })

  // build a shaped array
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
