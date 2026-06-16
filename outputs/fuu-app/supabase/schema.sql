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

-- ================================================================
--  退会後データ削除用ポリシー（90日後に自動削除）
--  ※ Supabase pg_cron 拡張が必要
-- ================================================================
-- SELECT cron.schedule(
--   'delete-expired-users',
--   '0 3 * * *',  -- 毎日午前3時
--   $$
--     DELETE FROM public.messages
--     WHERE user_id IN (
--       SELECT id FROM auth.users
--       WHERE deleted_at < NOW() - INTERVAL '90 days'
--     );
--   $$
-- );

-- ================================================================
--  確認用クエリ（実行後に確認）
-- ================================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
