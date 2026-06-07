# fuu ふぅ プロジェクト状態メモ
## 最終更新：2026-06-07

## 仕様書
- 最新：fuu_master_spec_v13.docx（プロジェクトルート）
- 本番URL：https://fuu-app.vercel.app（デプロイ済）

## 技術スタック
- Next.js 14 + TypeScript + Tailwind
- Supabase（認証・DB）: https://xlzkewwcbihzddnchtdk.supabase.co
- Stripe（決済）：未設定
- Anthropic Claude Haiku（AI チャット）
- Capacitor v6（iOS/Android ラッパー）

## 環境
- .env.local：Supabase URL/Keys・Anthropic Key 設定済
- Vercel 環境変数：ANTHROPIC_API_KEY 未設定（要設定）

## Android ビルド状態
- Android Studio：セットアップ完了
- Gradle：8.9-bin（Java 21対応）
- SDK：API 34（compileSdkVersion）、API 37のエミュレータ使用中
- Zscaler 対応：
  - JDK cacerts に Zscaler Root CA インポート済
  - network_security_config.xml でユーザー証明書を信頼するよう設定済
  - エミュレータに zscaler.pem インストール済
- ビルド・実行：動作確認済（ログイン・OTP・チャット画面表示）

## 現在の問題
- チャット API（/api/chat）がローカル静的ビルドでは動かない
  → Capacitor の server.url を Vercel に向けるか、Vercel 側の API を使う必要あり
- BGM：未確認（API 問題と同根の可能性）

## 残タスク（v13仕様書より）
- [ ] Vercel 環境変数に ANTHROPIC_API_KEY 設定
- [ ] ENCRYPTION_KEY 生成・設定（node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"）
- [ ] statement_descriptor 設定（Stripe Dashboard）
- [ ] pg_cron 有効化（Supabase）
- [ ] 特商法ページ実名更新
- [ ] fuu.support@gmail.com 取得
- [ ] Stripe 本番設定
- [ ] iOS ビルド（Xcode + Apple Developer 連携済）

## iOS ビルド状態
- Xcode インストール済
- Apple ID 連携済
- ビルドは未実施

## アイコン
- ログイン画面：/public/icons/icon_c.png（三日月・センター）に変更済
- アプリアイコン：ios/android 用は assets.xcassets/AppIcon にデフォルトのまま

## ファイル構成メモ
- Next.js ソース：プロジェクトルート（src/）
- Android：android/
- iOS：ios/
- ビルド出力：out/
- 過去の出力物：outputs/
