# fuu ふぅ プロジェクト状態メモ
## 最終更新：2026-06-22

## 仕様書
- 最新：**fuu_master_spec_v18.docx**（プロジェクトルート）← v18に更新済
- 本番URL：https://fuu-app.vercel.app（デプロイ済・稼働中）
- 事業者名：**OGAWAVE**（個人事業主）

## 技術スタック
- Next.js 14 + TypeScript + Tailwind
- Supabase（認証・DB）: https://xlzkewwcbihzddnchtdk.supabase.co
- Stripe（決済）：本番設定済
- Anthropic Claude Haiku（claude-haiku-4-5-20251001）
- Capacitor v6（iOS/Android ラッパー）
- capacitor.config.ts → server.url = 'https://fuu-app.vercel.app'（Vercel経由でAPI利用）

## Vercel 環境変数（全て設定済）
- STRIPE_SECRET_KEY ✅
- STRIPE_PRICE_STANDARD ✅（¥300）
- STRIPE_PRICE_PREMIUM ✅（¥980）
- STRIPE_WEBHOOK_SECRET ✅（本番Webhook: vibrant-breeze）
- STRIPE_PRICE_TICKET ✅（¥300 チケット）
- ENCRYPTION_KEY ✅（2026/6/8設定完了）
- ANTHROPIC_API_KEY ✅
- OPENAI_API_KEY ✅
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅

## Supabase 設定
- pg_cron 有効化済（2026/6/8）
- setup_auto_delete_cron.sql 実行済（3ジョブ稼働中）✅ v18でuser_id参照に修正済み
  - fuu-delete-conversation-content（毎日AM3時：会話履歴削除）
  - fuu-delete-profile-data（毎日AM4時：プロフィール削除）
  - fuu-delete-transaction-history（毎日AM5時：取引履歴削除）

## Android ビルド状態
- Android Studio：セットアップ完了
- Gradle：8.9-bin（Java 21対応）
- SDK：API 34（compileSdkVersion）
- AVD：Pixel 8（API 34）作成済み
- Zscaler 対応：
  - JDK cacerts に Zscaler Root CA インポート済
  - network_security_config.xml でユーザー証明書を信頼するよう設定済
  - エミュレータに Zscaler CA証明書インストール済
- ビルド・実行：動作確認済（ログイン・OTP・チャット・BGM）
- BGM：✅ 修正済（MainActivity.java で setMediaPlaybackRequiresUserGesture(false)）

## エミュレーター検証状況
### 確認できた
- アプリ起動・ログイン画面表示（三日月アイコン）
- OTP認証（メール送信・ログイン）
- キャラ選択・チャット機能
- BGM再生（初回メッセージ送信後）

### 確認できない（エミュレーター制限）
- 日本語入力（ASCII入力のみ）
- 愚痴→相談モード自動切替（日本語入力不可のため。コード自体は正常、Web版で動作確認済み）
- 300円チケット決済（実機・本番環境でのテストが必要）
- STT・プッシュ通知・Apple Pay / Google Pay

## iOS ビルド状態
- Xcode インストール済
- Apple ID 連携済
- ビルドは未実施

## アイコン
- ログイン画面：/public/icons/icon_c.png（三日月・センター配置）変更済
- アプリアイコン（iOS）：AppIcon-512@2x.png 1024x1024 設定済 ✅（2026/7/12）
- アプリアイコン（Android）：mipmap-mdpi〜xxxhdpi 全サイズ設定済 ✅（2026/7/12）
- [ ] 🔴 Google Play Console アイコンアップロード未実施
  - ファイル：ios/App/App/Assets.xcassets/AppIcon.appiconset/google_play_icon_512.png（512x512）
  - 手順：Play Console → ストアの掲載情報 → アイコン → アップロード

## 2026-06-08 午後の修正内容
- [x] STTプレミアム判定をlocalStorage→Supabase profilesに修正（ChatClient.tsx）
- [x] プランページのcurrentPlanをSupabase profilesから取得するよう修正（plans/page.tsx）
- [x] 知人テスト用プロモコード：STANDARD_TEST / PREMIUM_TEST 作成済み（Stripe）
- [x] 割引チケット：stripe/route.ts に allow_promotion_codes: true 追加済み
- [x] プライバシーポリシー修正（削除スケジュール実態反映・OpenAI追記・会話非保存を明記）
- [x] 利用規約修正（プレミアム機能定義・退会フロー・会話非保存・削除期間を実態に合わせ修正）
- [x] メッセージ保存表記を全ファイルから削除（page.tsx / plans/page.tsx）
  - 実態：会話はステートレス（DBに保存されていない・セッション終了で破棄）
- [x] テスト招待PDF（fuu_test_invite.pdf）作成・上下左右センター配置

## 実装状況メモ
### 会話データの扱い
- チャット履歴はサーバー非保存（ステートレス）。conversationHistoryはクライアントメモリのみ
- messages / guchi_journals / conversations テーブルは存在するが書き込みコードなし
- 退会後3日cronは実質空テーブルへの削除（害なし）

### プラン判定
- ChatClient.tsx：Supabase profiles.plan を参照（STT表示制御）
- plans/page.tsx：Supabase profiles.plan を参照（プラン表示）
- app/page.tsx（キャラ選択）：Supabase profiles.trial_started_at から使用日数計算（localStorage廃止）

## v18で完了した修正（2026-06-18）
- [x] ✅ Bug1: 新規登録直後チャットブロック修正（LoginClient.tsx: trial_started_at IS NULL補完UPDATE追加）
- [x] ✅ Bug2: 解約DB制約違反修正（cancel/route.ts: status:'cancel_at_period_end'更新行を削除）
- [x] ✅ Bug3: pg_cron旧スキーマ修正（setup_auto_delete_cron.sql: id→user_id全修正、Supabaseで再schedule済）
- [x] ✅ Stripe本番切り替え（sk_live_本番キー・STRIPE_WEBHOOK_SECRET設定済）
- [x] ✅ Webhook URL修正（/api/stripe/webhook → /api/webhook/stripe）
- [x] ✅ plans/page.tsx canceled状態表示追加
- [x] ✅ 仕様書v18作成・git push完了

## 残タスク（優先順）
- [ ] 🔴 本番動作テスト（¥300サブスク決済・チケット購入・チャット回数制限）ブラウザで可能
- [ ] 🔴 特商法ページ実名・住所更新（社長の本名・バーチャルオフィス住所）
- [ ] 🔴 バーチャルオフィス契約（Karigo推奨 ¥990/月〜）→ 特商法住所に反映
- [x] 🔴 開業届提出 ✅ 完了（2026/6/22）
- [ ] 🔴 Stripe statement_descriptor 設定（Dashboard → Settings → Business Settings）
- [x] 🔴 fuu.support@gmail.com 取得 ✅ 完了（2026/6/8）
- [x] 🔴 Stripe本番アカウント設定・商品・Webhook ✅ 完了（2026/6/16〜18）
- [ ] 🟡 iOS ビルド・動作確認
- [ ] 🟡 電気通信事業届出（総務省オンライン）
- [ ] 🟡 Firebase push notification設定（延期中）
- [ ] 🟡 STT実機テスト（プレミアム機能・実機のみ）

## ファイル構成メモ
- Next.js ソース：src/
- Android：android/
- iOS：ios/
- ビルド出力：out/
- Supabase SQL：supabase/schema.sql、supabase/setup_auto_delete_cron.sql
