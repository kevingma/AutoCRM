import type { SupabaseClient } from "@supabase/supabase-js"
import { ChatOpenAI } from "@langchain/openai"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { PromptTemplate } from "@langchain/core/prompts"
import { z } from "zod"

// Our internal priority enumeration (low, normal, high, urgent)
const prioritySchema = z.enum(["low", "normal", "high", "urgent"])
type TicketPriority = z.infer<typeof prioritySchema>

// Minimal summarization prompt
const SUMMARY_PROMPT = `You are a helpful assistant that summarizes a customer support conversation succinctly.

Please generate a concise summary in the following format:
<format>
**Main Issue/Request**
*main_issue*

**Key Details**
*key_details*

**Actions Taken**
*actions_taken*

**Next Steps**
*next_steps*
</format>

Conversation to summarize:
{conversation}

Summary:
`

// Priority classification prompt
const PRIORITY_PROMPT = `Analyze the user’s message and decide if priority is "low", "normal", "high", or "urgent". Return only that single word.
Message:
{content}
`

/**
 * Extended Summarizer with classification capabilities
 */
export class TicketSummarizerService {
  private readonly llm: ChatOpenAI
  private readonly summaryPrompt: PromptTemplate
  private readonly priorityPrompt: PromptTemplate

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly orgKey?: string,
  ) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    this.summaryPrompt = PromptTemplate.fromTemplate(SUMMARY_PROMPT)
    this.priorityPrompt = PromptTemplate.fromTemplate(PRIORITY_PROMPT)
  }

  /**
   * Summarize the conversation text (existing method).
   */
  async summarizeTicketConversation(
    ticketId: string,
    conversationText: string,
  ): Promise<string> {
    const chain = this.summaryPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser())

    const result = await chain.invoke({
      conversation: conversationText,
    })
    return result.trim()
  }

  /**
   * Classify user message into { low, normal, high, urgent }
   */
  async classifyPriority(content: string): Promise<TicketPriority> {
    const chain = this.priorityPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser())
    const raw = await chain.invoke({ content })
    const answer = raw.toLowerCase().trim()
    try {
      return prioritySchema.parse(answer)
    } catch {
      // fallback
      return "normal"
    }
  }
}
