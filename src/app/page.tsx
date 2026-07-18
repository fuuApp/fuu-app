'use client'

import Link from 'next/link'
import Image from 'next/image'
import { isNative } from '@/lib/platform'

// TODO: リリース後にストアURLを更新する
const APP_STORE_URL = '#'      // App Store URL（例: https://apps.apple.com/app/fuu/id1234567890）
const GOOGLE_PLAY_URL = '#'    // Google Play URL（例: https://play.google.com/store/apps/details?id=com.fuu.app）

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh' }}>

      {/* ── 統計バナー ── */}
      <div style={{
        background: '#FCE4EC', borderBottom: '1px solid #F48FB1',
        padding: '10px 20px', textAlign: 'center', fontSize: 13, color: '#880E4F',
        paddingTop: 'calc(env(safe-area-inset-top) + 10px)',
      }}>
        育児中のママ、<strong>4人に1人</strong>が「誰にも頼れていない」
      </div>

      {/* ── ヒーロー ── */}
      <section style={{
        background: 'linear-gradient(160deg,#FCE4EC 0%,#fdf4f7 100%)',
        padding: '40px 24px 36px', textAlign: 'center',
      }}>
        {/* アプリアイコン */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Image
            src="/icons/icon_c.png"
            alt="fuu ふぅ アプリアイコン"
            width={100}
            height={100}
            style={{ borderRadius: 24, boxShadow: '0 8px 32px rgba(233,30,99,0.18)' }}
            priority
          />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#E91E63', margin: '0 0 12px', lineHeight: 1.3 }}>
          fuu <span style={{ fontSize: 22, color: '#880E4F' }}>ふぅ</span>
        </h1>
        <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, margin: '0 0 8px' }}>
          育児中のママが、<br />遠慮なく話せる場所。
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
          AIのママ友が、いつでもそばにいます。
        </p>

        {/* ── アプリダウンロード（Webのみ表示） ── */}
        {!isNative() && <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>アプリから始める</p>}
        {!isNative() && <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {/* iOS App Store */}
          <a
            href={APP_STORE_URL}
            onClick={APP_STORE_URL === '#' ? (e) => e.preventDefault() : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1a1a1a', color: '#fff',
              padding: '10px 18px', borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              minWidth: 140, opacity: APP_STORE_URL === '#' ? 0.55 : 1,
              cursor: APP_STORE_URL === '#' ? 'default' : 'pointer',
            }}
            title={APP_STORE_URL === '#' ? '近日公開予定' : 'App Storeでダウンロード'}
          >
            <svg width="16" height="20" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282z"/>
            </svg>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div style={{ fontSize: 9, opacity: 0.8 }}>
                {APP_STORE_URL === '#' ? '近日公開予定' : 'Download on the'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>App Store</div>
            </div>
          </a>

          {/* Android Google Play */}
          <a
            href={GOOGLE_PLAY_URL}
            onClick={GOOGLE_PLAY_URL === '#' ? (e) => e.preventDefault() : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#1a1a1a', color: '#fff',
              padding: '10px 18px', borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              minWidth: 140, opacity: GOOGLE_PLAY_URL === '#' ? 0.55 : 1,
              cursor: GOOGLE_PLAY_URL === '#' ? 'default' : 'pointer',
            }}
            title={GOOGLE_PLAY_URL === '#' ? '近日公開予定' : 'Google Playでダウンロード'}
          >
            <svg width="18" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.18 23.76c.3.17.64.24.99.2L14.9 12 11.1 8.2 3.18 23.76zm17.14-10.98L17.4 11.3l-3.64 3.64 3.67 3.67 2.87-1.62c.82-.47.82-1.55-.02-2.01zM2.34.27C2.13.5 2 .84 2 1.27v21.46c0 .43.13.77.35 1l.1.09 12.02-12.02v-.27L2.44.18l-.1.09zM14.9 12l2.5-2.5-2.87-1.62c-.84-.47-1.77-.02-2.08.87L14.9 12z"/>
            </svg>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div style={{ fontSize: 9, opacity: 0.8 }}>
                {GOOGLE_PLAY_URL === '#' ? '近日公開予定' : 'GET IT ON'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Google Play</div>
            </div>
          </a>
        </div>}

        {/* Webとの仕切り（Webのみ表示） */}
        {!isNative() && <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 8px' }}>
          <div style={{ flex: 1, height: 1, background: '#e8c8d4' }}></div>
          <span style={{ fontSize: 12, color: '#c0a0b0', whiteSpace: 'nowrap' }}>または Web で</span>
          <div style={{ flex: 1, height: 1, background: '#e8c8d4' }}></div>
        </div>}

        <Link href="/signin" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#E91E63,#C2185B)',
          color: '#fff', padding: '16px 40px', borderRadius: 50,
          fontWeight: 700, fontSize: 16, textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(233,30,99,0.35)',
        }}>
          10日間 無料で始める →
        </Link>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>
          クレジットカード不要・自動課金なし
        </p>
      </section>

      {/* ── ふぅという名前の理由 ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E91E63', marginBottom: 16, textAlign: 'center' }}>
          なぜ「ふぅ」という名前なの？
        </h2>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, fontSize: 14, color: '#555', lineHeight: 2, boxShadow: '0 2px 12px rgba(233,30,99,0.08)' }}>
          <p>
            育児中のママが、やっと子どもを寝かしつけた後に、ひとりでつく深呼吸。
          </p>
          <p style={{ fontSize: 28, textAlign: 'center', margin: '12px 0', color: '#E91E63', fontWeight: 700 }}>「ふぅ。」</p>
          <p>
            その一息が、明日もなんとかやれる気力になる。<br />
            そんな「ふぅ」を、いつでも作れる場所があったら——
          </p>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #FCE4EC', paddingTop: 16 }}>
            <Image
              src="/icons/icon_c.png"
              alt="ふぅ アイコン"
              width={48}
              height={48}
              style={{ borderRadius: 12, flexShrink: 0 }}
            />
            <p style={{ fontSize: 13, color: '#880E4F', fontStyle: 'italic', margin: 0 }}>
              3人の子育てをした妻の想いを聞き作りました。
            </p>
          </div>
        </div>
      </section>

      {/* ── 課題共感 ── */}
      <section style={{ padding: '32px 24px', background: '#fff', margin: '12px 0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 20, textAlign: 'center' }}>
          こんな気持ち、ありませんか？
        </h2>
        {[
          { icon: '😔', text: '旦那には「また？」って顔をされそうで言えない' },
          { icon: '😶', text: 'ママ友には弱音を見せたくない' },
          { icon: '🌙', text: '夜中に誰かに話したくなる' },
          { icon: '💭', text: '「これって相談していいのかな」と思って結局1人で抱える' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: '#fdf4f7', borderRadius: 12, padding: '14px 16px',
            marginBottom: 10,
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

      {/* ── アプリ画面イメージ ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8, textAlign: 'center' }}>
          こんな感じで話せます
        </h2>
        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20 }}>
          深夜でも、朝でも、AIのママ友がいつでも聴きます
        </p>
        {/* チャット画面モック */}
        <div style={{
          background: '#fff', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(233,30,99,0.12)',
          border: '1px solid #FCE4EC',
        }}>
          {/* モックヘッダー */}
          <div style={{
            background: '#fff', borderBottom: '1px solid #FCE4EC',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            overflow: 'hidden' }}><img src="/characters/sakura.png" alt="さくら" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>さくら</div>
              <div style={{ fontSize: 11, color: '#E91E63' }}>聞き上手なママ友 🟢</div>
            </div>
          </div>
          {/* モックメッセージ */}
          <div style={{ padding: '16px 12px', background: '#fdf4f7', minHeight: 180 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}><img src="/characters/sakura.png" alt="さくら" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', fontSize: 13, color: '#333', maxWidth: '72%', lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                おかえり〜！今日はどんな一日だった？なんでも話してね😊
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <div style={{ background: 'linear-gradient(135deg,#E91E63,#C2185B)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: 13, color: '#fff', maxWidth: '72%', lineHeight: 1.6 }}>
                旦那が全然家事手伝ってくれなくて、もう限界かも…
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}><img src="/characters/sakura.png" alt="さくら" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', fontSize: 13, color: '#333', maxWidth: '72%', lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                それは辛いね…。どんなことが一番きつかった？全部聞くよ🌸
              </div>
            </div>
          </div>
          {/* モックフッター */}
          <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #FCE4EC', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, background: '#fdf4f7', border: '1.5px solid #F48FB1', borderRadius: 20, padding: '8px 14px', fontSize: 12, color: '#aaa' }}>
              さくらに話しかける…
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#E91E63,#C2185B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>↑</div>
          </div>
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
        {/* 無料トライアルから */}
        <p style={{ fontSize: 11, color: '#E91E63', fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em' }}>
          🎁 無料トライアルから話せる
        </p>
        {[
          { img: '/characters/aoi.png',    name: 'あおい', age: '25歳', tag: '新米ママ',  desc: '「わかる！私もそうだったよ」',      color: '#FCE4EC', tagColor: '#E91E63' },
          { img: '/characters/sakura.png', name: 'さくら', age: '35歳', tag: '先輩ママ',  desc: '「そっか、それは大変だったね」',    color: '#FCE4EC', tagColor: '#E91E63' },
        ].map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: c.color, borderRadius: 12, padding: '12px 16px', marginBottom: 10,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'linear-gradient(135deg,#E91E63,#F48FB1)',
            }}>
              <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{c.name}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{c.age}</span>
                <span style={{ fontSize: 11, background: c.tagColor, color: '#fff', padding: '1px 8px', borderRadius: 20 }}>{c.tag}</span>
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: 0, fontStyle: 'italic' }}>{c.desc}</p>
            </div>
          </div>
        ))}

        {/* スタンダードから */}
        <p style={{ fontSize: 11, color: '#C2185B', fontWeight: 700, margin: '14px 0 8px', letterSpacing: '0.05em' }}>
          ✦ スタンダード以上でさらに追加
        </p>
        {[
          { img: '/characters/rika.png',    name: 'りか',   age: '32歳', tag: 'キャリアママ', desc: '「じゃあ今日できることから始めよう」', color: '#FFF3E0', tagColor: '#C2185B' },
          { img: '/characters/natsuko.png', name: 'なつこ', age: '40歳', tag: '姉御肌',      desc: '「そんなん全然気にせんでええ！」',   color: '#FFF8E1', tagColor: '#C2185B' },
        ].map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: c.color, borderRadius: 12, padding: '12px 16px', marginBottom: 10,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'linear-gradient(135deg,#C2185B,#880E4F)',
            }}>
              <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{c.name}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{c.age}</span>
                <span style={{ fontSize: 11, background: c.tagColor, color: '#fff', padding: '1px 8px', borderRadius: 20 }}>{c.tag}</span>
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: 0, fontStyle: 'italic' }}>{c.desc}</p>
            </div>
          </div>
        ))}

        {/* プレミアム */}
        <p style={{ fontSize: 11, color: '#880E4F', fontWeight: 700, margin: '14px 0 8px', letterSpacing: '0.05em' }}>
          ★ プレミアム限定キャラ
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { img: '/characters/kenji.png',   name: 'けんじ', age: '34歳', tag: 'イクメンパパ' },
            { img: '/characters/hiroshi.png', name: 'ひろし', age: '45歳', tag: '渋めパパ' },
          ].map((c, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: '#F8EEF5', borderRadius: 12, padding: '10px 12px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: '#ccc', position: 'relative',
              }}>
                <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'grayscale(100%)' }} />
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 20, lineHeight: 1 }}>🔒</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#880E4F' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{c.age}・{c.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 機能 ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 20, textAlign: 'center' }}>
          ふぅでできること
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: '💬', title: 'いつでも会話', desc: '24時間・深夜もOK' },
            { icon: '🧹', title: '気持ちの箱', desc: '感情を3タグで整理' },
            { icon: '🎵', title: 'BGM', desc: 'チャット中に癒やしのBGM' },
            { icon: '💴', title: '月わずか¥300', desc: 'コーヒー1杯以下・いつでも解約可' },
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
        {/* トライアル */}
        <div style={{ background: '#F3E5F5', border: '1px solid #CE93D8', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#6A1B9A' }}>🎁 無料トライアル</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#6A1B9A' }}>¥0<span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>（10日間）</span></span>
          </div>
          {[
            'あおい・さくらと70会話まで無料',
            'BGM試聴',
            'クレジットカード不要・自動課金なし',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 12, color: '#777' }}>
              <span style={{ color: '#9C27B0', flexShrink: 0, marginTop: 1 }}>✦</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        {/* スタンダード */}
        <div style={{ border: '2px solid #E91E63', borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#E91E63' }}>スタンダード</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#E91E63' }}>¥300<span style={{ fontSize: 13, color: '#888' }}>/月</span></span>
          </div>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 10px' }}>月200会話（1日約6会話）</p>
          {[
            'あおい・さくら・りか・なつこ（4名）と話せる',
            'ニックネームで呼んでもらえる',
            '気持ちの箱（感情整理）・BGMフル利用',
            '使い放題チケット ¥300/日（追加購入可）',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, color: '#444' }}>
              <span style={{ color: '#E91E63', flexShrink: 0, marginTop: 2, fontSize: 12 }}>✓</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        {/* プレミアム */}
        <div style={{ background: 'linear-gradient(135deg,#FCE4EC,#fff)', border: '2px solid #C2185B', borderRadius: 16, padding: 20, marginBottom: 14, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, right: 14, background: 'linear-gradient(135deg,#E91E63,#C2185B)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 10px 10px' }}>
            おすすめ
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#880E4F' }}>プレミアム</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#880E4F' }}>¥980<span style={{ fontSize: 13, color: '#888' }}>/月</span></span>
          </div>
          <p style={{ fontSize: 11, color: '#C2185B', margin: '0 0 10px', fontWeight: 600 }}>月900会話（1日約30会話）— 1会話単価がスタンダードより27%お得</p>
          {[
            { text: 'スタンダードの全機能', prefix: '✓' },
            { text: 'パパキャラ けんじ・ひろし＋随時追加', prefix: '✓' },
            { text: '使い放題チケット ¥300/日（追加購入可）', prefix: '✓' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, color: '#444' }}>
              <span style={{ color: '#C2185B', flexShrink: 0, marginTop: 2, fontSize: 12 }}>{item.prefix}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        {/* チケット */}
        <div style={{ background: '#FFFDE7', border: '1px solid #FFC107', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F57F17' }}>🎟️ 使い放題チケット</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#F57F17' }}>¥300/日</span>
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>スタンダード以上で購入可。その日1日、会話回数制限なし</p>
        </div>
      </section>

      {/* ── 安心設計 ── */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 16, textAlign: 'center' }}>
          安心して使えます
        </h2>
        {[
          { icon: '🔐', text: '会話はAI学習に使いません' },
          { icon: '🗑️', text: '退会後、個人情報を段階的に速やかに削除' },
          { icon: '👀', text: '会話の記録は残りません。会話を閉じたら削除されます。' },
          { icon: '💳', text: '安全な決済システム（App Store / Google Play対応）' },
          { icon: '🔒', text: '全通信SSL暗号化' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
            background: '#fff', borderRadius: 10, padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <p style={{ fontSize: 14, color: '#555', margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </section>

      {/* ── 最終CTA ── */}
      <section style={{
        padding: '40px 24px 60px', textAlign: 'center',
        background: 'linear-gradient(160deg,#FCE4EC 0%,#fdf4f7 100%)',
      }}>
        {/* アイコン再掲 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Image
            src="/icons/icon_c.png"
            alt="fuu ふぅ"
            width={72}
            height={72}
            style={{ borderRadius: 18, boxShadow: '0 4px 20px rgba(233,30,99,0.2)' }}
          />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>
          今日の「ふぅ」を、ここで。
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>
          10日間は完全無料。
        </p>
        <Link href="/signin" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#E91E63,#C2185B)',
          color: '#fff', padding: '18px 48px', borderRadius: 50,
          fontWeight: 700, fontSize: 17, textDecoration: 'none',
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
