import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../../DatabaseDefinitions"

/**
 * Each tool here is a named function that the AI agent can invoke to
 * perform actions on the CRM system. For example: updateTicket, createTicket,
 * assignAgent, etc. We'll wrap them in a lightweight interface so
 * the agent can call them at runtime.
 */

/**
 * Updates the status or priority of a ticket.
 */
export async function updateTicketTool(
  params: {
    ticketId: string
    status?: string
    priority?: string
  },
  supabase: SupabaseClient<Database>,
) {
  // Modify this to do partial updates if you'd like
  const updates: Record<string, unknown> = {}
  if (params.status) updates.status = params.status
  if (params.priority) updates.priority = params.priority

  if (!Object.keys(updates).length) {
    return "No changes specified for ticket update."
  }

  const { error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", params.ticketId)

  if (error) {
    return `Failed to update ticket. Error: ${error.message}`
  }

  return `Ticket [${params.ticketId}] updated successfully!`
}

/**
 * Adds an internal or public reply to a ticket.
 */
export async function replyTicketTool(
  params: {
    ticketId: string
    replyText: string
    isInternal?: boolean
  },
  supabase: SupabaseClient<Database>,
) {
  if (!params.replyText) {
    return "No reply text provided."
  }
  const { error } = await supabase.from("ticket_replies").insert({
    ticket_id: params.ticketId,
    user_id: "agent-ai", // or a specific user ID if needed
    reply_text: params.replyText,
    is_internal: params.isInternal ?? false,
  })

  if (error) {
    return `Failed to add reply. Error: ${error.message}`
  }
  return `Reply posted to ticket [${params.ticketId}]`
}

/**
 * Example of assigning a ticket to a specific user (employee).
 */
export async function assignAgentTool(
  params: {
    ticketId: string
    userId: string
  },
  supabase: SupabaseClient<Database>,
) {
  const { error } = await supabase
    .from("tickets")
    .update({ assigned_to: params.userId, status: "in_progress" })
    .eq("id", params.ticketId)

  if (error) {
    return `Failed to assign agent. Error: ${error.message}`
  }
  return `Ticket [${params.ticketId}] assigned to user [${params.userId}].`
}

/**
 * Example: changing an employee's role or adding them to a team, etc.
 */
export async function manageEmployeeTool(
  params: {
    userId: string
    newRole?: string
    teamId?: string
  },
  supabase: SupabaseClient<Database>,
) {
  // This is just a stub:
  if (params.newRole) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: params.newRole })
      .eq("id", params.userId)

    if (error) {
      return `Failed to update role. Error: ${error.message}`
    }
  }
  if (params.teamId) {
    // add them to team_members if you want
    const { error } = await supabase
      .from("team_members")
      .insert({ user_id: params.userId, team_id: params.teamId })
    if (error && !error.message.includes("duplicate key")) {
      return `Failed to add user to team. Error: ${error.message}`
    }
  }
  return `Manage Employee completed successfully.`
}

/**
 * Additional tools can be added here.
 */
