import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh' }}>

      {/* ── 統計バナー ── */}
      <div style={{ background: '#FCE4EC', borderBottom: '1px solid #F48FB1', padding: '10px 20px', textAlign: 'center', fontSize: 13, color: '#880E4F' }}>
        育児中のママ、<strong>4人に1人</strong>が「誰にも頼れていない」
      </div>

      {/* ── ヒーロー ── */}
      <section style={{ background: 'linear-gradient(160deg,#FCE4EC 0%,#fdf4f7 100%)', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌸</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#E91E63', margin: '0 0 12px', lineHeight: 1.3 }}>
          fuu <span style={{ fontSize: 22, color: '#880E4F' }}>ふぅ</span>
        </h1>
        <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, margin: '0 0 8px' }}>
          育児中のママが、<br />遠慮なく話せる場所。
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>
          AIのママ友が、いつでもそばにいます。
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#E91E63,#C2185B)',
          color: '#fff',
          padding: '16px 40px',
          borderRadius: 50,
          fontWeight: 700,
          fontSize: 16,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(233,30,99,0.35)',
        }}>
          10日間 無料で始める →
        </Link>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>
          クレジットカード不要・いつでも解約OK
        </p>
      </section>

      {/* ── ふぅという名前の理由 ── */}
      <section style={{ padding: '32px 24px', background: '#fff', margin: '12px 0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E91E63', marginBottom: 16, textAlign: 'center' }}>
          なぜ「ふぅ」という名前なの？
        </h2>
        <div style={{ background: '#FCE4EC', borderRadius: 16, padding: 20, fontSize: 14, color: '#555', lineHeight: 2 }}>
          <p>
            育児中のママが、やっと子どもを寝かしつけた後に、ひとりでつく深呼吸。
          </p>
          <p style={{ fontSize: 28, textAlign: 'center', margin: '12px 0', color: '#E91E63', fontWeight: 700 }}>「ふぅ。」</p>
          <p>
            その一息が、明日もなんとかやれる気力になる。<br />
            そんな「ふぅ」を、いつでも作れる場所があったら——
          </p>
          <p style={{ marginTop: 16, fontSize: 13, color: '#880E4F', fontStyle: 'italic' }}>
            3人の子育てをしながら、ずっとそう思っていた私が作りました。
          </p>
        </div>
      </section>

      {/* ── 課題共感 ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 20, textAlign: 'center' }}>
          こんな気持ち、ありませんか？
        </h2>
        {[
          { icon: '😔', text: '旦那には「また？」って顔をされそうで言えない' },
          { icon: '😶', text: 'ママ友には弱音を見せたくない' },
          { icon: '🌙', text: '夜中の2時に、誰かに話したくなる' },
          { icon: '💭', text: '「これって相談していいのかな」と思って結局1人で抱える' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: '#fff', borderRadius: 12, padding: '14px 16px',
            marginBottom: 10, boxShadow: '0 1px 6px rgba(233,30,99,0.08)',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: 20, padding: '16px', background: '#FCE4EC', borderRadius: 12 }}>
          <p style={{ fontSize: 15, color: '#880E4F', fontWeight: 700, margin: 0 }}>
            ふぅは、そのすべてを<br />遠慮なく話せる場所です。
          </p>
        </div>
      </section>

      {/* ── キャラクター紹介 ── */}
      <section style={{ padding: '32px 24px', background: '#fff', margin: '12px 0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 6, textAlign: 'center' }}>
          AIのママ友たちが待ってます
        </h2>
        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20 }}>
          全員、育児経験のある女性キャラクターです
        </p>
        {[
          { name: 'あおい', age: '25歳', tag: '新米ママ', desc: '「わかる！私もそうだったよ」', color: '#FCE4EC' },
          { name: 'さくら', age: '30歳', tag: '聞き上手', desc: '「そっか、それは大変だったね」', color: '#FCE4EC' },
          { name: 'りか', age: '42歳', tag: '毒舌姐さん', desc: '「それはおかしいでしょ！」', color: '#FFF3E0' },
          { name: 'なつこ', age: '45歳', tag: '癒やし系', desc: '「まあまあ、ゆっくり話してごらん」', color: '#FFF8E1' },
        ].map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: c.color, borderRadius: 12, padding: '12px 16px', marginBottom: 10,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#E91E63', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>👩</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{c.name}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{c.age}</span>
                <span style={{ fontSize: 11, background: '#E91E63', color: '#fff', padding: '1px 8px', borderRadius: 20 }}>{c.tag}</span>
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: 0, fontStyle: 'italic' }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── 機能 ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 20, textAlign: 'center' }}>
          ふぅでできること
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '💬', title: 'いつでも会話', desc: '24時間・深夜もOK' },
            { icon: '🌙', title: '朝夜ボイス', desc: '毎朝毎晩、ボイスメッセージ' },
            { icon: '🗑️', title: '愚痴お片付け', desc: '愚痴を「宝箱」に変換' },
            { icon: '📞', title: '音声通話', desc: 'リアルな声で話せる（プレミアム）' },
            { icon: '🔒', title: '完全プライベート', desc: 'AI学習に使わない' },
            { icon: '💴', title: '月わずか¥100', desc: 'お守り価格でいつでも解約可' },
          ].map((f, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '16px 14px',
              boxShadow: '0 2px 8px rgba(233,30,99,0.08)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 料金 ── */}
      <section style={{ padding: '32px 24px', background: '#fff', margin: '12px 0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 20, textAlign: 'center' }}>
          シンプルな料金設計
        </h2>
        {/* スタンダード */}
        <div style={{ border: '2px solid #E91E63', borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#E91E63' }}>スタンダード</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#E91E63' }}>¥100<span style={{ fontSize: 13, color: '#888' }}>/月</span></span>
          </div>
          <ul style={{ fontSize: 13, color: '#555', paddingLeft: 18, lineHeight: 2, margin: 0 }}>
            <li>AIママ友4人（あおい・さくら・りか・なつこ）</li>
            <li>テキストチャット無制限</li>
            <li>朝夜ボイスメッセージ</li>
          </ul>
        </div>
        {/* プレミアム */}
        <div style={{ background: 'linear-gradient(135deg,#FCE4EC,#fff)', border: '1px solid #F48FB1', borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#880E4F' }}>プレミアム</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#880E4F' }}>¥980<span style={{ fontSize: 13, color: '#888' }}>/月</span></span>
          </div>
          <ul style={{ fontSize: 13, color: '#555', paddingLeft: 18, lineHeight: 2, margin: 0 }}>
            <li>スタンダードの全機能</li>
            <li>音声通話（リアルタイム）</li>
            <li>パパキャラ（けんじ・ひろし）</li>
            <li>愚痴お片付けバッチ</li>
          </ul>
        </div>
        {/* チケット */}
        <div style={{ background: '#FFFDE7', border: '1px solid #FFC107', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F57F17' }}>🎟️ プレミアムチケット ¥300/枚</span>
          <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>音声通話を1回だけ使いたいときに</p>
        </div>
      </section>

      {/* ── 安心設計 ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 16, textAlign: 'center' }}>
          安心して使えます
        </h2>
        {[
          '🔐 会話はAI学習に使いません',
          '🗑️ 退会後90日で完全削除',
          '👀 スタッフは基本的に閲覧しません',
          '💳 Stripeの安全な決済システム',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#555' }}>
            <span>{item}</span>
          </div>
        ))}
      </section>

      {/* ── 最終CTA ── */}
      <section style={{ padding: '40px 24px 60px', textAlign: 'center', background: 'linear-gradient(160deg,#FCE4EC 0%,#fdf4f7 100%)' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>
          今日の「ふぅ」を、ここで。
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>
          10日間は完全無料。クレジットカード不要。
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#E91E63,#C2185B)',
          color: '#fff',
          padding: '18px 48px',
          borderRadius: 50,
          fontWeight: 700,
          fontSize: 17,
          textDecoration: 'none',
          boxShadow: '0 4px 24px rgba(233,30,99,0.4)',
        }}>
          無料で始める →
        </Link>
        <div style={{ marginTop: 24, fontSize: 12, color: '#aaa' }}>
          <Link href="/terms" style={{ color: '#aaa', textDecoration: 'none', marginRight: 16 }}>利用規約</Link>
          <Link href="/privacy" style={{ color: '#aaa', textDecoration: 'none', marginRight: 16 }}>プライバシーポリシー</Link>
          <Link href="/tokusho" style={{ color: '#aaa', textDecoration: 'none' }}>特定商取引法</Link>
        </div>
      </section>

    </main>
  )
}
