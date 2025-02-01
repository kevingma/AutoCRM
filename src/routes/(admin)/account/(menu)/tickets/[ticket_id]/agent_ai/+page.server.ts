import { fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { AiService } from '@/lib/tickets/ai-service'

// Utility function to require employee/admin
async function requireAgentRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, employee_approved')
    .eq('id', userId)
    .single()
  if (!profile) {
    throw redirect(303, '/login')
  }
  if (profile.role === 'administrator') return true
  if (profile.role === 'employee' && profile.employee_approved) return true
  throw redirect(303, '/account') // not authorized
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const { session, user } = await locals.safeGetSession()
  if (!session || !user) {
    throw redirect(303, '/login')
  }

  await requireAgentRole(locals.supabase, user.id)

  // load the ticket
  const { data: ticket } = await locals.supabase
    .from('tickets')
    .select('id, title, description, status')
    .eq('id', params.ticket_id)
    .single()

  if (!ticket) {
    throw redirect(303, '/account/tickets')
  }

  // load any existing drafts
  const { data: drafts } = await locals.supabase
    .from('response_drafts')
    .select('*')
    .eq('ticket_id', ticket.id)
    .order('created_at', { ascending: false })

  return {
    ticket,
    drafts: drafts || [],
  }
}

export const actions: Actions = {
  generateDraft: async ({ locals, params }) => {
    const { session, user } = await locals.safeGetSession()
    if (!session || !user) throw redirect(303, '/login')
    await requireAgentRole(locals.supabase, user.id)

    const ai = new AiService(locals.supabaseServiceRole) // pass orgId if needed
    try {
      const draftText = await ai.generateDraft(params.ticket_id, user.id)
      if (!draftText) {
        return fail(400, { error: 'Auto-response is disabled.' })
      }
      return { draftText }
    } catch (err: any) {
      return fail(500, { error: err.message || 'Failed to generate draft' })
    }
  },

  approveDraft: async ({ locals, request }) => {
    const { session, user } = await locals.safeGetSession()
    if (!session || !user) throw redirect(303, '/login')
    await requireAgentRole(locals.supabase, user.id)

    const formData = await request.formData()
    const draftId = formData.get('draftId')?.toString() || ''

    // Mark as approved & store approved_by, approved_at
    const { error } = await locals.supabaseServiceRole
      .from('response_drafts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', draftId)

    if (error) {
      return fail(500, { error: error.message })
    }
    return { success: true }
  },

  rejectDraft: async ({ locals, request }) => {
    const { session, user } = await locals.safeGetSession()
    if (!session || !user) throw redirect(303, '/login')
    await requireAgentRole(locals.supabase, user.id)

    const formData = await request.formData()
    const draftId = formData.get('draftId')?.toString() || ''
    const feedback = formData.get('feedback')?.toString() || ''

    // Mark as rejected
    const { error } = await locals.supabaseServiceRole
      .from('response_drafts')
      .update({
        status: 'rejected',
        feedback,
      })
      .eq('id', draftId)

    if (error) {
      return fail(500, { error: error.message })
    }
    return { success: true }
  },

  gradeDraft: async ({ locals, request }) => {
    const { session, user } = await locals.safeGetSession()
    if (!session || !user) throw redirect(303, '/login')
    await requireAgentRole(locals.supabase, user.id)

    const formData = await request.formData()
    const draftId = formData.get('draftId')?.toString() || ''
    const content = formData.get('content')?.toString() || ''

    const ai = new AiService(locals.supabaseServiceRole)
    try {
      const gradeResult = await ai.gradeDraft(draftId, content)
      // Store the grade in the DB
      const { error } = await locals.supabaseServiceRole
        .from('response_drafts')
        .update({ grade: gradeResult })
        .eq('id', draftId)
      if (error) {
        return fail(500, { error: 'Failed to store grade' })
      }
      return { grade: gradeResult }
    } catch (err: any) {
      return fail(500, { error: err.message || 'Failed to grade' })
    }
  },
}