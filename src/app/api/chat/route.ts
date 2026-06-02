import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCharacter } from '@/lib/characters'
import type { ChatRequest } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// 入力の長さに応じた返答スタイル指示と max_tokens を返す
function getResponseGuide(messageLength: number): { instruction: string; maxTokens: number } {
  if (messageLength <= 30) {
    return {
      instruction: `【今回の返答スタイル】相手のメッセージが短い。2〜3文でテンポよく返す。`,
      maxTokens: 200,
    }
  } else if (messageLength <= 100) {
    return {
      instruction: `【今回の返答スタイル】相手のメッセージは中程度。3〜5文で、内容にしっかり反応しながら返す。`,
      maxTokens: 380,
    }
  } else if (messageLength <= 250) {
    return {
      instruction: `【今回の返答スタイル】相手が長めに話してくれた。同じくらいのボリュームで、話してくれた内容を全部受け止めて返す。箇条書き不使用。自然な会話文で。`,
      maxTokens: 650,
    }
  } else {
    return {
      instruction: `【今回の返答スタイル】相手がたくさん話してくれた。それと同じかそれ以上の量で、一つひとつの気持ちをちゃんと受け止めながら返す。「ちゃんと読んでくれてる」と伝わるように。箇条書き不使用。`,
      maxTokens: 1000,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { characterId, message, conversationHistory } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'メッセージが空です' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'メッセージが長すぎます（最大2000文字）' }, { status: 400 })
    }

    const character = getCharacter(characterId)
    if (!character) {
      return NextResponse.json({ error: '無効なキャラクターです' }, { status: 400 })
    }

    const { nickname } = body
    const { instruction, maxTokens } = getResponseGuide(message.length)

    // ニックネーム指示を動的に追加
    const nameInstruction = nickname
      ? `【ユーザーへの呼びかけ】相手のニックネームは「${nickname}」です。会話の中で自然に名前を使って呼んでください。`
      : `【ユーザーへの呼びかけ】相手のニックネームは未設定です。「あなた」と呼ぶか、呼びかけを省いてください。`

    const dynamicSystemPrompt = `${character.systemPrompt}\n\n${nameInstruction}\n\n${instruction}`

    const history = (conversationHistory ?? []).slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // 品質重視の場合: 'claude-sonnet-4-5' に変更可（コスト約4倍）
      max_tokens: maxTokens,
      system: dynamicSystemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    const aiMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'ごめんね、うまく返事できなかった。もう一度話してくれる？'

    return NextResponse.json({ message: aiMessage, characterId })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    )
  }
}
