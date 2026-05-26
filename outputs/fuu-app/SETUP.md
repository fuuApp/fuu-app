# fuu ふぅ セットアップ手順書

ゼロから開発環境を立ち上げるための手順です。
社長が各サービスのアカウントを作り、APIキーを取得した後にこの手順を進めてください。

---

## 事前準備：アカウント作成が必要なサービス

| サービス | 用途 | URL | 費用目安 |
|----------|------|-----|----------|
| Supabase | DB・認証 | https://supabase.com | 無料プランでスタート可 |
| Anthropic | Claude Haiku API | https://console.anthropic.com | 従量課金（月数百円〜） |
| Stripe | 決済 | https://stripe.com/jp | 手数料3.6%のみ |
| Vercel | ホスティング | https://vercel.com | 無料プランでスタート可 |
| OpenAI | 音声（Phase2） | https://platform.openai.com | Phase2まで不要 |

---

## Step 1：Supabase プロジェクト作成

```
1. https://supabase.com でアカウント作成
2. "New project" → プロジェクト名: fuu-production
3. データベースパスワードを保存（後で使えない）
4. リージョン: Northeast Asia（Tokyo）を選択
5. Project Settings > API から以下を控える：
   - Project URL
   - anon public key
   - service_role key（絶対に公開しないこと）
```

### Supabase スキーマ実行

```
1. Supabase Dashboard > SQL Editor を開く
2. fuu-app/supabase/schema.sql の内容をコピペして実行
3. 成功したら Table Editor でテーブル一覧を確認：
   - profiles / conversations / messages / guchi_journals / subscriptions / tickets
```

### Supabase 認証設定

```
Authentication > Providers から以下を有効化：
1. Email（デフォルトで有効）
   - Confirm email: ON（メール認証あり）
   - Secure email change: ON

2. Google（将来：まずはEmailのみでOK）
   - Google Cloud Console でOAuth2クライアントを作成してから設定
```

---

## Step 2：Anthropic API キー取得

```
1. https://console.anthropic.com でアカウント作成
2. API Keys > Create Key → 名前: fuu-production
3. キーをコピーして .env.local に保存
4. 課金設定：Usage Limits で月の上限を設定（最初は $10程度）
```

---

## Step 3：Stripe セットアップ

```
1. https://stripe.com/jp でアカウント作成
2. 本番運用前はテストモードで開発する

【商品・価格を作成】
Dashboard > Products > Add product

商品1：スタンダードプラン
  - Name: スタンダードプラン
  - Price: ¥100/月（recurring, monthly）
  - Price ID をコピー → STRIPE_PRICE_STANDARD に設定

商品2：プレミアムプラン
  - Name: プレミアムプラン
  - Price: ¥980/月（recurring, monthly）
  - Price ID をコピー → STRIPE_PRICE_PREMIUM に設定

商品3：プレミアムチケット
  - Name: プレミアムチケット
  - Price: ¥300（one-time）
  - Price ID をコピー → STRIPE_PRICE_TICKET に設定

【Webhook設定（ローカル開発）】
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
→ 表示された webhook signing secret を STRIPE_WEBHOOK_SECRET に設定

【Webhook設定（本番・Vercel）】
Stripe Dashboard > Developers > Webhooks > Add endpoint
  URL: https://fuu-app.jp/api/webhook/stripe
  Events:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - checkout.session.completed
```

---

## Step 4：ローカル開発環境の起動

```bash
# リポジトリのルートで実行
cd fuu-app

# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成
cp .env.local.example .env.local
# .env.local を編集して各APIキーを埋める

# 開発サーバー起動
npm run dev
# → http://localhost:3000 でアクセス可能
```

---

## Step 5：Vercel デプロイ

```
1. https://vercel.com でアカウント作成
2. "Add New Project" → GitHubリポジトリを連携
3. Framework Preset: Next.js（自動検出）
4. Environment Variables に .env.local の内容を全てコピー
   （NEXT_PUBLIC_APP_URL は https://fuu-app.jp に変更）
5. Deploy

【カスタムドメイン設定】
Vercel Project Settings > Domains
  → fuu-app.jp を追加
  → お名前.com等のDNSでCNAMEレコードを設定
```

---

## 開発フェーズ計画

| フェーズ | 期間 | 内容 |
|----------|------|------|
| Phase 0 | 今〜Month 1 | 基盤構築（今ここ）|
| Phase 1 | Month 1-2 | MVP：チャット・認証・決済 |
| Phase 2 | Month 2-3 | プレミアム：音声・愚痴ジャーナル |
| Phase 3 | Month 3-4 | App Store / Google Play 申請 |
| Phase 4 | Month 4+ | パパキャラ解禁・機能拡張 |

---

## 困ったときの連絡先・ドキュメント

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Stripe Docs: https://stripe.com/docs
- Anthropic Docs: https://docs.anthropic.com
- Vercel Docs: https://vercel.com/docs
