import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()
  if (profileError || !profile) {
    console.error("Error fetching profile or missing", profileError)
    throw fail(500, { message: "Unable to load your profile." })
  }

  // same logic as existing code to gather sharedUserIds
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
      .or(`company_name.eq.${profile.company_name},website.eq.${profile.website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    if (!sharedUserIds.includes(user.id)) {
      sharedUserIds.push(user.id)
    }
  }

  // fetch the ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", params.ticket_id)
    .in("user_id", sharedUserIds)
    .single()

  if (!ticket || ticketError) {
    throw redirect(303, "/account/tickets")
  }

  // fetch replies (existing logic)
  let repliesQuery = supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true })

  if (profile.role === "administrator") {
    // show all including internal
  } else if (profile.role === "employee" && !profile.employee_approved) {
    repliesQuery = repliesQuery.eq("is_internal", false)
  } else if (profile.role === "customer") {
    repliesQuery = repliesQuery.eq("is_internal", false)
  }

  const { data: replies, error: repliesError } = await repliesQuery

  if (repliesError) {
    console.error("Error fetching ticket replies", repliesError)
    throw fail(500, { message: "Unable to load replies." })
  }

  return {
    ticket,
    replies,
    userRole: profile.role,
  }
}

export const actions: Actions = {
  addReply: async ({ request, locals: { supabase, safeGetSession }, params }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const replyText = formData.get("reply_text") as string
    const isInternal = formData.get("is_internal") === "true"

    if (!replyText || replyText.length < 2) {
      return fail(400, { errorMessage: "Reply text must be at least 2 chars" })
    }

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

  updateTicket: async ({ request, locals: { supabase, safeGetSession }, params }) => {
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
    if (assignedTo) fieldsToUpdate.assigned_to = assignedTo  // new field

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

  // ADDED: let the customer leave feedback for the ticket, if closed
  addFeedback: async ({
    request,
    locals: { supabase, safeGetSession },
    params,
  }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // 1) check that the user is the ticket owner or it’s within same company 
    //    (but typically only the user who created the ticket can give feedback)
    //    We'll do a simpler check that user is the ticket's user_id.
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id, user_id, status")
      .eq("id", params.ticket_id)
      .single()

    if (!existingTicket || existingTicket.user_id !== user.id) {
      return fail(403, { errorMessage: "Not authorized to leave feedback" })
    }

    // optionally confirm the ticket is closed
    if (existingTicket.status !== "closed") {
      return fail(400, { errorMessage: "You can only leave feedback once the ticket is closed." })
    }

    const formData = await request.formData()
    const ratingStr = formData.get("rating") as string
    const comment = formData.get("comment") as string | null
    const rating = parseInt(ratingStr, 10)

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return fail(400, { errorMessage: "Rating must be an integer between 1 and 5" })
    }

    // 2) Insert feedback
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
}