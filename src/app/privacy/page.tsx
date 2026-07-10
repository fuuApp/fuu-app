export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh', padding: '0 0 40px' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #FCE4EC', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/app/settings" style={{ color: '#E91E63', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>‹</a>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>プライバシーポリシー</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', fontSize: 13, color: '#333', lineHeight: 1.9 }}>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
          制定日：2026年7月　最終更新：2026年7月
        </p>

        <p style={{ marginBottom: 20 }}>
          OGAWAVE（以下「当社」）は、fuu ふぅ（以下「本サービス」）におけるユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
        </p>

        <Section title="第1条（収集する情報）">
          <p style={{ margin: '0 0 8px' }}>本サービスは以下の情報を収集します。</p>
          <BulletItem>メールアドレス（ログイン目的）</BulletItem>
          <BulletItem>利用プラン情報（無料・スタンダード・プレミアム）</BulletItem>
          <BulletItem>チャット履歴（サービス提供目的。AI学習には使用しません）</BulletItem>
          <BulletItem>アプリ利用状況（改善目的・匿名化処理済み）</BulletItem>
          <BulletItem>決済情報（Stripe Inc.が管理。当社はカード番号を保持しません）</BulletItem>
        </Section>

        <Section title="第2条（利用目的）">
          <p style={{ margin: '0 0 8px' }}>収集した情報は以下の目的に使用します。</p>
          <BulletItem>本サービスの提供・維持・改善</BulletItem>
          <BulletItem>ユーザー認証・プラン管理</BulletItem>
          <BulletItem>お問い合わせへの対応</BulletItem>
          <BulletItem>利用規約違反の調査・対応</BulletItem>
        </Section>

        <Section title="第3条（第三者提供）">
          <p style={{ margin: '0 0 8px' }}>当社は以下の場合を除き、個人情報を第三者に提供しません。</p>
          <BulletItem>ユーザーの同意がある場合</BulletItem>
          <BulletItem>法令に基づく場合</BulletItem>
          <BulletItem>人の生命・身体・財産の保護に必要な場合</BulletItem>
        </Section>

        <Section title="第4条（業務委託先）">
          <p style={{ margin: '0 0 8px' }}>本サービスは以下のサービスを利用します。各社のプライバシーポリシーに従い情報が処理されます。</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#FCE4EC' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #F8BBD9', color: '#880E4F' }}>サービス</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #F8BBD9', color: '#880E4F' }}>用途</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Supabase Inc.', '認証・データベース管理'],
                ['Anthropic, PBC', 'AIチャット（Claude Haiku）'],
                ['OpenAI, Inc.', 'AIチャット補助処理'],
                ['Stripe Inc.', '決済処理'],
                ['Vercel Inc.', 'Webホスティング'],
              ].map(([name, use], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf4f7' }}>
                  <td style={{ padding: '6px 10px', border: '1px solid #FCE4EC' }}>{name}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #FCE4EC' }}>{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="第5条（データの保管・削除）">
          <Item n="1">会話内容はサーバーに保存されません。セッション終了とともに破棄されます。</Item>
          <Item n="2">「そろそろ終わりにする」を押した際に生成される感情サマリー（気持ちの箱）は、次回以降の会話の文脈として活用するためサーバーに保存されます。この情報は退会後30日以内に自動削除されます。</Item>
          <Item n="3">退会後、アカウント情報・決済履歴は30日以内に自動削除されます。</Item>
          <Item n="4">データはAES-256暗号化により保護されます。</Item>
          <Item n="5">会話内容はAIモデルの学習・改善には一切使用しません。</Item>
        </Section>

        <Section title="第6条（Cookie・ローカルストレージ）">
          <p style={{ margin: '0 0 6px' }}>本サービスはユーザー体験向上のためローカルストレージを使用します（ニックネーム・BGM設定・プランキャッシュ・気持ちの箱コンテキスト等）。ブラウザの設定から削除可能です。</p>
        </Section>

        <Section title="第7条（ユーザーの権利）">
          <p style={{ margin: '0 0 8px' }}>ユーザーはいつでも以下を請求できます。</p>
          <BulletItem>保有する個人情報の開示・訂正・削除</BulletItem>
          <BulletItem>利用停止・第三者提供の停止</BulletItem>
          <BulletItem>アカウント退会（設定ページから即時可能）</BulletItem>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>お問い合わせ先：fuu.support@gmail.com</p>
        </Section>

        <Section title="第8条（プライバシーポリシーの変更）">
          <p style={{ margin: 0 }}>本ポリシーは必要に応じて変更する場合があります。重要な変更の際はアプリ内でお知らせします。変更後も継続して本サービスを利用した場合、変更後のポリシーに同意したものとみなします。</p>
        </Section>

        <div style={{ marginTop: 32, padding: '16px', background: '#fff', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888' }}>お問い合わせ：fuu.support@gmail.com</div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>OGAWAVE（小川博吉）</div>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#E91E63', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #FCE4EC' }}>{title}</h2>
      {children}
    </div>
  )
}

function Item({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 6px', display: 'flex', gap: 8 }}>
      <span style={{ color: '#E91E63', fontWeight: 600, flexShrink: 0 }}>{n}.</span>
      <span>{children}</span>
    </p>
  )
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 4px', paddingLeft: 14, position: 'relative' }}>
      <span style={{ position: 'absolute', left: 0, color: '#E91E63' }}>・</span>
      {children}
    </p>
  )
}
