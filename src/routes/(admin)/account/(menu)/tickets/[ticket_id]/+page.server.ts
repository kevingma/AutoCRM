import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

/**
 * Previously, this used `supabase` for queries, which could cause empty replies or ticket
 * data if RLS policies weren't set for all roles. Switching to `supabaseServiceRole`
 * ensures we can fetch the data and then enforce user-level checks in code.
 */
export const load: PageServerLoad = async ({
  params,
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Confirm user is part of the ticket's org or is the ticket owner
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw fail(500, { error: "Could not load profile" })
  }

  // gather sharedUserIds
  let sharedUserIds: string[] = []
  if (profile.role === "administrator") {
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(
        `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
      )
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
  } else if (profile.role === "employee") {
    if (profile.employee_approved) {
      const { data: relatedProfiles } = await supabaseServiceRole
        .from("profiles")
        .select("id")
        .or(
          `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
        )
      sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    } else {
      sharedUserIds = [user.id]
    }
  } else {
    // role customer
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(
        `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
      )
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    if (!sharedUserIds.includes(user.id)) {
      sharedUserIds.push(user.id)
    }
  }

  // fetch the ticket using serviceRole
  const { data: ticket, error: ticketError } = await supabaseServiceRole
    .from("tickets")
    .select("*")
    .eq("id", params.ticket_id)
    .in("user_id", sharedUserIds)
    .single()

  if (!ticket || ticketError) {
    throw redirect(303, "/account/tickets")
  }

  // fetch replies using serviceRole
  let repliesQuery = supabaseServiceRole
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true })

  if (profile.role === "administrator") {
    // show all
  } else if (profile.role === "employee" && !profile.employee_approved) {
    repliesQuery = repliesQuery.eq("is_internal", false)
  } else if (profile.role === "customer") {
    repliesQuery = repliesQuery.eq("is_internal", false)
  }

  const { data: replies, error: repliesError } = await repliesQuery
  if (repliesError) {
    console.error("Error fetching ticket replies", repliesError)
    throw fail(500, { error: "Unable to load replies." })
  }

  // NEW: if user is an administrator, fetch a list of employees to show in "Assign Ticket" dropdown
  let employeeOptions: { id: string; full_name: string }[] = []
  if (profile.role === "administrator") {
    const { data: employees } = await supabaseServiceRole
      .from("profiles")
      .select("id, full_name, role")
      .eq("employee_approved", true)
      .or(
        `company_name.eq.${profile.company_name},website.eq.${profile.website}`,
      )
    employeeOptions =
      (employees || [])
        .filter((e) => e.role === "employee" || e.role === "administrator")
        .map((e) => ({
          id: e.id,
          full_name: e.full_name || e.id,
        })) ?? []
  }

  return {
    ticket,
    replies,
    userRole: profile.role,
    isAssigned: !!ticket.assigned_to,
    isAssignedToMe: ticket.assigned_to === user.id,
    employeeOptions,
  }
}

export const actions: Actions = {
  addReply: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const formData = await request.formData()
    // Make sure we read the "reply_text" field that the svelte form is sending
    const replyText = formData.get("reply_text")?.toString() || ""
    const isInternal = formData.get("is_internal") === "true"

    if (!replyText || replyText.length < 2) {
      return fail(400, { errorMessage: "Reply text must be at least 2 chars" })
    }

    // Insert the reply
    const { error: insertError } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: params.ticket_id,
        user_id: user.id,
        reply_text: replyText,
        is_internal: isInternal,
      })

    if (insertError) {
      console.error("Error adding reply", insertError)
      return fail(500, { errorMessage: "Could not add reply" })
    }
    return { success: true }
  },

  updateTicket: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session } = await safeGetSession()
    if (!session) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const status = formData.get("status") as string
    const priority = formData.get("priority") as string
    const tagsRaw = formData.get("tags") as string
    const assignedTo = formData.get("assigned_to") as string | null

    let tags = null
    if (tagsRaw) {
      tags = tagsRaw.split(",").map((t) => t.trim())
    }

    // build update
    const fieldsToUpdate: Record<string, unknown> = {}
    if (status !== undefined) fieldsToUpdate.status = status
    if (priority !== undefined) fieldsToUpdate.priority = priority
    if (tags !== undefined) fieldsToUpdate.tags = tags
    if (assignedTo) fieldsToUpdate.assigned_to = assignedTo

    const { error } = await supabase
      .from("tickets")
      .update(fieldsToUpdate)
      .eq("id", params.ticket_id)

    if (error) {
      console.error("Error updating ticket", error)
      return fail(500, { errorMessage: "Could not update ticket" })
    }
    return { success: true }
  },

  addFeedback: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id, user_id, status")
      .eq("id", params.ticket_id)
      .single()

    if (!existingTicket || existingTicket.user_id !== user.id) {
      return fail(403, { errorMessage: "Not authorized to leave feedback" })
    }

    if (existingTicket.status !== "closed") {
      return fail(400, {
        errorMessage: "You can only leave feedback once the ticket is closed.",
      })
    }

    const formData = await request.formData()
    const ratingStr = formData.get("rating") as string
    const comment = formData.get("comment") as string | null
    const rating = parseInt(ratingStr, 10)

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return fail(400, {
        errorMessage: "Rating must be an integer between 1 and 5",
      })
    }

    const { error: insertFeedbackError } = await supabase
      .from("ticket_feedback")
      .insert({
        ticket_id: existingTicket.id,
        user_id: user.id,
        rating,
        comment: comment || null,
      })

    if (insertFeedbackError) {
      console.error("Error adding feedback", insertFeedbackError)
      return fail(500, { errorMessage: "Could not add feedback" })
    }

    return { success: true }
  },

  claimTicket: async ({ locals: { supabase, safeGetSession }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Confirm user is employee or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, employee_approved")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return fail(403, { errorMessage: "Not authorized" })
    }
    if (
      profile.role !== "administrator" &&
      (profile.role !== "employee" || !profile.employee_approved)
    ) {
      return fail(403, { errorMessage: "Not authorized" })
    }

    // fetch the ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, assigned_to, status")
      .eq("id", params.ticket_id)
      .single()

    if (!ticket) {
      return fail(404, { errorMessage: "Ticket not found" })
    }

    if (ticket.assigned_to) {
      return fail(400, { errorMessage: "Ticket is already assigned" })
    }

    const { error: updateErr } = await supabase
      .from("tickets")
      .update({ assigned_to: user.id, status: "in_progress" })
      .eq("id", params.ticket_id)

    if (updateErr) {
      console.error("Error claiming ticket", updateErr)
      return fail(500, { errorMessage: "Could not claim ticket" })
    }

    return { success: true }
  },
}
