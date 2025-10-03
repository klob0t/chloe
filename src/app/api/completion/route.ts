import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.POLLINATIONS_API_KEY
const TEXT_ENDPOINT = 'https://text.pollinations.ai/'
const IMAGE_ENDPOINT = 'https://image.pollinations.ai/'

export async function POST(request: NextRequest) {
   if (!API_KEY) return NextResponse.json({ error: 'Missing API Key!' })

   try {
      const payload = await request.json()
      const { prompt, system, id, history, model } = payload

      if (!prompt) {
         return NextResponse.json({ error: 'Missing prompt!' }, { status: 400 })
      }

      let url = `${TEXT_ENDPOINT}${encodeURIComponent(prompt)}?`
      if (system) {
         url += `&system=${encodeURIComponent(system)}`
      }
      if (model) {
         url += `&model=${encodeURIComponent(model)}`
      }

      const response = await fetch(url, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sUOFZ6hqEiyvdNhn'
         }
      })

      if (!response.ok) {
         const errorText = await response.text()
         return NextResponse.json({ error: 'API request failed', details: errorText }, { status: response.status })
      }

      const data = await response.text()

      return NextResponse.json({
         response: data,
         id: id || 'default'
      })

   } catch (error) {
      console.error('Error in completion route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
   }
}