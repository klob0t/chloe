import { NextRequest, NextResponse } from 'next/server'
import { SEARCH_TOOL, handleToolCall, type ToolCallPayload } from '@/app/lib/utils/search'

const API_KEY = process.env.POLLINATIONS_API_KEY
const OPENAI_ENDPOINT = 'https://text.pollinations.ai/openai'

type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool'

interface ChatMessage {
  role: ChatCompletionRole
  content: string
  tool_call_id?: string
}

interface AssistantMessage {
  role: 'assistant'
  content: string | null
  tool_calls?: ToolCallPayload[]
}

interface CompletionRequestBody {
  messages: ChatMessage[]
  model?: string
}

interface CompletionChoice {
  message: AssistantMessage
}

interface CompletionApiResponse {
  choices?: CompletionChoice[]
  response?: string
  usage?: unknown
}

interface ToolResponseMessage {
  tool_call_id: string
  role: 'tool'
  content: string
}

const isChatMessageArray = (value: unknown): value is ChatMessage[] => {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every(item =>
    typeof item === 'object' &&
    item !== null &&
    'role' in item &&
    typeof (item as { role: unknown }).role === 'string' &&
    'content' in item &&
    typeof (item as { content: unknown }).content === 'string'
  )
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
  }

  try {
    const payload: CompletionRequestBody = await request.json()

    const { messages, model = 'openai' } = payload
    
    console.log('[api/completion] received', {
      model,
      messagesCount: messages?.length,
      lastUser: messages?.filter(m => m.role === 'user').slice(-1)[0]?.content?.slice(0, 160)
    })


    if (!isChatMessageArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 })
    }

    const requestBody = {
      messages,
      model,
      max_tokens: 1000,
      tools: [SEARCH_TOOL],
      tool_choice: 'auto'
    }

    const initialResponse = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text()
      console.error('Completion API error:', errorText)
      return NextResponse.json({ error: 'API request failed', details: errorText }, { status: initialResponse.status })
    }

    const data: CompletionApiResponse = await initialResponse.json()
    const message = data.choices?.[0]?.message
    if (!message?.content && !data.response) {
      console.error('Completion returned empty content', {
        status: initialResponse.status,
        model,
        messagesLen: messages.length,
        raw: data
      })
    }

    if (message?.tool_calls && message.tool_calls.length > 0) {
      console.log(`Completion requested ${message.tool_calls.length} tool call(s)`)

      const toolResponses: ToolResponseMessage[] = await Promise.all(
        message.tool_calls.map(async toolCall => {
          console.log('Executing tool call:', toolCall.function.name)
          const result = await handleToolCall(toolCall)
          console.log('Tool call completed:', toolCall.function.name)

          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: result
          }
        })
      )

      const followupMessages: Array<ChatMessage | AssistantMessage | ToolResponseMessage> = [
        ...messages,
        message,
        ...toolResponses
      ]

      const followupResponse = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          messages: followupMessages,
          model,
          max_tokens: 1000,
          tools: [SEARCH_TOOL]
        })
      })

      if (!followupResponse.ok) {
        const errorText = await followupResponse.text()
        console.error('Follow-up API error:', errorText)
        return NextResponse.json({ error: 'Follow-up API request failed', details: errorText }, { status: followupResponse.status })
      }

      const followupData: CompletionApiResponse = await followupResponse.json()


      const finalMessage = followupData.choices?.[0]?.message?.content ?? followupData.response ?? ''
      if (!finalMessage) {
        console.error('Follow-up completion empty', { raw: followupData })
      }
      return NextResponse.json({
        response: finalMessage,
        usage: followupData.usage
      })
    }

    const assistantMessage = message?.content ?? data.response ?? ''

    return NextResponse.json({
      response: assistantMessage,
      usage: data.usage
    })
  } catch (error) {
    console.error('Error in completion route:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
