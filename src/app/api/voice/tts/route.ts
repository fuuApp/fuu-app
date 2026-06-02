import { NextRequest, NextResponse } from 'next/server'

const VOICE_MAP: Record<string, string> = {
  aoi: 'nova', sakura: 'shimmer', rika: 'alloy',
  natsuko: 'fable', kenji: 'onyx', hiroshi: 'echo',
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません' }, { status: 503 })
  }
  try {
    const { text, characterId } = await req.json()
    if (!text) {
      return NextResponse.json({ error: 'テキストがありません' }, { status: 400 })
    }
    const voice = VOICE_MAP[characterId] ?? 'nova'
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4096), voice, response_format: 'mp3' }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('TTS API error:', err)
      return NextResponse.json({ error: 'TTS処理に失敗しました' }, { status: 502 })
    }
    const audioBuffer = await res.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(audioBuffer.byteLength) },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
