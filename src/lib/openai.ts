import { env as privateEnv } from "$env/dynamic/private"
import { env as publicEnv } from "$env/dynamic/public"
import { createClient } from "@supabase/supabase-js"
// import { updateTicketTool, replyTicketTool, assignAgentTool, manageEmployeeTool } from "./agent_tools.server"

/**
 * If using official LangChain and OpenAI function calling, you'd integrate similarly to the next.js example.
 * For demonstration, this file shows a simpler pseudo-agent approach.
 */

async function callOpenAIChat(messages: { role: string; content: string }[]) {
  // Private environment for keys like OPENAI_API_KEY
  const OPENAI_API_KEY = privateEnv.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    console.error("No OPENAI_API_KEY found in environment.")
    return "OpenAI is not configured. Please contact support."
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text())
      return "OpenAI GPT-4 is currently unavailable. Please try again later."
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? "No response"
  } catch (e) {
    console.error("OpenAI fetch error:", e)
    return "OpenAI GPT-4 is currently unavailable. Please try again later."
  }
}

export async function handleAgentMessage(userMessage: string) {
  // Notice we import the PUBLIC_SUPABASE_URL from publicEnv now
  const SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE = privateEnv.PRIVATE_SUPABASE_SERVICE_ROLE

  // 1. Call LLM for an interpretation
  const systemContent = `
You are an AI assistant integrated with the CRM. You may perform the following tool calls:
1) Update ticket => { "tool": "updateTicket", "ticketId": "...", "status": "...", "priority": "..." }
2) Reply to ticket => { "tool": "replyTicket", "ticketId": "...", "replyText": "...", "isInternal": false }
3) Assign agent => { "tool": "assignAgent", "ticketId": "...", "userId": "..." }
4) Manage employee => { "tool": "manageEmployee", "userId": "...", "newRole": "...", "teamId": "..." }

If no tool is required, just respond directly. If a tool is required, output JSON with the exact "tool" field and arguments. 
Provide only valid JSON, no extra commentary.
`
  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userMessage },
  ]
  const rawResponse = await callOpenAIChat(messages)

  // 2. Attempt to parse JSON
  let parseable = null
  try {
    parseable = JSON.parse(rawResponse)
  } catch {
    // It's normal text only, no tool call needed
  }

  let finalText = rawResponse

  // 3. If parseable has "tool", we call that
  if (parseable && parseable.tool) {
    // Create the Supabase client with the correct public URL and private key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    let toolResult = ""
    switch (parseable.tool) {
      case "updateTicket": {
        toolResult = await updateTicketTool(
          {
            ticketId: parseable.ticketId,
            status: parseable.status,
            priority: parseable.priority,
          },
          supabase,
        )
        break
      }
      case "replyTicket": {
        toolResult = await replyTicketTool(
          {
            ticketId: parseable.ticketId,
            replyText: parseable.replyText,
            isInternal: parseable.isInternal ?? false,
          },
          supabase,
        )
        break
      }
      case "assignAgent": {
        toolResult = await assignAgentTool(
          {
            ticketId: parseable.ticketId,
            userId: parseable.userId,
          },
          supabase,
        )
        break
      }
      case "manageEmployee": {
        toolResult = await manageEmployeeTool(
          {
            userId: parseable.userId,
            newRole: parseable.newRole,
            teamId: parseable.teamId,
          },
          supabase,
        )
        break
      }
      default:
        toolResult = `Tool [${parseable.tool}] is not recognized.`
    }
    finalText = `Tool invoked: ${parseable.tool}\nResult: ${toolResult}`
  }

  return finalText
}