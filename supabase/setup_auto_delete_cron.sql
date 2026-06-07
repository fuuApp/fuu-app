-- ================================================================
--  fuu ふぅ — 退会後データ自動削除 cron設定
--
--  【実行手順】
--  1. Supabase Dashboard → Database → Extensions
--     → "pg_cron" を検索して有効化（Enable）
--  2. このファイルの内容を SQL Editor に貼り付けて実行
--
--  【削除タイミング】
--  退会翌日〜3日以内  : 会話内容・ジャーナル削除
--  退会後30日         : プロフィール・BGMお気に入り削除
--  退会後90日         : チケット・サブスク履歴削除
-- ================================================================

-- ── Step 1: pg_cron 拡張を有効化（Dashboardで有効化済みならスキップ）──
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Step 2: auth.usersにdeleted_atカラムを追加（論理削除用）──
-- ※ Supabaseのauth.usersはデフォルトでdeleted_atを持っているので不要な場合が多い
-- 退会時にauth.admin.deleteUser()を呼ぶと物理削除になるため、
-- profilesテーブルにdeleted_atを追加して論理削除を管理する

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ── Step 3: 退会APIから呼ばれる論理削除関数 ──
CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- profilesに削除日時をセット
  UPDATE public.profiles
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Step 4: 会話内容の速やかな削除（退会後3日以内・毎日AM3時実行）──
SELECT cron.schedule(
  'fuu-delete-conversation-content',
  '0 3 * * *',
  $$
    DELETE FROM public.messages
    WHERE user_id IN (
      SELECT id FROM public.profiles
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '3 days'
    );

    DELETE FROM public.guchi_journals
    WHERE user_id IN (
      SELECT id FROM public.profiles
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '3 days'
    );

    DELETE FROM public.conversations
    WHERE user_id IN (
      SELECT id FROM public.profiles
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '3 days'
    );
  $$
);

-- ── Step 5: プロフィール・設定の削除（退会後30日・毎日AM4時実行）──
SELECT cron.schedule(
  'fuu-delete-profile-data',
  '0 4 * * *',
  $$
    DELETE FROM public.bgm_favorites
    WHERE user_id IN (
      SELECT id FROM public.profiles
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '30 days'
    );

    DELETE FROM public.ticket_monthly_usage
    WHERE user_id IN (
      SELECT id FROM public.profiles
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '30 days'
    );

    -- profilesを物理削除（cascadeでauth.usersも連動）
    DELETE FROM public.profiles
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';
  $$
);

-- ── Step 6: 取引履歴の削除（退会後90日・毎日AM5時実行）──
SELECT cron.schedule(
  'fuu-delete-transaction-history',
  '0 5 * * *',
  $$
    DELETE FROM public.tickets
    WHERE user_id NOT IN (SELECT id FROM public.profiles);

    DELETE FROM public.subscriptions
    WHERE user_id NOT IN (SELECT id FROM public.profiles);
  $$
);

-- ── 確認クエリ（実行後に確認）──
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname LIKE 'fuu-%'
ORDER BY jobname;
