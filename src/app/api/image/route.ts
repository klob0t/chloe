import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.POLLINATIONS_API_KEY
const IMAGE_ENDPOINT = 'https://image.pollinations.ai/'

export async function POST(request: NextRequest) {
   if (!API_KEY) return NextResponse.json({ error: 'Missing API Key!' })
}