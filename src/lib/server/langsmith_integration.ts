// import type { ChatCompletionRequestMessage } from "../openai"
import { env } from "$env/dynamic/private"

/**
 * EXAMPLE: Minimal demonstration of hooking up
 * an external analytics or LangSmith/LLM instrumentation.
 *
 * You'd install "langsmith" or "@langchain/analytics"
 * depending on your approach:
 *    npm install langsmith
 *
 * Then import or create a client:
 */
// import { LangChainTracer } from "langsmith" // Example import

let mockTracerEnabled = false

// In an actual project, you'd store an API key or project ID
// from your environment variables:
const LANGSMITH_API_KEY = env.LANGSMITH_API_KEY || ""

// Fake class as an example
class FakeLangSmithClient {
  constructor(public apiKey: string) {}

  async recordAiCall({
    callId,
    userMessage,
    aiResponse,
    successMetric,
    accuracyMetric,
    errorType,
    timeMs,
  }: {
    callId: string
    userMessage: string
    aiResponse: string
    successMetric?: boolean
    accuracyMetric?: number
    errorType?: string
    timeMs?: number
  }) {
    // In real code, you'd post to the LangSmith API or your custom endpoint
    console.log("[LangSmith] Recording AI call:", {
      callId,
      userMessage,
      aiResponse,
      successMetric,
      accuracyMetric,
      errorType,
      timeMs,
    })
  }
}

let client: FakeLangSmithClient | null = null

if (LANGSMITH_API_KEY) {
  client = new FakeLangSmithClient(LANGSMITH_API_KEY)
  mockTracerEnabled = true
}

// Define the type locally
type ChatCompletionRequestMessage = {
  role: string
  content: string
  name?: string
}

export async function recordAiConversation({
  callId,
  messages,
  response,
  successRate,
  accuracyScore,
  errorType,
  elapsedMs,
}: {
  callId: string
  messages: ChatCompletionRequestMessage[]
  response: string
  successRate?: boolean
  accuracyScore?: number
  errorType?: string
  elapsedMs?: number
}) {
  if (!mockTracerEnabled || !client) {
    return
  }

  // For simplicity, we just combine user messages
  let userMsg = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n---\n")

  await client.recordAiCall({
    callId,
    userMessage: userMsg,
    aiResponse: response,
    successMetric: successRate,
    accuracyMetric: accuracyScore,
    errorType,
    timeMs: elapsedMs,
  })
}
