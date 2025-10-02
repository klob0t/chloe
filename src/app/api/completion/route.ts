import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.POLLINATIONS_API_KEY
const TEXT_ENDPOINT = 'https://text.pollinations.ai/'

export async function POST(request: NextRequest) {
   if (!API_KEY) return Response.json({ error: 'Missing API Key!' })

   try {
      const payload = await request.json()
      const { prompt, system, id, history } = payload

      if (!prompt) {
         return Response.json({ error: 'Missing prompt!' }, { status: 400 })
      }

      let url = `${TEXT_ENDPOINT}${encodeURIComponent(prompt)}?apiKey=${API_KEY}`
      if (system) {
         url += `&system=${encodeURIComponent(system)}`
      }

      const response = await fetch(url, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json'
         }
      })

      if (!response.ok) {
         return Response.json({ error: 'API request failed' }, { status: response.status })
      }

      const data = await response.text()

      return Response.json({
         response: data,
         id: id || 'default'
      })

   } catch (error) {
      console.error('Error in completion route:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
   }
}