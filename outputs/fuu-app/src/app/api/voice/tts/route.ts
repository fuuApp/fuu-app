import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/voice/tts
 * テキスト → 音声 (OpenAI TTS プロキシ)
 *
 * Request: { text: string, characterId: string }
 * Response: audio/mpeg stream
 *
 * キャラクター別ボイス設定:
 * - kenji, hiroshi（男性）: onyx
 * - その他（女性）: nova
 */

const CHARACTER_VOICE: Record<string, string> = {
  kenji: 'onyx',
  hiroshi: 'onyx',
  aoi: 'nova',
  sakura: 'shimmer',
  rika: 'alloy',
  natsuko: 'nova',
}

const MAX_TEXT_LENGTH = 500  // 長すぎるテキストを防ぐ

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません' }, { status: 503 })
  }

  try {
    const { text, characterId } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'テキストがありません' }, { status: 400 })
    }

    const trimmedText = text.slice(0, MAX_TEXT_LENGTH)
    const voice = CHARACTER_VOICE[characterId] ?? 'nova'

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: trimmedText,
        voice,
        speed: 1.0,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('TTS API error:', err)
      return NextResponse.json({ error: 'TTS処理に失敗しました' }, { status: 502 })
    }

    // 音声データをそのままストリームで返す
    const audioBuffer = await res.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
