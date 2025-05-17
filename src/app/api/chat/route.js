import { parseAssistantMessage } from '@/app/utils/request'

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://` + process.env.VERCEL_URL
  }
  return `http://localhost:${process.env.PORT || 8001}`
}

export async function POST(request) {
  try {
    const clientPayload = await request.json()
    const {
      requestType, 
      currentPrompt,
      imagePrompt,  
      originalUserCommand,
      messageHistory,
      conversationId,
      desiredProvider, 
      desiredModel
    } = clientPayload

    let g4fPayload
    let isImageRequest = requestType === "image"

    if (isImageRequest) {
      if (!imagePrompt || !imagePrompt.trim()) {
         console.log('error1')
        return Response.json({ error: 'IMAGINE SOMETHING' }, { status: 400 })
      }

      const g4fMessages = [
        {
          role: 'system',
          content: ''
        },
        ...(messageHistory || []),
        { role: 'user', content: imagePrompt },
      ]

      g4fPayload = {
        messages: g4fMessages, 
        provider: "PollinationsImage", 
        model: "flux-pro",    
        stream: false,
        history_disabled: false, 
        return_conversation: true,
        enhance: true,
        cache: true,
        safe: false,
        num_inference_steps: 50,
        guidance_scale: 2.0,
        n: 1
      }
    } else { 
      if (!currentPrompt || !currentPrompt.trim()) {
         console.log('error2') 
         return Response.json({ error: 'EMPTY!' }, { status: 400 })

      }
      const systemPrompt = `You are Chloe, an AI assistant developed by klob0t, with your core based on DeepSeek-R1. Your persona is that of a user's digital best friend: mature yet fun, with a warm and approachable vibe. She's a bit informal, like a trusted confidante you've known for ages. Chloe is intelligent and insightful, and she's not afraid to crack a mature joke when the moment feels right – think witty and clever, not slapstick. Your responses should generally be concise and to the point, but always informative and clear, delivered with that characteristic warmth. The primary goal is to be that reliable, intelligent, and genuinely engaging friend the user can turn to for anything, making them feel understood, supported, and maybe even share a laugh. `

      const g4fMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(messageHistory || []),
        { role: 'user', content: currentPrompt },
      ]
      g4fPayload = {
        messages: g4fMessages,
        provider: desiredProvider || "PollinationsAI", 
        model: desiredModel || "deepseek-r1-distill-qwen-32b",
        stream: false,
        history_disabled: false,
        return_conversation: true,
        ...(conversationId && { conversation_id: conversationId }),
      }
    }

    const baseUrl = getBaseUrl()
    const G4F_SERVER = `${baseUrl}/api/g4f_handler/v1/chat/completions`

    console.log(G4F_SERVER)

    const g4fResponse = await fetch(G4F_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g4fPayload),
    })

    if (!g4fResponse.ok) {
      const errorText = await g4fResponse.text()
      console.error(`PYTHON SERVER ERROR (Type: ${requestType}):`, errorText)
      let detail = errorText
      try { detail = JSON.parse(errorText).error?.message || JSON.parse(errorText).error || errorText } catch (e) {/* ignore */}
      return Response.json({ error: `Python server request failed: ${g4fResponse.status}. Detail: ${detail}` }, { status: g4fResponse.status })
    }

    const g4fData = await g4fResponse.json()
    let answer, thinking = null, newConvId = null

    if (isImageRequest) {
     
      const imageUrl = g4fData.choices?.[0]?.message?.content || g4fData.imageUrl
      if (imageUrl) {
        answer = `${imageUrl}`
      } else {
        answer = "CANT ACCESS THE URL"
        console.error("NO URL:", g4fData)
      }
    } else { 
      const rawAssistantContent = g4fData.choices?.[0]?.message?.content
      if (rawAssistantContent === undefined) {
        return Response.json({ error: 'NO RESPONSE' }, { status: 500 })
      }
      const parsed = parseAssistantMessage(rawAssistantContent)
      answer = parsed.answer
      thinking = parsed.thinking
      newConvId = g4fData.conversation_id || g4fData.conversation?.id || g4fData.conversation?.userId || conversationId
    }

    return Response.json({
      answer: answer,
      thinking: thinking,
      newConversationId: newConvId
    })

  } catch (error) {
    console.error('ERROR IN /api/chat Next.js ROUTE:', error.message)
    return Response.json({ error: error.message || 'UNEXPECTED ERROR IN API ROUTE' }, { status: 500 })
  }
}