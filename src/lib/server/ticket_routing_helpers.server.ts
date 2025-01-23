import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../../DatabaseDefinitions"

/**
 * Auto-assign a newly created ticket based on rules:
 *  - Rule-based matching (focus area, priority, or custom logic).
 *  - Skills-based matching (if tags or priority implies a skill).
 *  - Load balancing among qualified agents.
 */
export async function autoAssignTicketIfNeeded(
  ticketId: string,
  supabaseServiceRole: SupabaseClient<Database>,
) {
  // 1) Load ticket info
  const { data: ticket, error: ticketError } = await supabaseServiceRole
    .from("tickets")
    .select("id, title, description, priority, tags, assigned_to")
    .eq("id", ticketId)
    .single()

  if (ticketError || !ticket) {
    console.error("Routing: No such ticket or error retrieving", ticketError)
    return
  }

  // If already assigned, skip
  if (ticket.assigned_to) {
    return
  }

  // 2) Identify a relevant team based on focus_area / priority / tags
  // For demonstration: if priority=high => route to a "Priority" focus_area team
  // If tags includes 'billing' => route to a team that has focus_area='billing'
  let selectedTeamId: string | null = null

  // Example simple check:
  if (ticket.priority && ticket.priority.toLowerCase() === "high") {
    // find a "priority" team
    selectedTeamId = await findTeamByFocusArea("priority", supabaseServiceRole)
  } else if (ticket.tags && ticket.tags.includes("billing")) {
    selectedTeamId = await findTeamByFocusArea("billing", supabaseServiceRole)
  }

  // If no specific rule matched, pick a "general" team:
  if (!selectedTeamId) {
    selectedTeamId = await findTeamByFocusArea("general", supabaseServiceRole)
  }

  // 3) Within that team, find all agents with relevant skills (if the ticket has tags).
  // If the ticket has a "java" tag, we want an agent with skill "java".
  // For brevity, we skip advanced logic if no tag-based skill.
  let requiredSkillId: string | null = null
  if (ticket.tags && ticket.tags.length > 0) {
    // just check the first tag for skill
    requiredSkillId = await findSkillByName(ticket.tags[0], supabaseServiceRole)
  }

  // 4) Among possible team members, apply coverage hours check & load balancing
  const bestAgent = await pickAgentInTeam(
    selectedTeamId,
    requiredSkillId,
    supabaseServiceRole,
  )

  if (!bestAgent) {
    console.warn("Routing: No available agent found for ticket", ticketId)
    return
  }

  // 5) Assign the ticket
  const { error: assignError } = await supabaseServiceRole
    .from("tickets")
    .update({ assigned_to: bestAgent })
    .eq("id", ticketId)

  if (assignError) {
    console.error("Routing: Failed to assign ticket", assignError)
  }
}

/**
 * Find a team by its focus_area, or return null if none found.
 */
async function findTeamByFocusArea(
  focusArea: string,
  supabaseServiceRole: SupabaseClient<Database>,
): Promise<string | null> {
  const { data: teams, error } = await supabaseServiceRole
    .from("teams")
    .select("id")
    .ilike("focus_area", focusArea)
    .limit(1)
  if (error || !teams || teams.length === 0) {
    return null
  }
  return teams[0].id
}

/**
 * Find a skill by name (case-insensitive).
 */
async function findSkillByName(
  skillName: string,
  supabaseServiceRole: SupabaseClient<Database>,
): Promise<string | null> {
  const { data: skills, error } = await supabaseServiceRole
    .from("skills")
    .select("id, skill_name")
    .ilike("skill_name", skillName)
    .limit(1)
  if (error || !skills || skills.length === 0) {
    return null
  }
  return skills[0].id
}

/**
 * Pick an agent from the team that meets coverage hours,
 * has the required skill (if any), and has the fewest assigned open tickets.
 */
async function pickAgentInTeam(
  teamId: string | null,
  requiredSkillId: string | null,
  supabaseServiceRole: SupabaseClient<Database>,
): Promise<string | null> {
  if (!teamId) return null

  // 1) Find team members
  const { data: members, error: memberErr } = await supabaseServiceRole
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)

  if (memberErr || !members || members.length === 0) {
    return null
  }
  const userIds = members.map((m) => m.user_id)

  // 2) If a skill is required, filter out those who lack it
  let filteredUsers = userIds
  if (requiredSkillId) {
    // get all user_ids that have the skill
    const { data: skillRows } = await supabaseServiceRole
      .from("employee_skills")
      .select("user_id")
      .eq("skill_id", requiredSkillId)
      .in("user_id", userIds)

    if (!skillRows || skillRows.length === 0) {
      // no one has the skill
      return null
    }
    const skilledIds = skillRows.map((s) => s.user_id)
    filteredUsers = userIds.filter((u) => skilledIds.includes(u))
  }

  if (filteredUsers.length === 0) {
    return null
  }

  // 3) Check coverage hours if desired (optional).
  // This example checks if current UTC hour is within coverage_start_time_utc -> coverage_end_time_utc
  const { data: teamInfo } = await supabaseServiceRole
    .from("teams")
    .select("coverage_start_time_utc, coverage_end_time_utc")
    .eq("id", teamId)
    .single()

  if (teamInfo) {
    const nowHour = new Date().getUTCHours()
    const start = teamInfo.coverage_start_time_utc ?? 0
    const end = teamInfo.coverage_end_time_utc ?? 23
    if (nowHour < start || nowHour >= end) {
      // no coverage now => return null or allow partial assignment
      // For demonstration, we'll allow assignment anyway. Or we can return null.
      // return null
    }
  }

  // 4) Load-balance: pick agent with fewest open tickets
  // We query tickets assigned to each user in "filteredUsers" that are open or in_progress
  let bestUser: string | null = null
  let bestCount = Number.MAX_SAFE_INTEGER

  for (const u of filteredUsers) {
    const { data: openTix } = await supabaseServiceRole
      .from("tickets")
      .select("id")
      .eq("assigned_to", u)
      .in("status", ["open", "in_progress"])

    const count = openTix?.length ?? 0
    if (count < bestCount) {
      bestCount = count
      bestUser = u
    }
  }

  return bestUser
}
