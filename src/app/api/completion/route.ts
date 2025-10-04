import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.POLLINATIONS_API_KEY
const OPENAI_ENDPOINT = 'https://text.pollinations.ai/openai'

export async function POST(request: NextRequest) {
   if (!API_KEY) return NextResponse.json({ error: 'Missing API Key!' })

   try {
      const payload = await request.json()
      const { messages, model = 'openai' } = payload

      if (!messages || !Array.isArray(messages)) {
         return NextResponse.json({ error: 'Missing or invalid messages array!' }, { status: 400 })
      }

      const requestBody = {
         messages,
         model,
         max_tokens: 1000
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

      // Extract the content from the OpenAI response
      const assistantMessage = data.choices?.[0]?.message?.content || data.response || ''

      return NextResponse.json({
         response: assistantMessage,
         usage: data.usage
      })

   } catch (error) {
      console.error('Error in completion route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
   }
}