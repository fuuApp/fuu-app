import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません' }, { status: 503 })
  }
  try {
    const formData = await req.formData()
    const audioFile = formData.get('file') as Blob | null
    if (!audioFile) {
      return NextResponse.json({ error: '音声ファイルがありません' }, { status: 400 })
    }
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: '音声ファイルが大きすぎます' }, { status: 400 })
    }
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'ja')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('Whisper API error:', err)
      return NextResponse.json({ error: 'STT処理に失敗しました' }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ text: data.text ?? '' })
  } catch (error) {
    console.error('STT error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
