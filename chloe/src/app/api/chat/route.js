import { parseAssistantMessage } from '@/app/utils/request'

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

    let gpt4freePayload
    let isImageRequest = requestType === "image"

    if (isImageRequest) {
      if (!imagePrompt || !imagePrompt.trim()) {
         console.log('error1')
        return Response.json({ error: 'IMAGINE SOMETHING' }, { status: 400 })
      }

      const gpt4FreeMessages = [
        {
          role: 'system',
          content: ''
        },
        ...(messageHistory || []),
        { role: 'user', content: imagePrompt },
      ]

      gpt4freePayload = {
        messages: gpt4FreeMessages, 
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

      const gpt4FreeMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(messageHistory || []),
        { role: 'user', content: currentPrompt },
      ]
      gpt4freePayload = {
        messages: gpt4FreeMessages,
        provider: desiredProvider || "PollinationsAI", 
        model: desiredModel || "deepseek-r1-distill-qwen-32b",
        stream: false,
        history_disabled: false,
        return_conversation: true,
        ...(conversationId && { conversation_id: conversationId }),
      }
    }

    const GPT4FREE_PYTHON_API_URL = 'http://localhost:1337/v1/chat/completions'

    const gpt4freeResponse = await fetch(GPT4FREE_PYTHON_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gpt4freePayload),
    })

    if (!gpt4freeResponse.ok) {
      const errorText = await gpt4freeResponse.text()
      console.error(`PYTHON SERVER ERROR (Type: ${requestType}):`, errorText)
      let detail = errorText
      try { detail = JSON.parse(errorText).error?.message || JSON.parse(errorText).error || errorText } catch (e) {/* ignore */}
      return Response.json({ error: `Python server request failed: ${gpt4freeResponse.status}. Detail: ${detail}` }, { status: gpt4freeResponse.status })
    }

    const dataFromGpt4free = await gpt4freeResponse.json()
    let answer, thinking = null, newConvId = null

    if (isImageRequest) {
     
      const imageUrl = dataFromGpt4free.choices?.[0]?.message?.content || dataFromGpt4free.imageUrl
      if (imageUrl) {
        answer = `${imageUrl}`
      } else {
        answer = "CANT ACCESS THE URL"
        console.error("NO URL:", dataFromGpt4free)
      }
    } else { 
      const rawAssistantContent = dataFromGpt4free.choices?.[0]?.message?.content
      if (rawAssistantContent === undefined) {
        return Response.json({ error: 'NO RESPONSE' }, { status: 500 })
      }
      const parsed = parseAssistantMessage(rawAssistantContent)
      answer = parsed.answer
      thinking = parsed.thinking
      newConvId = dataFromGpt4free.conversation_id || dataFromGpt4free.conversation?.id || dataFromGpt4free.conversation?.userId || conversationId
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