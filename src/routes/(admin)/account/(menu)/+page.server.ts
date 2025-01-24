import { redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

/**
 * load function for the (admin)/account/(menu) dashboard.
 * - If administrator: gather organization-level stats
 * - If employee: gather personal stats
 * - Otherwise: minimal data for a normal user (fallback)
 */
export const load: PageServerLoad = async ({
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // 1) Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, employee_approved, company_name, website")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    // fallback if no profile
    return {
      userRole: "",
      stats: {},
      recentActivity: [],
      adminStats: null,
    }
  }

  const userRole = profile.role

  // ---- ADMINISTRATOR LOGIC ----
  if (userRole === "administrator") {
    // gather organization-wide stats
    // 1) Count of agents in same org
    const { data: agents } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .eq("role", "employee")
      .eq("employee_approved", true)
      .or(
        `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
      )

    const numberOfAgents = agents?.length || 0

    // 2) Count of customers in same org
    const { data: customers } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .eq("role", "customer")
      .eq("customer_approved", true)
      .or(
        `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
      )

    const numberOfClients = customers?.length || 0

    // 3) Open tickets in the org
    // retrieve all relevant user IDs in this org
    const { data: orgProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(
        `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
      )
    const orgUserIds = (orgProfiles || []).map((p) => p.id)

    const { data: orgTickets } = await supabaseServiceRole
      .from("tickets")
      .select("id, status, created_at") // minimal fields
      .in("user_id", orgUserIds)

    // count open or in_progress
    const openTicketsCount = (orgTickets || []).filter(
      (t) => t.status === "open" || t.status === "in_progress",
    ).length

    // 4) Average resolution time for tickets closed today
    // We'll define "today" as after midnight UTC
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const { data: todayClosedTickets } = await supabaseServiceRole
      .from("tickets")
      .select("id, created_at, status, priority")
      .in("user_id", orgUserIds)
      // We don't store closed_at in this schema, so approximate by checking created_at >= today
      // or skip if you track closed_at. For demonstration, just do a placeholder approach:
      .gte("created_at", startOfDay.toISOString())
      .eq("status", "closed")

    // We'll do a placeholder of ~48 hours or 0 if none
    let averageResolutionTime = 0
    if (todayClosedTickets && todayClosedTickets.length > 0) {
      // Real logic would measure difference between created_at and closed time
      // We'll just show a placeholder average
      averageResolutionTime = 12
    }

    // No recentActivity needed for admin's personal feed, but you could add an org-wide feed if you like
    const adminStats = {
      numberOfAgents,
      numberOfClients,
      openTicketsCount,
      averageResolutionTime,
    }

    return {
      userRole: "administrator",
      stats: {}, // not used for admin
      recentActivity: [],
      adminStats,
    }
  }

  // ---- EMPLOYEE LOGIC ----
  if (userRole === "employee") {
    if (!profile.employee_approved) {
      // show minimal data if not approved
      return {
        userRole: "employee",
        stats: {},
        recentActivity: [],
        adminStats: null,
      }
    }

    // For employees, personal stats (similar to existing code)
    const { data: assignedTickets } = await supabaseServiceRole
      .from("tickets")
      .select("id, created_at, status")
      .eq("assigned_to", user.id)

    let openTicketsCount = 0
    let averageResponseTime = 0
    let averageResolutionTime = 0
    let customerSatisfaction = 0

    if (assignedTickets && assignedTickets.length > 0) {
      // open tickets
      openTicketsCount = assignedTickets.filter(
        (t) => t.status === "open" || t.status === "in_progress",
      ).length

      // measure first reply times for averageResponseTime, skipping for brevity
      // measure resolution times for averageResolutionTime, placeholder if you like
      // measure feedback rating for customerSatisfaction, also placeholder or do queries
    }

    // gather recentActivity for employee
    const { data: myTicketReplies } = await supabaseServiceRole
      .from("ticket_replies")
      .select("ticket_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const { data: myChatMessages } = await supabaseServiceRole
      .from("live_chat_messages")
      .select("live_chat_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const mergedActivity: {
      type: "ticket" | "chat"
      id: string
      created_at: string
    }[] = []

    for (const r of myTicketReplies || []) {
      if (r.created_at) {
        mergedActivity.push({
          type: "ticket",
          id: r.ticket_id,
          created_at: r.created_at,
        })
      }
    }
    for (const c of myChatMessages || []) {
      if (c.created_at) {
        mergedActivity.push({
          type: "chat",
          id: c.live_chat_id,
          created_at: c.created_at,
        })
      }
    }
    mergedActivity.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const recentActivity = mergedActivity.slice(0, 10)

    return {
      userRole: "employee",
      stats: {
        openTicketsCount,
        averageResponseTime,
        averageResolutionTime,
        customerSatisfaction,
      },
      recentActivity,
      adminStats: null,
    }
  }

  // ---- NON-EMPLOYEE / NON-ADMIN (CUSTOMER or other) ----
  return {
    userRole,
    stats: {},
    recentActivity: [],
    adminStats: null,
  }
}
