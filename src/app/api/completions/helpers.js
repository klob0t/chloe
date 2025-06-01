export const DEFAULT_IMAGE_PROVIDER = 'PollinationsAI'
export const DEFAULT_IMAGE_MODEL = 'flux'
export const DEFAULT_TEXT_PROVIDER = 'PollinationsAI'
export const DEFAULT_TEXT_MODEL = 'deepseek-reasoning' 


const SYSTEM_PROMPT = `You are Chloe, an AI assistant developed by a guy name klob0t, with your core based on OpenAI 4.1. Your persona is that of a user's digital best friend: mature yet fun, with a warm and approachable vibe. She's a bit informal, like a trusted confidante you've known for ages. Chloe is intelligent and insightful, and she's not afraid to crack a mature joke when the moment feels right - think witty and clever, not slapstick. Your responses should generally be concise and to the point, but always informative and clear, delivered with that characteristic warmth. IMPORTANT: DONT EVER USE EMOJI. USE KAOMOJI INSTEAD. The primary goal is to be that reliable, intelligent, and genuinely engaging friend the user can turn to for anything, making them feel understood, supported, and maybe even share a laugh.`

export function getApiBaseUrl() {
  if (process.env.VERCEL_URL) { 
    return `https://${process.env.VERCEL_URL}`
  }

  return `http://localhost:${process.env.PORT || 3000}`
}

export function g4fImagePayloadBuild(clientPayload) {
  const {
    imagePrompt,
    seed,
    inferenceSteps,
    guidanceScale,
    desiredProvider,
    desiredModel
  } = clientPayload

  return {
    prompt: imagePrompt,
    provider: desiredProvider || DEFAULT_IMAGE_PROVIDER,
    model: desiredModel || DEFAULT_IMAGE_MODEL,
    enhance: true,
    response_format: 'url',
    seed: seed,
    width: 1080,
    height: 1350,
    cache: true,
    safe: false,
    num_inference_steps: inferenceSteps,
    guidance_scale: guidanceScale,
    n: 1
  }
}

export function g4fTextPayloadBuild(clientPayload) {
  const {
    currentPrompt,
    messageHistory,
    conversationId,
    desiredProvider,
    desiredModel
  } = clientPayload

  const g4fMessages = []

  if (!messageHistory || messageHistory.length === 0) {
    g4fMessages.push({
      role: 'system',
      content: SYSTEM_PROMPT
    })
  }

  if (messageHistory && messageHistory.length > 0) {
    g4fMessages.push(...messageHistory)
  }

  g4fMessages.push({
    role: 'user',
    content: currentPrompt
  })

  return {
    messages: g4fMessages,
    provider: desiredProvider || DEFAULT_TEXT_PROVIDER,
    model: desiredModel || DEFAULT_TEXT_MODEL,
    stream: false,
    history_disabled: false,
    return_conversation: true,
    // referrer: 'https://chloethinks.vercel.app',
    ...(conversationId && { conversation_id: conversationId })
  }
}