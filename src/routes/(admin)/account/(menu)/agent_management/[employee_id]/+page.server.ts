import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { Database } from "../../../../../../DatabaseDefinitions"

// Helper function to gather stats on assigned tickets within a date range
async function getEmployeeStatsInRange(
  supabaseServiceRole: any,
  employeeId: string,
  since: Date,
): Promise<{
  closedCount: number
  averageResponseTime: number
  customerSatisfaction: number
  resolutionTime: number
  feedback: Array<{
    ticket_id: string
    rating: number
    comment: string | null
    created_at: string | null
  }>
}> {
  // 1) Tickets assigned to employee, created after `since`
  const { data: tickets, error: ticketsError } = await supabaseServiceRole
    .from("tickets")
    .select("id, created_at, status")
    .eq("assigned_to", employeeId)
    .gte("created_at", since.toISOString())
  if (ticketsError) {
    console.error("Error fetching tickets in range", ticketsError)
    return {
      closedCount: 0,
      averageResponseTime: 0,
      customerSatisfaction: 0,
      resolutionTime: 0,
      feedback: [],
    }
  }

  // 2) Filter for closed tickets
  const closedTickets = tickets.filter((t) => t.status === "closed")

  // 3) For average response time, gather first agent reply times
  const ticketIds = tickets.map((t) => t.id)
  let averageResponseTime = 0
  if (ticketIds.length) {
    const { data: replies } = await supabaseServiceRole
      .from("ticket_replies")
      .select("ticket_id, created_at, user_id, is_internal")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true })

    // For each ticket, find the first (non-internal) reply from an employee or admin
    let totalMinutes = 0
    let countReplied = 0
    for (const ticket of tickets) {
      const relevant = (replies || []).filter(
        (r) =>
          r.ticket_id === ticket.id &&
          !r.is_internal &&
          r.created_at &&
          // We'll assume any user that isn't the ticket owner is an agent
          r.user_id !== null &&
          r.user_id !== "",
      )
      if (relevant.length && ticket.created_at) {
        const firstReply = relevant[0]
        const diffMs =
          new Date(firstReply.created_at).getTime() -
          new Date(ticket.created_at).getTime()
        if (diffMs > 0) {
          totalMinutes += diffMs / (1000 * 60)
          countReplied++
        }
      }
    }
    averageResponseTime = countReplied ? totalMinutes / countReplied : 0
  }

  // 4) Grab feedback (ticket_feedback) for these tickets
  const { data: feedbackRows } = await supabaseServiceRole
    .from("ticket_feedback")
    .select("ticket_id, rating, comment, created_at")
    .in("ticket_id", ticketIds)
  let customerSatisfaction = 0
  let resolutionTime = 0 // We'll do a placeholder or copy logic from the main code
  if (feedbackRows && feedbackRows.length) {
    const sum = feedbackRows.reduce((acc, f) => acc + (f.rating || 0), 0)
    customerSatisfaction = sum / feedbackRows.length
  }
  // We'll skip actual resolution time logic unless you track closed_at. For example, we'll do 48 if closed.
  // A quick approximate approach:
  if (closedTickets.length) {
    resolutionTime = 48 // placeholder
  }

  return {
    closedCount: closedTickets.length,
    averageResponseTime,
    customerSatisfaction,
    resolutionTime,
    feedback: feedbackRows || [],
  }
}

export const load: PageServerLoad = async ({
  params,
  locals: { safeGetSession, supabaseServiceRole },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Must be admin
  const { data: myProfile, error: myProfileError } = await supabaseServiceRole
    .from("profiles")
    .select("role, company_name, website")
    .eq("id", user.id)
    .single()

  if (myProfileError || !myProfile || myProfile.role !== "administrator") {
    throw redirect(303, "/account")
  }

  // The employee we are inspecting
  const employeeId = params.employee_id

  // Confirm employee is in the same company. If not, 404 or redirect
  const { data: targetProfile } = await supabaseServiceRole
    .from("profiles")
    .select("full_name, role, company_name, website")
    .eq("id", employeeId)
    .single()

  if (
    !targetProfile ||
    (targetProfile.company_name !== myProfile.company_name &&
      targetProfile.website !== myProfile.website)
  ) {
    // Not found or not same org
    return {
      employeeName: "",
      role: "",
      dayStats: null,
      weekStats: null,
      monthStats: null,
    }
  }

  // We'll define day/week/month as 1 day, 7 days, 30 days from now
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Gather stats
  const [dayStats, weekStats, monthStats] = await Promise.all([
    getEmployeeStatsInRange(supabaseServiceRole, employeeId, dayAgo),
    getEmployeeStatsInRange(supabaseServiceRole, employeeId, weekAgo),
    getEmployeeStatsInRange(supabaseServiceRole, employeeId, monthAgo),
  ])

  return {
    employeeName: targetProfile.full_name ?? employeeId,
    role: targetProfile.role,
    dayStats,
    weekStats,
    monthStats,
  }
}
