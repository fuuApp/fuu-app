# Supabase セットアップ手順（初心者向け）

Supabaseは「データベース＋ログイン機能」をまとめて提供してくれる無料サービスです。
難しい設定は不要で、ブラウザだけで完結します。

---

## Step 1：アカウント作成

1. ブラウザで https://supabase.com を開く
2. 右上の **「Start your project」** をクリック
3. **「Sign up with GitHub」** または **「Sign up with Email」** でアカウント作成
   - GitHubアカウントがあればそちらが簡単
   - メールの場合は確認メールが届くのでリンクをクリック

---

## Step 2：新しいプロジェクトを作成

1. ログイン後、**「New project」** ボタンをクリック
2. 以下を入力：

| 項目 | 入力内容 |
|------|----------|
| Organization | デフォルトのままでOK |
| Project name | `fuu-production` |
| Database Password | **強いパスワードを設定して必ずメモする**（後から変更できません） |
| Region | **Northeast Asia (Tokyo)** を選択 |

3. **「Create new project」** をクリック
4. 「Setting up your project...」と表示されるので **1〜2分待つ**

---

## Step 3：APIキーを取得する

プロジェクトの準備が完了したら：

1. 左側メニューの **「Project Settings」**（⚙️歯車アイコン）をクリック
2. **「API」** をクリック
3. 以下の3つをメモ帳にコピーしておく：

```
Project URL:
https://xxxxxxxxxxxxxxxxxx.supabase.co
↑ これが NEXT_PUBLIC_SUPABASE_URL

Project API keys > anon public:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
↑ これが NEXT_PUBLIC_SUPABASE_ANON_KEY

Project API keys > service_role （「Reveal」をクリックして表示）:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyy
↑ これが SUPABASE_SERVICE_ROLE_KEY（絶対に人に見せない）
```

---

## Step 4：データベースを作成する（コピペするだけ）

1. 左側メニューの **「SQL Editor」**（📝アイコン）をクリック
2. 画面中央の **「New query」** をクリック
3. `fuu-app/supabase/schema.sql` ファイルを**テキストエディタで開く**
4. 全文をコピー（Command + A → Command + C）
5. SQL Editorの入力欄に**ペースト**（Command + V）
6. 右上の **「Run」** ボタン（▶️）をクリック
7. 下部に **「Success. No rows returned」** と出れば完了！

---

## Step 5：認証設定

1. 左側メニューの **「Authentication」** をクリック
2. **「Providers」** タブを選択
3. **「Email」** が有効（緑色）になっていることを確認
4. 「Confirm email」を **ON** にする（メール認証あり）

---

## Step 6：.env.local に追記する

`~/Desktop/fuu-app/.env.local` をテキストエディタで開いて、
取得した値を貼り付ける：

```
NEXT_PUBLIC_SUPABASE_URL=https://（コピーしたURL）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ（コピーしたanon key）
SUPABASE_SERVICE_ROLE_KEY=eyJ（コピーしたservice_role key）
```

---

## 完了の確認

ターミナルで（npm run dev が動いているのとは別のタブで）：

```bash
cd ~/Desktop/fuu-app
npm run dev
```

http://localhost:3000/login でメールアドレスを入れてボタンを押し、
「メールを送りました」と出れば Supabase 接続成功です！

---

## よくある質問

**Q: 無料で使えますか？**
A: 無料プランで十分です。月50万リクエスト・500MBストレージまで無料。
   本番でユーザーが増えてきたらProプラン（$25/月）に上げます。

**Q: データはどこに保存されますか？**
A: Supabaseのサーバー（東京リージョン）に保存されます。
   個人情報は日本国内のサーバーに保存されます。

**Q: パスワードを忘れたら？**
A: supabase.com のログイン画面から「Forgot password」でリセットできます。
   DBパスワードはダッシュボードから変更可能です。
