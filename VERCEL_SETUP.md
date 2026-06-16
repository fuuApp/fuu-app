# Vercel デプロイ手順（初心者向け）

Vercelは「GitHubにコードをあげると自動でネット公開してくれる」無料サービスです。
fuu は Vercel での公開を前提に設計されています。

---

## 事前準備：GitHubアカウントを作る

1. https://github.com を開く
2. 右上「Sign up」→ メールアドレス・ユーザー名・パスワードを入力
3. 確認メールのリンクをクリック

---

## Step 1：GitHubにコードをアップロードする

### ターミナルで実行（fuu-appフォルダの中で）

```bash
cd ~/Desktop/fuu-app
git init
git add .
git commit -m "first commit"
```

### GitHubでリポジトリを作成

1. https://github.com/new を開く
2. Repository name: `fuu-app`
3. **「Private」** を選択（コードを非公開にする）
4. 「Create repository」をクリック
5. 表示された2行のコマンドをターミナルに貼り付けて実行

```bash
git remote add origin https://github.com/（あなたのID）/fuu-app.git
git branch -M main
git push -u origin main
```

---

## Step 2：Vercelアカウントを作る

1. https://vercel.com を開く
2. 「Sign Up」→ **「Continue with GitHub」** をクリック
3. GitHubのアカウントで認証する

---

## Step 3：プロジェクトをデプロイする

1. Vercelのダッシュボードで **「Add New... → Project」** をクリック
2. GitHubリポジトリ一覧から **「fuu-app」** を選択して **「Import」**
3. 設定画面が出るが **何も変更せず**「Deploy」をクリック
   - Framework: Next.js（自動検出される）
   - Root Directory: ./（デフォルトのまま）

→ 1〜2分でデプロイ完了！ `https://fuu-app-xxxx.vercel.app` のようなURLが発行されます。

---

## Step 4：環境変数をVercelに設定する

デプロイ後、`.env.local` の内容をVercelに登録する必要があります。

1. Vercelのプロジェクトページを開く
2. 「Settings」→「Environment Variables」をクリック
3. 以下の変数を1つずつ追加：

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | sk-ant-（あなたのキー） |
| `NEXT_PUBLIC_SUPABASE_URL` | （Supabase設定後に追加） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | （Supabase設定後に追加） |
| `SUPABASE_SERVICE_ROLE_KEY` | （Supabase設定後に追加） |
| `STRIPE_SECRET_KEY` | （Stripe設定後に追加） |
| `STRIPE_WEBHOOK_SECRET` | （Stripe設定後に追加） |
| `STRIPE_PRICE_STANDARD` | （Stripe設定後に追加） |
| `STRIPE_PRICE_PREMIUM` | （Stripe設定後に追加） |
| `STRIPE_PRICE_TICKET` | （Stripe設定後に追加） |

4. 「Save」をクリック
5. 「Deployments」タブ →「Redeploy」で再デプロイ

⚠️ **今は `ANTHROPIC_API_KEY` だけ設定すればチャットが動きます！**
　　Supabase/Stripeは後で設定すれば問題ありません。

---

## Step 5：カスタムドメインを設定する（任意・後でOK）

fuu-app.jp などの独自ドメインを使う場合：

1. Vercelのプロジェクトページ →「Settings」→「Domains」
2. `fuu-app.jp` と入力して「Add」
3. 表示されたDNSレコードをドメイン管理会社（お名前.com等）に設定

---

## コードを更新したときは？

`git push` するだけで自動で再デプロイされます。

```bash
cd ~/Desktop/fuu-app
git add .
git commit -m "更新内容を一言で"
git push
```

---

## よくある質問

**Q: 無料で使えますか？**
A: 個人・小規模なら無料プランで十分です。月100GBの帯域・商用利用OK。
   ユーザーが増えてきたらProプラン（$20/月）に上げます。

**Q: .env.localの内容がGitHubに上がってしまわないか心配**
A: `.gitignore` に `.env.local` を記載しているので絶対にアップされません。
   ただし `.env.local.example` には実際のキーを書かないように注意。

**Q: デプロイ後にAPIが動かない**
A: Vercelの環境変数を設定して「Redeploy」してください。
