import { ChatOpenAI } from "@langchain/openai"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { PromptTemplate } from "@langchain/core/prompts"
import { z } from "zod"

/**
 * JSON schema for grading results
 */
const gradeSchema = z.object({
  quality_score: z.number().min(1).max(5),
  accuracy_score: z.number().min(1).max(5),
  summary: z.string(),
  concerns: z.array(z.string()),
})

export interface ResponseGrade {
  quality_score: number
  accuracy_score: number
  summary: string
  concerns: string[]
}

/**
 * Detailed grading prompt
 */
const GRADER_PROMPT = `You are an expert customer support quality analyst. Your task is to quickly assess a support response on two key factors:

1) Overall Quality (1-5)
2) Accuracy & Alignment (1-5)

Return JSON in the exact format:
{
  "quality_score": <1-5>,
  "accuracy_score": <1-5>,
  "summary": "<short explanation>",
  "concerns": ["..."]
}

Context:
{context}

User message:
{userMessage}

Draft reply:
{draftReply}
`

export class ResponseGraderService {
  private readonly llm: ChatOpenAI
  private readonly graderPrompt: PromptTemplate

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })
    this.graderPrompt = PromptTemplate.fromTemplate(GRADER_PROMPT)
  }

  /**
   * Grade the response with context and user message.
   */
  async gradeResponse(params: {
    context: string
    userMessage: string
    draftReply: string
  }): Promise<ResponseGrade> {
    const chain = this.graderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser())

    const raw = await chain.invoke({
      context: params.context,
      userMessage: params.userMessage,
      draftReply: params.draftReply,
    })

    // parse raw JSON
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      // fallback
      return {
        quality_score: 3,
        accuracy_score: 3,
        summary: "Parsing error, fallback to 3/3",
        concerns: [],
      }
    }
    // Validate schema
    try {
      const validated = gradeSchema.parse(parsed)
      return validated
    } catch (err) {
      return {
        quality_score: 3,
        accuracy_score: 3,
        summary: "Invalid schema, fallback to 3/3",
        concerns: [],
      }
    }
  }
}
