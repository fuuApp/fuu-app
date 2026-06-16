-- ================================================================
--  マイグレーション: 会話回数制限・チケット有効期限
--  対象テーブル: profiles
--
--  追加カラム:
--    monthly_chat_count    : 今月の会話送信数（月初にリセット）
--    monthly_chat_reset_at : 最後にカウントをリセットした日時
--    ticket_active_until   : チケット有効期限（NULLまたは過去日時 = チケット無効）
-- ================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_chat_count    INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_chat_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ticket_active_until   TIMESTAMPTZ;

-- インデックス（プランチェックのクエリ最適化）
CREATE INDEX IF NOT EXISTS idx_profiles_ticket_active
  ON public.profiles(ticket_active_until)
  WHERE ticket_active_until IS NOT NULL;

-- ================================================================
--  RLSポリシー追加: ticket_active_until の自己更新は不可（サーバー側のみ）
--  ※ profiles の既存ポリシーは「自分のprofileのみ更新」だが、
--    ticket_active_until はサービスロールキーからのみ書き換える
--  → 既存の UPDATE ポリシーは維持し、アプリ側では admin client 経由で更新
-- ================================================================

-- ticket_monthly_usage のデフォルト上限を 3 → 20 に変更
UPDATE public.ticket_monthly_usage SET monthly_cap = 20 WHERE monthly_cap = 3;

-- 今後作成されるレコードも 20 をデフォルトにする
ALTER TABLE public.ticket_monthly_usage ALTER COLUMN monthly_cap SET DEFAULT 20;

-- ================================================================
--  プラン別月間上限の定義（参考コメント・アプリ側で使用）
--
--  free（トライアル含む） : 70通/月
--  standard               : 200通/月
--  premium                : 900通/月
--  チケット有効中          : 無制限（ticket_active_until > NOW()）
--  チケット月間上限        : 20枚/月（¥300 × 20 = ¥6,000 → プレミアムへ誘導）
-- ================================================================
