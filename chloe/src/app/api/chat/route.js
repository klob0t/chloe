export async function POST(request) {
   try {
      const { prompt } = await request.json()

      if (!prompt) {
         return Response.json({ error: 'NO PROMPT' }, { status: 400 })
      }

      const gpt4freePayload = {
         messages: [
            {
               role: 'system',
               content: "you are an assistant named 'CHLOE' developed by klob0t based from deepsek-r1. you talk in informal way usually. and use slangs often. IMPORTANT: USE KAOMOJI INSTEAD OF MODERN EMOJI."
            },
            {
               role: 'user',
               content: prompt
            },
         ],
         provider: 'DeepInfraChat',
         model: 'deepseek-ai/DeepSeek-R1-Turbo',
         stream: false
      }

      const GPT4FREE_API_URL = 'http://localhost:1337/v1/chat/completions'

      const gpt4freeResponse = await fetch(GPT4FREE_API_URL, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(gpt4freePayload),
      })

      if (!gpt4freeResponse.ok) {
         const errorData = await gpt4freeResponse.text()
         console.error('ERROR:', errorData)
         throw new Error(
            `API REQ FAILED: ${gpt4freeResponse.status} ${errorData}`
         )
      }

      const data = await gpt4freeResponse.json()
      const assistantMessage = data.choices?.[0]?.message?.content

      if (assistantMessage === undefined) {
         console.error('NO ANSWER FROM CHLOE', data)
         throw new Error('NO ANSWER FROM CHLOE')
      }

      return Response.json({ response: assistantMessage })
   } catch (error) {
      console.error('NEXT.JS API POST', error.message)
      return Response.json({ error: error.message }, { status: 500 })
   }
}

