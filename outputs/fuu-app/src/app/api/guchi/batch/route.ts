import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase-server'

/**
 * POST /api/guchi/batch
 * 愚痴お片付けバッチ（夜間自動実行）
 *
 * 動作フロー:
 * 1. 前日の会話 (messages) を取得
 * 2. ユーザーのメッセージを抽出・集約
 * 3. Claude Haiku で「宝箱変換」（ネガティブ → ポジティブ）
 * 4. guchi_journals テーブルに保存
 *
 * 実行タイミング: 毎晩23:30 JST (Supabase pg_cron / Vercel Cron で定時実行)
 *
 * Vercel Cron設定 (vercel.json):
 * {
 *   "crons": [{ "path": "/api/guchi/batch", "schedule": "30 14 * * *" }]
 * }
 * ※ Vercel Cronは UTC基準。14:30 UTC = 23:30 JST
 *
 * 管理者シークレットまたは Vercel Cron ヘッダーで保護。
 */

function yesterdayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  jst.setDate(jst.getDate() - 1)
  return jst.toISOString().slice(0, 10)
}

function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

const REFRAME_PROMPT = `あなたは感情の「宝箱職人」です。
ユーザーが昨日話した内容を受け取り、それを「宝箱」形式に変換してください。

ルール:
- 愚痴や不満をそのまま否定せず、温かく受け止める
- 「あなたはこんなに頑張っていた」という視点で再フレーミングする
- 絵文字を2〜3個使って温かみを出す
- 150文字以内で完結させる

出力形式（必ずこの形式で）:
✨ [ポジティブな再フレーミング文]`

async function generateReframe(client: Anthropic, content: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `昨日の会話内容:\n${content}\n\n上記を宝箱形式に変換してください。`,
      },
    ],
    system: REFRAME_PROMPT,
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return text.trim() || '✨ 昨日もよく頑張ったね。今日もあなたを応援してるよ 🌸'
}

export async function POST(req: NextRequest) {
  // 認証: Vercel Cron ヘッダー or 管理者シークレット
  const authHeader = req.headers.get('Authorization')
  const adminSecret = process.env.ADMIN_SECRET
  const isCron = req.headers.get('x-vercel-cron') === '1' ||
    authHeader === `Bearer ${adminSecret}`

  if (!isCron) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: 'Anthropic APIキーが設定されていません' }, { status: 503 })
  }

  const client = new Anthropic({ apiKey: anthropicKey })
  const supabase = createAdminClient()

  const yesterday = yesterdayJST()
  const today = todayJST()

  try {
    // 昨日会話があったユーザーの conversation_id 一覧を取得
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .gte('last_message_at', `${yesterday}T00:00:00+09:00`)
      .lt('last_message_at', `${today}T00:00:00+09:00`)

    if (convError) {
      console.error('Conversations fetch error:', convError)
      return NextResponse.json({ error: '会話取得失敗' }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, message: '対象会話なし' })
    }

    // ユーザーごとにグループ化
    const userConvMap = new Map<string, string[]>()
    for (const conv of conversations) {
      if (!userConvMap.has(conv.user_id)) userConvMap.set(conv.user_id, [])
      userConvMap.get(conv.user_id)!.push(conv.id)
    }

    let processed = 0
    let skipped = 0

    for (const [userId, convIds] of userConvMap.entries()) {
      // 既にジャーナルが作成済みならスキップ（UNIQUE(user_id, date) 制約）
      const { data: existing } = await supabase
        .from('guchi_journals')
        .select('id')
        .eq('user_id', userId)
        .eq('date', yesterday)
        .single()

      if (existing) {
        skipped++
        continue
      }

      // ユーザーのメッセージのみ取得
      const { data: messages } = await supabase
        .from('messages')
        .select('content, created_at')
        .in('conversation_id', convIds)
        .eq('role', 'user')
        .gte('created_at', `${yesterday}T00:00:00+09:00`)
        .lt('created_at', `${today}T00:00:00+09:00`)
        .order('created_at', { ascending: true })

      if (!messages || messages.length === 0) {
        skipped++
        continue
      }

      // 会話内容を結合（最大1000文字）
      const originalContent = messages
        .map(m => m.content)
        .join('\n')
        .slice(0, 1000)

      try {
        const reframed = await generateReframe(client, originalContent)

        await supabase.from('guchi_journals').insert({
          user_id: userId,
          conversation_id: convIds[0],  // 代表会話
          date: yesterday,
          original_content: originalContent,
          reframed,
        })

        processed++
      } catch (err) {
        console.error(`Reframe failed for user ${userId}:`, err)
        // 失敗しても他のユーザーの処理を継続
      }

      // レート制限対策: 処理間に少し待機
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({
      ok: true,
      date: yesterday,
      processed,
      skipped,
      total: userConvMap.size,
    })
  } catch (error) {
    console.error('Guchi batch error:', error)
    return NextResponse.json({ error: 'バッチ処理エラー' }, { status: 500 })
  }
}
