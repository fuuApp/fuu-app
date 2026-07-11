export default function TokushoPage() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', background: '#fdf4f7', minHeight: '100vh', padding: '0 0 40px' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #FCE4EC', padding: '16px 20px', paddingTop: 'calc(env(safe-area-inset-top) + 16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/app/settings" style={{ color: '#E91E63', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>‹</a>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>特定商取引法に基づく表記</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', fontSize: 13, color: '#333', lineHeight: 1.9 }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['販売事業者', 'OGAWAVE'],
              ['所在地', '〒221-0056\n神奈川県横浜市神奈川区金港町5-14 クアドリフォリオ8階'],
              ['メールアドレス', 'fuu.support@gmail.com'],
              ['サービス名', 'fuu ふぅ（育児ママのためのAI共感アプリ）'],
              ['販売価格', 'スタンダードプラン：¥300/月\nプレミアムプラン：¥980/月\nチケット：¥300/日'],
              ['支払い方法', 'クレジットカード（Visa・Mastercard・American Express・JCB）\nApple Pay・Google Pay'],
              ['支払い時期', '月額プラン：登録月より毎月自動更新\nチケット：購入時に即時決済'],
              ['サービス提供時期', '決済完了後、即時提供'],
              ['解約・キャンセル方法', 'アプリ内の設定ページ→「プラン・解約」から手続き可能\n解約後は当月末まで利用可能。日割り返金なし\nチケットは購入後24時間以内・未使用の場合のみ返金対応'],
              ['返金ポリシー', '原則として購入後の返金は行いません\n※チケットの例外については上記キャンセル方法を参照'],
              ['動作環境', 'iOS 15以上 / Android 9以上\nGoogle Chrome・Safari等モダンブラウザ'],
              ['特記事項', '本サービスのAIキャラクターは架空の人物です。実在の人物ではありません。\n医療・法律・金融の専門的アドバイスを提供するものではありません。'],
              ['電話番号', '電話番号は請求があり次第、遅滞なく開示いたします\nお問い合わせ：fuu.support@gmail.com'],
              ['運営責任者', '小川博吉'],
            ].map(([label, value], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #FCE4EC' }}>
                <td style={{
                  padding: '12px 12px 12px 0',
                  verticalAlign: 'top',
                  width: '38%',
                  fontWeight: 600,
                  color: '#880E4F',
                  fontSize: 12,
                }}>
                  {label}
                </td>
                <td style={{
                  padding: '12px 0', verticalAlign: 'top', whiteSpace: 'pre-line',
                  ...(label === '運営責任者' ? { fontSize: 10, color: '#aaa' } : {}),
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 32, padding: '16px', background: '#fff', borderRadius: 12, fontSize: 12, color: '#888', textAlign: 'center' }}>
          OGAWAVE<br />
          お問い合わせ：fuu.support@gmail.com
        </div>
      </div>
    </main>
  )
}
