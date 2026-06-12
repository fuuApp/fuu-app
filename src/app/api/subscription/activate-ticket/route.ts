import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    // ── 認証チェック ──
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const admin = createAdminClient()
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // ── 未使用チケットの確認 ──
    const { data: tickets } = await admin
      .from('tickets')
      .select('id, quantity, used')
      .eq('user_id', user.id)
      .gt('expires_at', now.toISOString())
      .order('purchased_at', { ascending: true })

    const available = tickets?.find(t => t.used < t.quantity)
    if (!available) {
      return NextResponse.json(
        { error: '使用できるチケットがありません。チケットを購入してください。' },
        { status: 400 }
      )
    }

    // ── 月間チケット使用上限チェック（3枚/月）──
    const { data: monthlyUsage } = await admin
      .from('ticket_monthly_usage')
      .select('used_count, monthly_cap')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .single()

    const usedCount = monthlyUsage?.used_count ?? 0
    const monthlyCap = monthlyUsage?.monthly_cap ?? 20
    if (usedCount >= monthlyCap) {
      return NextResponse.json(
        { error: `今月のチケット使用上限（${monthlyCap}枚）に達しています。` },
        { status: 400 }
      )
    }

    // ── チケットを使用済みにする ──
    await admin
      .from('tickets')
      .update({ used: available.used + 1 })
      .eq('id', available.id)

    // ── 月間使用数をインクリメント ──
    await admin
      .from('ticket_monthly_usage')
      .upsert({
        user_id: user.id,
        year_month: yearMonth,
        used_count: usedCount + 1,
        monthly_cap: monthlyCap, // デフォルト20枚/月
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id,year_month' })

    // ── profilesのticket_active_untilを24時間後に設定 ──
    const activeUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    await admin
      .from('profiles')
      .update({ ticket_active_until: activeUntil })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      activeUntil,
      message: 'チケットを有効化しました。24時間使い放題です。',
    })
  } catch (error) {
    console.error('Activate ticket error:', error)
    return NextResponse.json(
      { error: 'チケットの有効化に失敗しました。' },
      { status: 500 }
    )
  }
}
