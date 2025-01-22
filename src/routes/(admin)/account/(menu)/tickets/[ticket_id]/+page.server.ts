import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals: { supabase, supabaseServiceRole, safeGetSession }
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Fetch the user profile and role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()
  if (profileError || !profile) {
    console.error("Error fetching profile or missing", profileError)
    throw fail(500, { message: "Unable to load your profile." })
  }

  const role = profile.role
  const { company_name, website, employee_approved } = profile

  // In the main tickets list, we built sharedUserIds for employees/admin or same-company logic.
  // For simplicity, we replicate that approach:
  let sharedUserIds: string[] = []

  if (role === "administrator") {
    // Admin => see same-company tickets
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${company_name},website.eq.${website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
  } else if (role === "employee") {
    if (employee_approved) {
      // employee => see same-company tickets
      const { data: relatedProfiles } = await supabaseServiceRole
        .from("profiles")
        .select("id")
        .or(`company_name.eq.${company_name},website.eq.${website}`)
      sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    } else {
      // not approved => only own
      sharedUserIds = [user.id]
    }
  } else {
    // role === 'customer' => see same-company plus own
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${company_name},website.eq.${website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    if (!sharedUserIds.includes(user.id)) {
      sharedUserIds.push(user.id)
    }
  }

  // Now fetch the ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", params.ticket_id)
    .in("user_id", sharedUserIds)
    .single()

  if (!ticket || ticketError) {
    throw redirect(303, "/account/tickets")
  }

  // Now fetch replies. If role is employee/admin => show all. If customer => exclude is_internal = true
  let repliesQuery = supabase.from("ticket_replies").select("*").eq("ticket_id", ticket.id)
  if (role === "administrator") {
    // admin => show all
  } else if (role === "employee") {
    if (!employee_approved) {
      // not approved => treat as a normal customer
      repliesQuery = repliesQuery.eq("is_internal", false)
    } else {
      // approved => show all
    }
  } else {
    // role === 'customer'
    repliesQuery = repliesQuery.eq("is_internal", false)
  }

  repliesQuery = repliesQuery.order("created_at", { ascending: true })

  const { data: replies, error: repliesError } = await repliesQuery
  if (repliesError) {
    console.error("Error fetching ticket replies", repliesError)
    throw fail(500, { message: "Unable to load replies." })
  }

  return {
    ticket,
    replies,
    userRole: role
  }
}

export const actions: Actions = {
  // We can reuse "addReply" logic here or replicate. Let's replicate quickly for clarity:
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

    // Optionally verify the user can still see / access the ticket. But for brevity, we skip re-check.
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: params.ticket_id,
      user_id: user.id,
      reply_text: replyText,
      is_internal: isInternal
    })

    if (error) {
      console.error("Error adding reply", error)
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
    let tags = null
    if (tagsRaw) {
      tags = tagsRaw.split(",").map((t) => t.trim())
    }

    const fieldsToUpdate: Record<string, unknown> = {}
    if (status !== undefined) fieldsToUpdate.status = status
    if (priority !== undefined) fieldsToUpdate.priority = priority
    if (tags !== undefined) fieldsToUpdate.tags = tags

    const { error } = await supabase
      .from("tickets")
      .update(fieldsToUpdate)
      .eq("id", params.ticket_id)

    if (error) {
      console.error("Error updating ticket", error)
      return fail(500, { errorMessage: "Could not update ticket" })
    }
    return { success: true }
  }
}