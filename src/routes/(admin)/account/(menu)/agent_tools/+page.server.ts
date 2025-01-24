import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals: { safeGetSession, supabase },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Confirm role is employee or admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_name, website")
    .eq("id", user.id)
    .single()

  if (
    !profile ||
    (profile.role !== "employee" && profile.role !== "administrator")
  ) {
    throw redirect(303, "/account")
  }

  // Load personal templates (owned by the user)
  const { data: personalTemplates, error: ptError } = await supabase
    .from("response_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (ptError) {
    console.error("Error loading personal templates", ptError)
  }

  // Load shared templates (is_shared = true)
  const { data: sharedTemplates, error: stError } = await supabase
    .from("response_templates")
    .select("*")
    .eq("is_shared", true)
    .order("created_at", { ascending: false })

  if (stError) {
    console.error("Error loading shared templates", stError)
  }

  return {
    personalTemplates: personalTemplates ?? [],
    sharedTemplates: sharedTemplates ?? [],
  }
}

export const actions: Actions = {
  createTemplate: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Double-check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return fail(403, { error: "Not authorized" })
    }

    const formData = await request.formData()
    const title = formData.get("title")?.toString() || ""
    const content = formData.get("content")?.toString() || ""
    const isShared = formData.get("is_shared") === "true"

    if (title.length < 3 || content.length < 3) {
      return fail(400, { error: "Title and content must be at least 3 chars" })
    }

    const { error: insertError } = await supabase
      .from("response_templates")
      .insert({
        user_id: user.id,
        title,
        content,
        is_shared: isShared,
      })

    if (insertError) {
      console.error("Error inserting template", insertError)
      return fail(500, { error: "Could not create template." })
    }

    return { success: true }
  },

  updateTemplate: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Double-check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return fail(403, { error: "Not authorized" })
    }

    const formData = await request.formData()
    const templateId = formData.get("id")?.toString() || ""
    const title = formData.get("title")?.toString() || ""
    const content = formData.get("content")?.toString() || ""
    const isShared = formData.get("is_shared") === "true"

    if (!templateId) {
      return fail(400, { error: "No template id provided." })
    }
    if (title.length < 3 || content.length < 3) {
      return fail(400, { error: "Title and content must be at least 3 chars" })
    }

    // Ensure user owns this template
    const { data: existing } = await supabase
      .from("response_templates")
      .select("user_id")
      .eq("id", templateId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return fail(403, { error: "Not authorized to update this template." })
    }

    const { error: updateError } = await supabase
      .from("response_templates")
      .update({ title, content, is_shared: isShared })
      .eq("id", templateId)

    if (updateError) {
      console.error("Error updating template", updateError)
      return fail(500, { error: "Could not update template." })
    }

    return { success: true }
  },

  deleteTemplate: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw redirect(303, "/login")
    }

    // Double-check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      !profile ||
      (profile.role !== "employee" && profile.role !== "administrator")
    ) {
      return fail(403, { error: "Not authorized" })
    }

    const formData = await request.formData()
    const templateId = formData.get("id")?.toString() || ""

    if (!templateId) {
      return fail(400, { error: "No template id provided." })
    }

    // Ensure user owns it
    const { data: existing } = await supabase
      .from("response_templates")
      .select("user_id")
      .eq("id", templateId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return fail(403, { error: "Not authorized to delete this template." })
    }

    const { error: deleteError } = await supabase
      .from("response_templates")
      .delete()
      .eq("id", templateId)

    if (deleteError) {
      console.error("Error deleting template", deleteError)
      return fail(500, { error: "Could not delete template." })
    }

    return { success: true }
  },
}
