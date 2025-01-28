import { fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import { handleAgentMessage } from "$lib/agent/agent_executor.server"

export const load: PageServerLoad = async () => {
  // You can later fetch stored conversation if desired.
  // For now, we just return an empty array for the initial page data.
  return {
    messages: []
  }
}

export const actions: Actions = {
  send: async ({ request, locals }) => {
    // We only allow employees or admins:
    const { user, session } = locals
    if (!session || !user) {
      return fail(403, { error: "Not logged in or not authorized." })
    }

    const formData = await request.formData()
    const userMessage = formData.get("userMessage")?.toString() || ""
    if (!userMessage) {
      return fail(400, { error: "No message provided" })
    }

    try {
      // handleAgentMessage calls your backend pseudo-agent that can do tool calls.
      const responseText = await handleAgentMessage(userMessage)
      return {
        success: true,
        response: responseText
      }
    } catch (err) {
      console.error("Agent error:", err)
      return fail(500, { error: "Agent failed to respond." })
    }
  }
}