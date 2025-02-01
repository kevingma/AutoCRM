import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../../DatabaseDefinitions"
import { AutoResponderService } from "./auto-responder-service"
import { TicketSummarizerService } from "./summarizer-service"
import { ResponseGraderService, type ResponseGrade } from "./grader-service"
import { recordAiConversation } from "$lib/server/langsmith_integration" // <--- added

/**
 * AiService combines the summarizer, auto-responder, and grader
 * to generate or manage AI drafts for tickets.
 */
export class AiService {
  private supabase: SupabaseClient<Database>
  private orgId?: string // If you store org-level data

  constructor(supabase: SupabaseClient<Database>, orgId?: string) {
    this.supabase = supabase
    this.orgId = orgId
  }

  /**
   * Summarize the latest conversation or ticket details
   */
  async summarizeTicket(ticketId: string) {
    // Use the summarizer. Example:
    const summarizer = new TicketSummarizerService(
      this.supabase,
      this.orgId || "",
    )
    // For demonstration, let's just fetch the ticket's description or conversation
    // Then do summarizer.updateTicketSummary(...) if you store the summary in a note.
    // Or simply call summarizer.summarizeTicketConversation(...) if you want to get a raw summary.
    // This is up to your usage.
    return `Summary placeholder for ticket ${ticketId}`
  }

  /**
   * Generate a new AI draft response
   */
  async generateDraft(ticketId: string, userId: string) {
    // 1) Get ticket
    const { data: ticket } = await this.supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single()
    if (!ticket) throw new Error("Ticket not found")

    const startTime = Date.now()

    // 2) Use the auto-responder service
    const autoResponder = new AutoResponderService(
      this.supabase,
      this.orgId || "",
    )
    const thread = {
      id: ticket.id,
      ticket_id: ticket.id,
      messages: [], // in a real system, fetch conversation or replies
    }

    // We simulate a user message for demonstration
    const mockUserMsg = `User says: ${ticket.description}`
    const draftResponse = await autoResponder.generateDraftResponse(
      mockUserMsg as any,
    )

    // 3) Telemetry: record the call in our mock LangSmith integration
    const endTime = Date.now()
    await recordAiConversation({
      callId: `draft-gen-${ticketId}-${Date.now()}`,
      messages: [
        {
          role: "user",
          content: mockUserMsg,
        },
      ],
      response: draftResponse || "",
      successRate: !!draftResponse, // simplistic
      accuracyScore: 4.5, // placeholder
      elapsedMs: endTime - startTime,
    })

    // 4) Return the raw draft text or handle null if disabled
    return draftResponse
  }

  /**
   * Grade a proposed draft
   */
  async gradeDraft(draftId: string, content: string) {
    const { data: draft } = await this.supabase
      .from("response_drafts")
      .select("*, ticket_id")
      .eq("id", draftId)
      .single()

    if (!draft) throw new Error("Draft not found")
    const thread = { id: draft.ticket_id, messages: [] } // adapt if needed

    const grader = new ResponseGraderService(this.supabase, this.orgId || "")
    const startTime = Date.now()
    const gradeResult = await grader.gradeResponse({
      context: "Context from notes, articles, etc.",
      userMessage: "Simulated original message from the contact.",
      draftReply: content,
    })
    const endTime = Date.now()

    // record it in telemetry as well
    await recordAiConversation({
      callId: `grade-draft-${draftId}-${Date.now()}`,
      messages: [
        { role: "user", content: "Please grade this reply:\n" + content },
      ],
      response: JSON.stringify(gradeResult),
      successRate: true, // simplistic
      accuracyScore:
        (gradeResult.quality_score + gradeResult.accuracy_score) / 2,
      elapsedMs: endTime - startTime,
    })
    return gradeResult
  }
}
