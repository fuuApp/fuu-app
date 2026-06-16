-- ================================================================
--  fuu ふぅ — guchi_journals に character_id カラムを追加
--
--  【実行手順】
--  Supabase Dashboard → SQL Editor にこのファイルの内容を貼り付けて実行
--
--  【変更内容】
--  1. character_id カラム追加（既存レコードは 'unknown' で埋める）
--  2. UNIQUE制約を (user_id, date) → (user_id, date, character_id) に変更
--     ※ キャラクターごとに1日1件保存できるようになる
-- ================================================================

-- 1. character_id カラム追加
ALTER TABLE guchi_journals
  ADD COLUMN IF NOT EXISTS character_id TEXT NOT NULL DEFAULT 'unknown';

-- 2. 既存のUNIQUE制約を削除（制約名はSupabaseのデフォルト名）
--    ※ 制約名が違う場合は下記で確認してから実行：
--    SELECT constraint_name FROM information_schema.table_constraints
--    WHERE table_name = 'guchi_journals' AND constraint_type = 'UNIQUE';
ALTER TABLE guchi_journals
  DROP CONSTRAINT IF EXISTS guchi_journals_user_id_date_key;

-- 3. 新しいUNIQUE制約を追加（user_id + date + character_id で一意）
ALTER TABLE guchi_journals
  ADD CONSTRAINT guchi_journals_user_id_date_character_id_key
  UNIQUE (user_id, date, character_id);
