-- ================================================================
--  fuu ふぅ  Supabase スキーマ定義 v1.0
--  Supabase SQL Editor に貼り付けて実行してください
--  実行順序: このファイルを上から順に実行
-- ================================================================

-- ── 拡張機能 ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── プロファイルテーブル ──────────────────────────────────────
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  plan                TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'standard', 'premium')),
  trial_end_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 days'),
  stripe_customer_id  TEXT UNIQUE,
  push_token          TEXT,
  notification_time   TIME DEFAULT '21:00',  -- 朝夜ボイス通知時刻（夜）
  morning_time        TIME DEFAULT '07:00',  -- 朝ボイス通知時刻
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 会話テーブル ──────────────────────────────────────────────
CREATE TABLE public.conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id     TEXT NOT NULL
                     CHECK (character_id IN ('aoi','sakura','rika','natsuko','kenji','hiroshi')),
  title            TEXT,
  last_message_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── メッセージテーブル ────────────────────────────────────────
-- ※ 本番環境ではColumn-Level Encryption (Supabase Vault) を推奨
CREATE TABLE public.messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  is_voice         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 愚痴ジャーナル（愚痴お片付けバッチ出力）────────────────
CREATE TABLE public.guchi_journals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id  UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  original_content TEXT NOT NULL,  -- 昨日の愚痴サマリー
  reframed         TEXT NOT NULL,  -- 「宝箱」に変換したテキスト
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── サブスクリプションテーブル ────────────────────────────────
CREATE TABLE public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id   TEXT UNIQUE NOT NULL,
  plan                     TEXT NOT NULL CHECK (plan IN ('standard', 'premium')),
  status                   TEXT NOT NULL
                             CHECK (status IN ('active','canceled','past_due','trialing','incomplete')),
  current_period_end       TIMESTAMPTZ NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── チケットテーブル ──────────────────────────────────────────
CREATE TABLE public.tickets (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity                 INTEGER NOT NULL DEFAULT 1,
  used                     INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  purchased_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year')
);

-- ── BGMお気に入りテーブル ──────────────────────────────────────
-- ユーザーがお気に入り登録したBGMは月次の曲入れ替え後も保持される。
-- bgm_id は /public/bgm/ 以下のファイル名（拡張子なし）を使う。
CREATE TABLE public.bgm_favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bgm_id     TEXT NOT NULL,           -- 例: 'chill_01', 'morning_02' など
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bgm_id)             -- 同じ曲を二重登録しない
);

-- ── チケット月間使用量追跡テーブル ───────────────────────────────
-- ¥300チケットの月間使用枚数上限を管理する。
-- 月が変わるたびに新レコードが作られ、used_count が上限に達したら購入・使用をブロックする。
CREATE TABLE public.ticket_monthly_usage (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year_month   TEXT NOT NULL,         -- 例: '2026-05'（YYYY-MM形式）
  used_count   INTEGER NOT NULL DEFAULT 0,
  -- 月間上限: 運営側が定める上限（デフォルト3枚）
  monthly_cap  INTEGER NOT NULL DEFAULT 3,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year_month)
);

-- ================================================================
--  Row Level Security（RLS）
-- ================================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のprofileのみ参照" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "自分のprofileのみ更新" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の会話のみ参照" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分の会話のみ作成" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分の会話のみ更新" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "自分の会話のみ削除" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のメッセージのみ参照" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のメッセージのみ作成" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- guchi_journals
ALTER TABLE public.guchi_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のジャーナルのみ参照" ON public.guchi_journals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のジャーナルのみ作成" ON public.guchi_journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のサブスクのみ参照" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のチケットのみ参照" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id);

-- bgm_favorites
ALTER TABLE public.bgm_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のBGMお気に入りのみ参照" ON public.bgm_favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のBGMお気に入りのみ追加" ON public.bgm_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のBGMお気に入りのみ削除" ON public.bgm_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ticket_monthly_usage
ALTER TABLE public.ticket_monthly_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の月間使用量のみ参照" ON public.ticket_monthly_usage
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
--  トリガー: 新規ユーザー登録時に profiles を自動作成
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_end_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW() + INTERVAL '10 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
--  トリガー: updated_at 自動更新
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ================================================================
--  インデックス（パフォーマンス最適化）
-- ================================================================
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(user_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_guchi_journals_user_date ON public.guchi_journals(user_id, date DESC);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_bgm_favorites_user_id ON public.bgm_favorites(user_id);
CREATE INDEX idx_ticket_monthly_usage_user_month ON public.ticket_monthly_usage(user_id, year_month DESC);

-- ================================================================
--  退会後データ削除ポリシー（段階的削除）
--  ※ Supabase pg_cron 拡張が必要（Dashboard > Database > Extensions から有効化）
--
--  削除タイミングの仕様（⑨ プライバシーポリシーに対応）:
--
--  【退会当日】
--    - auth.users を論理削除（deleted_at をセット）
--    - セッション・アクセストークンを即時無効化
--    - subscriptions を canceled に更新（Stripe側もキャンセル）
--
--  【退会翌日 → 3日以内】
--    - messages（会話内容）を削除
--    - guchi_journals（愚痴ジャーナル）を削除
--    ※ プライバシーポリシーには「会話内容は退会後速やかに削除」と明記
--
--  【退会後30日】
--    - profiles（会員情報）を削除
--    - bgm_favorites / ticket_monthly_usage を削除
--    ※ Stripe側の請求履歴や問い合わせ対応に必要なため30日間保持
--
--  【退会後90日】
--    - tickets（購入履歴）を削除
--    - subscriptions（サブスク履歴）を削除
--    ※ 法的な取引記録として90日間保持が望ましい
--
-- ================================================================

-- 会話内容の速やかな削除（退会後3日以内）
-- SELECT cron.schedule(
--   'delete-conversation-content',
--   '0 3 * * *',
--   $$
--     DELETE FROM public.messages
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '3 days'
--     );
--     DELETE FROM public.guchi_journals
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '3 days'
--     );
--   $$
-- );

-- 会員情報の削除（退会後30日）
-- SELECT cron.schedule(
--   'delete-profile-data',
--   '0 4 * * *',
--   $$
--     DELETE FROM public.bgm_favorites
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
--     );
--     DELETE FROM public.ticket_monthly_usage
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
--     );
--     DELETE FROM public.profiles
--     WHERE id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'
--     );
--   $$
-- );

-- 取引履歴の削除（退会後90日）
-- SELECT cron.schedule(
--   'delete-transaction-history',
--   '0 5 * * *',
--   $$
--     DELETE FROM public.tickets
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days'
--     );
--     DELETE FROM public.subscriptions
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days'
--     );
--   $$
-- );

-- ================================================================
--  確認用クエリ（実行後に確認）
-- ================================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
