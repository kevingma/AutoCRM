import { env } from "$env/dynamic/private"

// Define our own interface for request messages:
interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant"
  content: string
}

/**
 * Minimal OpenAI GPT-4 helper.
 */
export async function chatWithOpenAIGpt4o(
  messages: ChatCompletionRequestMessage[],
): Promise<string> {
  const OPENAI_API_KEY = env.PRIVATE_OPENAI_API_KEY
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
