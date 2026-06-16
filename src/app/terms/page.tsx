export default function TermsPage() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh', padding: '0 0 40px' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #FCE4EC', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/app/settings" style={{ color: '#E91E63', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>‹</a>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>利用規約</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', fontSize: 13, color: '#333', lineHeight: 1.9 }}>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
          制定日：2026年6月
        </p>

        <Section title="第1条（定義）">
          <Item n="1">「本サービス」とは、OGAWAVEが提供するAI共感アプリ「fuu ふぅ」（Webアプリ及び関連サービス）を指します。</Item>
          <Item n="2">「ユーザー」とは、本サービスに登録した個人を指します。</Item>
          <Item n="3">「AIキャラクター」とは、本サービス上のペルソナ（AIが生成する架空の人物）を指します。実在の人物ではありません。</Item>
          <Item n="4">「プレミアム機能」とは、月額¥980のプレミアムプランのみで利用可能な機能（音声テキスト入力・プレミアム専用キャラ等）を指します。</Item>
          <Item n="5">「チケット」とは、スタンダードプラン以上のユーザーが購入できる¥300/日の使い放題オプションを指します。</Item>
        </Section>

        <Section title="第2条（登録・トライアル）">
          <Item n="1">本サービスへの登録は、本規約への同意をもって完了します。</Item>
          <Item n="2">新規登録から10日間は無料トライアル期間とします。この間、一部機能を無料で体験できます。</Item>
          <Item n="3">トライアル期間終了後、継続利用にはスタンダードプラン（¥300/月）またはプレミアムプラン（¥980/月）の契約が必要です。</Item>
          <Item n="4">18歳未満の方は本サービスを利用できません。</Item>
        </Section>

        <Section title="第3条（料金・支払い）">
          <Item n="1">スタンダードプラン：¥300/月。毎月自動更新。月200会話まで。</Item>
          <Item n="2">プレミアムプラン：¥980/月。毎月自動更新。月900会話まで。</Item>
          <Item n="3">チケット：¥300/日。有効期限は購入翌日24:00まで。</Item>
          <Item n="4">支払い方法：クレジットカード・Apple Pay・Google Pay。</Item>
          <Item n="5">支払いはStripe Inc.の決済システムを通じて処理されます。</Item>
        </Section>

        <Section title="第4条（解約・退会・返金）">
          <Item n="1">サブスクリプションの解約は <a href="https://billing.stripe.com/p/login" target="_blank" rel="noreferrer" style={{ color: '#E91E63' }}>billing.stripe.com</a> からいつでも可能です。解約後は次回更新日まで引き続きご利用いただけます。日割り返金は行いません。</Item>
          <Item n="2">アカウント退会（設定ページ）を行った場合、サービスは即日終了します。退会前にサブスクリプションの解約手続きを完了してください。退会後の残存期間に対する返金は行いません。</Item>
          <Item n="3">チケットの返金はfuu.support@gmail.comへのお問い合わせにより、購入後24時間以内かつ未使用の場合のみ対応します。</Item>
        </Section>

        <Section title="第5条（AIキャラクターについて）">
          <Item n="1">本サービスのペルソナはすべてAIが生成するキャラクターです。実在の人物ではありません。</Item>
          <Item n="2">AIキャラクター（パパキャラを含む）は育児の精神的サポートを目的とするものであり、恋愛・性的交際・不倫等を助長するものではありません。</Item>
          <Item n="3">AIが生成する回答の内容は100%の正確性・安全性を保証するものではありません。</Item>
          <Item n="4">医療・法律・金融に関する相談には本サービスを使用しないでください。</Item>
        </Section>

        <Section title="第6条（個人情報）">
          <Item n="1">個人情報の取り扱いは別途プライバシーポリシーに定めます。</Item>
          <Item n="2">会話内容はAIモデルの学習には使用しません。</Item>
          <Item n="3">会話内容はサーバーに保存されません。退会後、アカウント情報・決済履歴は30日以内に自動削除されます。詳細はプライバシーポリシーをご確認ください。</Item>
        </Section>

        <Section title="第7条（禁止事項）">
          <p style={{ margin: '0 0 6px' }}>ユーザーは以下の行為を行ってはなりません。</p>
          <BulletItem>本サービスのコンテンツ・AIキャラクターの無断転載・商業利用</BulletItem>
          <BulletItem>AIキャラクターとの会話を実在の人物の発言として流布すること</BulletItem>
          <BulletItem>他のユーザーへの迷惑行為・個人情報の収集</BulletItem>
          <BulletItem>本サービスのリバースエンジニアリング・不正アクセス</BulletItem>
          <BulletItem>AIに対して違法・有害・差別的なコンテンツを生成させようとする行為</BulletItem>
        </Section>

        <Section title="第8条（免責事項）">
          <Item n="1">本サービスは育児の孤独感を軽減する支援ツールであり、専門的な医療・カウンセリングの代替ではありません。</Item>
          <Item n="2">AIの応答によって生じたいかなる損害についても、当社は責任を負いません。</Item>
          <Item n="3">本サービスは自殺・自傷・精神科的治療の専門機関ではありません。危機的状況にある方は専門機関にご相談ください。</Item>
        </Section>

        <Section title="第9条（著作権）">
          <Item n="1">本サービスのコンテンツ（キャラクター・BGM・UI等）の著作権はOGAWAVEに帰属します。</Item>
          <Item n="2">BGMはAI生成によるオリジナル楽曲です。</Item>
        </Section>

        <Section title="第10条（準拠法・管轄）">
          <Item n="1">本規約は日本法に準拠します。</Item>
          <Item n="2">本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</Item>
        </Section>

        <div style={{ marginTop: 32, padding: '16px', background: '#fff', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888' }}>お問い合わせ：fuu.support@gmail.com</div>
          <div style={{ fontSize: 7, color: '#ddd', marginTop: 6 }}>OGAWAVE（個人事業主：小川博吉）</div>
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
