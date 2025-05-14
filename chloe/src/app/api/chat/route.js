import { parseAssistantMessage } from "@/app/utils/request"

export async function POST(request) {
   try {
      const { currentPrompt, messageHistory, conversationId } = await request.json()

      if (!currentPrompt || !currentPrompt.trim()) {
         return Response.json({ error: 'NO PROMPT' }, { status: 400 })
      }

      const messagesForG4F = [
         {
            role: 'system',
            content: "you are an assistant named 'CHLOE' developed by klob0t based from DeepSeek-R1. IMPORTANT: USE KAOMOJI INSTEAD OF MODERN EMOJI."
         },
         ...(messageHistory || []),
         {
            role: 'user',
            content: currentPrompt
         },

      ]

      const g4FPayload = {
         messages: messagesForG4F,
         provider: 'PollinationsAI',
         model: 'deepseek-r1-distill-qwen-32b',
         stream: false,
         history_disabled: false,
         return_conversation: true,
         ...(conversationId && { conversation_id: conversationId })
      }

      const G4F_API_URL = 'http://localhost:1337/v1/chat/completions'

      const g4FResponse = await fetch(G4F_API_URL, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(g4FPayload),
      })

      if (!g4FResponse.ok) {
         const errorDataText = await g4FResponse.text()
         console.error('ERROR:', errorDataText)

         let detail = errorDataText
         try {
            const parsedError = JSON.parse(errorDataText).error || errorDataText
            detail = parsedError.error || parsedError.message || errorText
         } catch (e) { }
         return Response.json({ error: `PYTHON SERVER REQ FAILED: ${g4FResponse.status} - ${detail}` }, { status: g4FResponse.status })
      }

      const dataFromG4F = await g4FResponse.json()

      const rawAssistantContent = dataFromG4F.choices?.[0]?.message?.content

      if (rawAssistantContent === undefined) {
         console.error('NO ANSWER FROM CHLOE', dataFromG4F)
         throw new Error('NO ANSWER FROM CHLOE')
      }

      const { thinking, answer } = parseAssistantMessage(rawAssistantContent)

      const newConversationId = dataFromG4F.conversation_id ||
         dataFromG4F.conversation?.id ||
         dataFromG4F.conversation?.userId ||
         null
      return Response.json({
         answer: answer,
         thinking: thinking,
         newConversationId: newConversationId
      })

   } catch (error) {
      console.error('ERROR IN /api/chat Next.js ROUTE: ', error.message)
      return Response.json({ error:error.message || 'AN UNEXPECTED ERROR OCCURRED' }, { status: 500 })
   }
}

