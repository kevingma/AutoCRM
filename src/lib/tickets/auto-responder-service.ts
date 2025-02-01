import { ChatOpenAI } from '@langchain/openai'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'

/**
 * Auto-response prompt, more advanced style
 */
const RESPONDER_PROMPT = `You are an experienced support agent. 
Given the conversation details, produce a plain text reply to the user.

Guidelines:
- Greet politely
- Acknowledge the user’s concern
- Provide helpful next steps
- Use placeholders [like this] if lacking data
- End with a friendly closing

Conversation:
{conversation}

Draft your reply now:
`

export class AutoResponderService {
  private readonly llm: ChatOpenAI
  private readonly responderPrompt: PromptTemplate

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })
    this.responderPrompt = PromptTemplate.fromTemplate(RESPONDER_PROMPT)
  }

  /**
   * Generate a draft response for a conversation.
   */
  async generateDraftResponse(conversationText: string): Promise<string> {
    const chain = this.responderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser())

    const result = await chain.invoke({
      conversation: conversationText,
    })
    return result.trim()
  }
}