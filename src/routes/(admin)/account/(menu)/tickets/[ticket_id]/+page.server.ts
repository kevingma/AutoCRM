import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  const ticketId = params.ticket_id

  // Fetch the ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single()

  if (ticketError || !ticket) {
    return { ticket: null, replies: [], canReply: false }
  }

  // fetch user's profile (role, employee_approved, company, etc.)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, employee_approved, company_name, website")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return { ticket: null, replies: [], canReply: false }
  }

  // fetch all replies
  const { data: replies } = await supabase
    .from("ticket_replies")
    .select("*, user_id")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  // check if user can reply
  // - a 'customer' can reply if ticket belongs to them or same company/website
  // - an 'employee' can reply if approved and belongs to same company/website
  // - an 'administrator' can also reply if same company/website
  // We'll reuse the logic from the main tickets approach. But for simplicity:
  let canReply = false

  // fetch the ticket owner's profile to see if it matches
  const { data: ticketOwner } = await supabase
    .from("profiles")
    .select("company_name, website")
    .eq("id", ticket.user_id)
    .single()

  if (!ticketOwner) {
    // fallback
    return { ticket, replies: replies ?? [], canReply: false }
  }

  // same co or website?
  const sameCoOrSite =
    ticketOwner.company_name === profile.company_name ||
    ticketOwner.website === profile.website

  if (profile.role === "customer") {
    // allow if sameCoOrSite
    canReply = sameCoOrSite
  } else if (profile.role === "employee") {
    // must be approved, sameCoOrSite
    canReply = (profile.employee_approved && sameCoOrSite) ? true : false
  } else if (profile.role === "administrator") {
    // must be same co or site
    canReply = sameCoOrSite
  }

  // Optionally also allow the original ticket user to reply even if something is mismatch
  // but the main condition above covers it since the user belongs to that company.

  return {
    ticket,
    replies: replies ?? [],
    canReply
  }
}

export const actions: Actions = {
  reply: async ({ request, params, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const ticketId = params.ticket_id
    const formData = await request.formData()
    const replyText = formData.get("reply_text") as string

    if (!replyText || replyText.length < 2) {
      return fail(400, { errorMessage: "Reply is too short" })
    }

    // We can optionally re-check `canReply` logic
    // We'll do a simpler check here:
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, employee_approved, company_name, website")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return fail(403, { errorMessage: "No profile / no permission" })
    }

    // fetch the ticket to compare
    const { data: ticket } = await supabase
      .from("tickets")
      .select("user_id")
      .eq("id", ticketId)
      .single()

    if (!ticket) {
      return fail(404, { errorMessage: "Ticket not found" })
    }

    // fetch ticket owner's profile
    const { data: ticketOwner } = await supabase
      .from("profiles")
      .select("company_name, website")
      .eq("id", ticket.user_id)
      .single()

    if (!ticketOwner) {
      return fail(403, { errorMessage: "No ticket owner / no permission" })
    }

    const sameCoOrSite =
      ticketOwner.company_name === profile.company_name ||
      ticketOwner.website === profile.website

    let canReply = false
    if (profile.role === "customer") {
      canReply = sameCoOrSite
    } else if (profile.role === "employee") {
      canReply = (profile.employee_approved && sameCoOrSite) ? true : false
    } else if (profile.role === "administrator") {
      canReply = sameCoOrSite
    }

    if (!canReply) {
      return fail(403, { errorMessage: "Not allowed to reply to this ticket" })
    }

    const { error } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        reply_text: replyText
      })

    if (error) {
      console.error("Error inserting reply", error)
      return fail(500, { errorMessage: "Failed to save reply" })
    }

    return { success: true }
  }
}
