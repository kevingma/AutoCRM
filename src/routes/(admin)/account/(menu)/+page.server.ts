import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

/**
 * Existing signout action remains below.
 * We are adding a new `load` function to handle dashboard data for employees.
 */

export const load: PageServerLoad = async ({
  locals: { supabase, safeGetSession }
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Fetch the user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    // No role info => fallback
    return {
      userRole: "",
      stats: {
        activeTicketsCount: 0,
        ticketsResolvedTodayCount: 0
      },
      recentTickets: []
    }
  }

  const userRole = profile.role
  if (userRole !== "employee" && userRole !== "administrator") {
    return {
      userRole,
      stats: {
        activeTicketsCount: 0,
        ticketsResolvedTodayCount: 0
      },
      recentTickets: []
    }
  }

  const { data: userTicketsReplyIds } = await supabase
    .from("ticket_replies")
    .select("ticket_id")
    .eq("user_id", user.id)

  const distinctTicketIds = [...new Set((userTicketsReplyIds || []).map((x) => x.ticket_id))]

  const { data: activeTickets } = await supabase
    .from("tickets")
    .select("id")
    .in("id", distinctTicketIds.length ? distinctTicketIds : ["-dummy-"])
    .in("status", ["open", "in_progress"])

  const activeTicketsCount = activeTickets?.length || 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isoMidnight = today.toISOString()

  const { data: repliesToday } = await supabase
    .from("ticket_replies")
    .select("ticket_id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", isoMidnight)

  const distinctTicketIdsToday = [...new Set((repliesToday || []).map((r) => r.ticket_id))]

  const { data: closedTicketsToday } = await supabase
    .from("tickets")
    .select("id")
    .in("id", distinctTicketIdsToday.length ? distinctTicketIdsToday : ["-dummy-"])
    .eq("status", "closed")

  const ticketsResolvedTodayCount = closedTicketsToday?.length || 0

  const { data: recentReplies } = await supabase
    .from("ticket_replies")
    .select("ticket_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const usedTicketIds: string[] = []
  const top5TicketIds: string[] = []
  for (const r of recentReplies || []) {
    if (!usedTicketIds.includes(r.ticket_id)) {
      usedTicketIds.push(r.ticket_id)
      if (top5TicketIds.length < 5) {
        top5TicketIds.push(r.ticket_id)
      }
    }
  }

  const { data: recentTicketsData } = await supabase
    .from("tickets")
    .select("id, title, status, created_at")
    .in("id", top5TicketIds.length ? top5TicketIds : ["-dummy-"])

  const recentTicketsMap = new Map<
    string,
    { id: string; title: string; status: string; created_at: string | null }
  >()
  recentTicketsData?.forEach((t) => {
    recentTicketsMap.set(t.id, t)
  })

  const recentTickets = top5TicketIds
    .map((id) => recentTicketsMap.get(id))
    .filter(Boolean)

  return {
    userRole,
    stats: {
      activeTicketsCount,
      ticketsResolvedTodayCount
    },
    recentTickets
  }
}