import { NextRequest, NextResponse } from "next/server"

const DEFAULT_MODEL = process.env.POLLINATIONS_IMAGE_MODEL || 'gptimage'
const DEFAULT_WIDTH = Number(process.env.POLLINATIONS_IMAGE_WIDTH ?? 1080)
const DEFAULT_HEIGHT = Number(process.env.POLLINATIONS_IMAGE_HEIGHT ?? 1350)
const IMAGE_BASE_URL = process.env.POLLINATIONS_IMAGE_BASE_URL || 'https://image.pollinations.ai/prompt/'
const MAX_RETRIES = Number(process.env.POLLINATIONS_IMAGE_RETRIES ?? 1)
const API_KEY = process.env.POLLINATIONS_API_KEY

interface ImageRequestPayload {
   imagePrompt?: string
   prompt?: string
   seed?: number | string
   guidanceScale?: number | string
   inferenceSteps?: number | string
   desiredModel?: string
   width?: number | string
   height?: number | string
}

const normaliseNumber = (value: number | string | undefined) => {
   if (value === undefined || value === null) return undefined
   const parsed = typeof value === 'string' ? Number(value) : value
   return Number.isFinite(parsed) ? Number(parsed) : undefined
}

export async function POST(request: NextRequest) {
   try {
      const body = (await request.json()) as ImageRequestPayload
      const rawPrompt = (body.imagePrompt ?? body.prompt ?? '').toString().trim()

      if (!rawPrompt) {
         return NextResponse.json({ error: 'Image prompt is required.' }, { status: 400 })
      }

      const model = body.desiredModel || DEFAULT_MODEL
      const width = normaliseNumber(body.width) ?? DEFAULT_WIDTH
      const height = normaliseNumber(body.height) ?? DEFAULT_HEIGHT
      const seed = normaliseNumber(body.seed)
      const steps = normaliseNumber(body.inferenceSteps)
      const guidance = normaliseNumber(body.guidanceScale)

      const requestUrl = new URL(IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL : `${IMAGE_BASE_URL}/`)
      requestUrl.pathname += encodeURIComponent(rawPrompt)

      if (model) requestUrl.searchParams.set('model', model)
      if (width) requestUrl.searchParams.set('width', width.toString())
      if (height) requestUrl.searchParams.set('height', height.toString())
      if (seed !== undefined) requestUrl.searchParams.set('seed', seed.toString())
      if (steps !== undefined) requestUrl.searchParams.set('steps', steps.toString())
      if (guidance !== undefined) requestUrl.searchParams.set('guidance', guidance.toString())
      requestUrl.searchParams.set('enhance', 'true')
      requestUrl.searchParams.set('safe', 'false')
      requestUrl.searchParams.set('logo', 'false')
      requestUrl.searchParams.set('nologo', 'true')
      requestUrl.searchParams.set('aspect', '4:5')

      const attemptFetch = async () => {
         const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
               Accept: 'image/*',
               ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
            },
            cache: 'no-store'
         })

         if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Pollinations image request failed (${response.status}): ${errorText}`)
         }

         const arrayBuffer = await response.arrayBuffer()
         const buffer = Buffer.from(arrayBuffer)
         const base64 = buffer.toString('base64')
         return {
            dataUrl: `data:${response.headers.get('content-type') ?? 'image/png'};base64,${base64}`
         }
      }

      let result: { dataUrl: string } | null = null
      let attempts = 0
      let lastError: unknown = null

      while (attempts <= MAX_RETRIES) {
         try {
            result = await attemptFetch()
            break
         } catch (error) {
            lastError = error
            attempts += 1
            if (attempts > MAX_RETRIES) {
               break
            }
         }
      }

      if (!result) {
         console.error('Pollinations image request failed for prompt:', rawPrompt)
         console.error('Request URL:', requestUrl.toString())
         console.error('Error detail:', lastError)
         return NextResponse.json({
            error: 'Image generation request failed',
            details: lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error')
         }, { status: 502 })
      }

      return NextResponse.json({
         response: result.dataUrl,
         metadata: {
            provider: 'pollinations',
            model,
            width,
            height,
            seed,
            inferenceSteps: steps,
            guidanceScale: guidance,
            source: requestUrl.toString()
         }
      })
   } catch (error) {
      console.error('Unexpected error in image route:', error)
      return NextResponse.json({ error: 'Unexpected error in image generation route' }, { status: 500 })
   }
}
