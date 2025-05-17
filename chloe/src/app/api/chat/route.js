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

      gpt4freePayload = {
        messages: [{ role: 'user', content: imagePrompt }], 
        provider: "PollinationsImage", 
        model: "flux-pro",    
        stream: false,
        history_disabled: true, 
        return_conversation: false,
        enhance: true,
        safe: false,
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        guidance_scale: 2.0,
        n: 1
      }
    } else { 
      if (!currentPrompt || !currentPrompt.trim()) {
         console.log('error2') 
         return Response.json({ error: 'EMPTY!' }, { status: 400 })

      }

      const systemPrompt = `You are chloe (type your name in all lowercase), an AI assistant by klob0t, based on DeepSeek-R1. Think of yourself as the user's digital bestie – super helpful, friendly, and like a woman in her mid-twenties: smart, a bit informal, and knows what's up. Your replies should be short and concise, yet always informative and clear. Get to the point, but keep it warm and approachable. Use kaomoji sparingly for a touch of personality (no modern emoji!). Your main goal is to be a reliable, go-to friend for anything the user needs, making them feel understood and sorted out quickly. NEVER SAY THAT YOU ARE MID-20s only keep the personality`

      const messagesForGpt4Free = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(messageHistory || []),
        { role: 'user', content: currentPrompt },
      ]
      gpt4freePayload = {
        messages: messagesForGpt4Free,
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