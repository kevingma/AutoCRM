import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  url,
  locals: { supabase, supabaseServiceRole, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    // Not logged in
    throw redirect(303, "/login")
  }

  // Fetch user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website, employee_approved")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching profile or missing", profileError)
    return { tickets: [], userRole: "" }
  }

  const role = profile.role
  const companyName = profile.company_name
  const website = profile.website
  let sharedUserIds: string[] = []

  // Admin or (approved) employee => see same-company tickets. Otherwise see your own & same company/website.
  if (role === "administrator") {
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${companyName},website.eq.${website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
  } else if (role === "employee") {
    if (profile.employee_approved) {
      const { data: relatedProfiles } = await supabaseServiceRole
        .from("profiles")
        .select("id")
        .or(`company_name.eq.${companyName},website.eq.${website}`)
      sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    } else {
      // not approved => only own
      sharedUserIds = [user.id]
    }
  } else {
    // role === 'customer'
    const { data: relatedProfiles } = await supabaseServiceRole
      .from("profiles")
      .select("id")
      .or(`company_name.eq.${companyName},website.eq.${website}`)
    sharedUserIds = relatedProfiles?.map((p) => p.id) ?? []
    if (!sharedUserIds.includes(user.id)) {
      sharedUserIds.push(user.id)
    }
  }

  // Filter by status and sort
  const statusParam = url.searchParams.get("status") || "open"
  const sortParam = url.searchParams.get("sort") || "desc"
  const ascending = sortParam === "asc"

  let query = supabase.from("tickets").select("*").in("user_id", sharedUserIds)

  if (statusParam === "all") {
    // no filter
  } else if (statusParam === "open_and_in_progress") {
    query = query.in("status", ["open", "in_progress"])
  } else {
    query = query.eq("status", statusParam)
  }
  query = query.order("created_at", { ascending })

  const { data: tickets, error: ticketsError } = await query
  if (ticketsError) {
    console.error("Error fetching tickets", ticketsError)
    return { tickets: [], userRole: role }
  }

  return {
    tickets,
    userRole: role,
    companyName,
    website,
    statusParam,
    sortParam,
    form: null,
  }
}

export const actions: Actions = {
  createTicket: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!title || title.length < 3) {
      return fail(400, {
        errorMessage: "Title must be at least 3 characters",
        errorFields: ["title"],
        title,
        description,
      })
    }
    if (!description || description.length < 5) {
      return fail(400, {
        errorMessage: "Description must be at least 5 characters",
        errorFields: ["description"],
        title,
        description,
      })
    }

    // Optional new fields
    const priority = (formData.get("priority") as string) || null
    const tagsRaw = formData.get("tags") as string
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : null
    const customFieldsRaw = formData.get("custom_fields") as string
    let customFields = null
    if (customFieldsRaw) {
      try {
        customFields = JSON.parse(customFieldsRaw)
      } catch {
        return fail(400, {
          errorMessage: "Invalid JSON in custom_fields",
          errorFields: ["custom_fields"],
          title,
          description,
          priority,
          tagsRaw,
          customFieldsRaw,
        })
      }
    }

    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      title,
      description,
      priority,
      tags,
      custom_fields: customFields,
    })

    if (error) {
      console.error("Error creating ticket", error)
      return fail(500, {
        errorMessage: "Could not create ticket, please try again",
        title,
        description,
      })
    }

    return { success: true }
  },

  // New action to update ticket fields (status, priority, tags, etc.)
  updateTicket: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    if (!session) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const ticketId = formData.get("ticket_id") as string
    if (!ticketId) {
      return fail(400, { errorMessage: "Missing ticket_id" })
    }

    const status = formData.get("status") as string
    const priority = formData.get("priority") as string
    const tagsRaw = formData.get("tags") as string
    let tags = null
    if (tagsRaw) {
      tags = tagsRaw.split(",").map((t) => t.trim())
    }
    const customFieldsRaw = formData.get("custom_fields") as string
    let customFields = null
    if (customFieldsRaw) {
      try {
        customFields = JSON.parse(customFieldsRaw)
      } catch {
        return fail(400, { errorMessage: "Invalid JSON in custom_fields" })
      }
    }

    const fieldsToUpdate: Record<string, unknown> = {}
    if (status !== undefined) fieldsToUpdate.status = status
    if (priority !== undefined) fieldsToUpdate.priority = priority
    if (tags !== undefined) fieldsToUpdate.tags = tags
    if (customFields !== undefined) fieldsToUpdate.custom_fields = customFields

    const { error } = await supabase
      .from("tickets")
      .update(fieldsToUpdate)
      .eq("id", ticketId)

    if (error) {
      console.error("Error updating ticket", error)
      return fail(500, { errorMessage: "Could not update ticket" })
    }
    return { success: true }
  },

  // New action to add a reply, including internal notes
  addReply: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }
    const formData = await request.formData()
    const ticketId = formData.get("ticket_id") as string
    const replyText = formData.get("reply_text") as string
    const isInternal = formData.get("is_internal") === "true"

    if (!ticketId) {
      return fail(400, { errorMessage: "Missing ticket_id" })
    }
    if (!replyText || replyText.length < 2) {
      return fail(400, { errorMessage: "Reply text must be at least 2 chars" })
    }

    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      user_id: user.id,
      reply_text: replyText,
      is_internal: isInternal,
    })

    if (error) {
      console.error("Error adding reply", error)
      return fail(500, { errorMessage: "Could not add reply" })
    }onTestFailed

    return { success: true }
  },
}
