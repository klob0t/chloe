import { NextRequest, NextResponse } from "next/server";
import { SEARCH_TOOL, handleToolCall } from "@/app/lib/tools/search";

const API_KEY = process.env.POLLINATIONS_API_KEY
const OPENAI_ENDPOINT = 'https://text.pollinations.ai/openai'

export async function POST(request: NextRequest) {
   if (!API_KEY) return NextResponse.json({ error: 'Missing API Key!' })

   try {
      const payload = await request.json()
      const { messages, model = 'openai', tools } = payload

      if (!messages || !Array.isArray(messages)) {
         return NextResponse.json({ error: 'Missing or invalid messages array!' }, { status: 400 })
      }

      const requestBody = {
         messages,
         model,
         max_tokens: 1000,
         tools: [SEARCH_TOOL],
         tool_choice: "auto"
      }

      const response = await fetch(OPENAI_ENDPOINT, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sUOFZ6hqEiyvdNhn'
         },
         body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
         const errorText = await response.text()
         console.error('API Error:', errorText)
         return NextResponse.json({ error: 'API request failed', details: errorText }, { status: response.status })
      }

      const data = await response.json()

      // Handle tool calls
      const message = data.choices?.[0]?.message

      if (message?.tool_calls && message.tool_calls.length > 0) {
        console.log(`🛠️ AI requested ${message.tool_calls.length} tool(s):`,
          message.tool_calls.map((tc: any) => ({ name: tc.function.name, args: tc.function.arguments }))
        )

        // Execute tool calls
        const toolResponses = await Promise.all(
          message.tool_calls.map(async (toolCall: any) => {
            console.log(`🔧 Executing tool: ${toolCall.function.name}`)
            const result = await handleToolCall(toolCall)
            console.log(`✅ Tool result length: ${result.length} characters`)
            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              content: result
            }
          })
        )

        // Send tool responses back to get final answer
        const followupMessages = [
          ...messages,
          message,
          ...toolResponses
        ]

        const followupResponse = await fetch(OPENAI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sUOFZ6hqEiyvdNhn'
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
          console.error('Followup API Error:', errorText)
          return NextResponse.json({ error: 'Followup API request failed', details: errorText }, { status: followupResponse.status })
        }

        const followupData = await followupResponse.json()
        const finalMessage = followupData.choices?.[0]?.message?.content || followupData.response || ''

        return NextResponse.json({
          response: finalMessage,
          usage: followupData.usage
        })
      }

      // Extract the content from the OpenAI response
      const assistantMessage = message?.content || data.response || ''

      return NextResponse.json({
         response: assistantMessage,
         usage: data.usage
      })

   } catch (error) {
      console.error('Error in completion route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
   }
}