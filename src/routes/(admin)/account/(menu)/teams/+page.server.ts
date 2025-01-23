import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import type { Database } from "../../../../../DatabaseDefinitions"

export const load: PageServerLoad = async ({
  locals: { safeGetSession, supabaseServiceRole },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Require admin role
  const { data: profile } = await supabaseServiceRole
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "administrator") {
    throw redirect(303, "/account")
  }

  // Fetch all teams
  const { data: allTeams, error: teamsError } = await supabaseServiceRole
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false })

  return {
    teams: allTeams ?? [],
  }
}

export const actions: Actions = {
  createTeam: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // check admin
    const { data: profile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (!profile || profile.role !== "administrator") {
      return fail(403, { error: "Only admins can create teams." })
    }

    const formData = await request.formData()
    const name = formData.get("teamName")?.toString().trim() || ""
    const focusArea = formData.get("focusArea")?.toString().trim() || "general"
    const coverageStart = parseInt(
      formData.get("coverageStart")?.toString() || "0",
      10,
    )
    const coverageEnd = parseInt(
      formData.get("coverageEnd")?.toString() || "23",
      10,
    )

    if (!name || name.length < 2) {
      return fail(400, { error: "Team name too short" })
    }

    const { error: insertErr } = await supabaseServiceRole
      .from("teams")
      .insert({
        name,
        focus_area: focusArea,
        coverage_start_time_utc: coverageStart,
        coverage_end_time_utc: coverageEnd,
      })

    if (insertErr) {
      console.error("Error creating team:", insertErr)
      return fail(500, { error: "Failed to create team" })
    }

    return { success: true }
  },
  deleteTeam: async ({
    request,
    locals: { safeGetSession, supabaseServiceRole },
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const { data: profile } = await supabaseServiceRole
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (!profile || profile.role !== "administrator") {
      return fail(403, { error: "Only admins can delete teams." })
    }

    const formData = await request.formData()
    const teamId = formData.get("teamId")?.toString()

    if (!teamId) {
      return fail(400, { error: "Missing team id" })
    }

    const { error: deleteErr } = await supabaseServiceRole
      .from("teams")
      .delete()
      .eq("id", teamId)

    if (deleteErr) {
      console.error("Error deleting team:", deleteErr)
      return fail(500, { error: "Failed to delete team" })
    }

    return { success: true }
  },
}
