const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer
} = require('/sessions/epic-sleepy-lovelace/fuu_project/node_modules/docx');
const fs = require('fs');

const C = {
  pink:"E91E63", lpink:"FCE4EC", mpink:"F8BBD9", dpink:"880E4F",
  grey:"616161", lgrey:"F5F5F5", dgrey:"212121",
  white:"FFFFFF", green:"2E7D32", lgreen:"E8F5E9",
  red:"C62828", lred:"FFEBEE", yellow:"F57F17", lyellow:"FFFDE7",
  blue:"1565C0", lblue:"E3F2FD", purple:"6A1B9A", lpurple:"F3E5F5",
  teal:"00695C", lteal:"E0F2F1", navy:"1A1A2E",
};
const bdr={style:BorderStyle.SINGLE,size:1,color:"E0E0E0"};
const bdrs={top:bdr,bottom:bdr,left:bdr,right:bdr};
const nb={style:BorderStyle.NONE,size:0,color:C.white};
const nbs={top:nb,bottom:nb,left:nb,right:nb};

const sp=(n=1)=>Array.from({length:n},()=>new Paragraph({children:[new TextRun("")]}));
const pgbrk=()=>new Paragraph({pageBreakBefore:true,children:[new TextRun("")]});
const div=()=>new Paragraph({spacing:{before:80,after:80},border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.mpink,space:1}},children:[new TextRun("")]});

const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:360,after:100},children:[new TextRun({text:t,bold:true,size:34,color:C.pink,font:"Arial"})]});
const h2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:240,after:80},children:[new TextRun({text:t,bold:true,size:26,color:C.dpink,font:"Arial"})]});
const h3=t=>new Paragraph({spacing:{before:160,after:60},children:[new TextRun({text:t,bold:true,size:23,color:C.dgrey,font:"Arial"})]});
const body=t=>new Paragraph({spacing:{before:50,after:50},children:[new TextRun({text:t,size:20,color:C.grey,font:"Arial"})]});
const bul=t=>new Paragraph({numbering:{reference:"b1",level:0},spacing:{before:36,after:36},children:[new TextRun({text:t,size:20,color:C.grey,font:"Arial"})]});
const bul2=t=>new Paragraph({numbering:{reference:"b2",level:0},spacing:{before:26,after:26},children:[new TextRun({text:t,size:19,color:C.grey,font:"Arial"})]});
const num=t=>new Paragraph({numbering:{reference:"n1",level:0},spacing:{before:36,after:36},children:[new TextRun({text:t,size:20,color:C.grey,font:"Arial"})]});

function box(lines,bg,tc,bold_starts=["【","■","⚠","✅","❌","★","※"]){
  return new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[9400],
    rows:lines.map((l,i)=>new TableRow({children:[new TableCell({
      borders:nbs,width:{size:9400,type:WidthType.DXA},
      shading:{fill:bg,type:ShadingType.CLEAR},
      margins:{top:i===0?130:45,bottom:i===lines.length-1?130:45,left:200,right:200},
      children:[new Paragraph({children:[new TextRun({text:l,size:20,font:"Arial",color:tc,
        bold:bold_starts.some(s=>l.startsWith(s))
      })]})]
    })]}))
  });
}

function hrow(labels,widths){
  return new TableRow({tableHeader:true,children:labels.map((l,i)=>new TableCell({
    borders:bdrs,width:{size:widths[i],type:WidthType.DXA},
    shading:{fill:C.pink,type:ShadingType.CLEAR},
    margins:{top:90,bottom:90,left:130,right:130},
    children:[new Paragraph({children:[new TextRun({text:l,bold:true,size:19,color:C.white,font:"Arial"})]})]
  }))});
}
function drow(cells,widths,alt=false){
  return new TableRow({children:cells.map((t,i)=>new TableCell({
    borders:bdrs,width:{size:widths[i],type:WidthType.DXA},
    shading:{fill:alt?C.lgrey:C.white,type:ShadingType.CLEAR},
    margins:{top:70,bottom:70,left:130,right:130},
    children:[new Paragraph({children:[new TextRun({text:String(t),size:19,font:"Arial",color:C.grey})]})]
  }))});
}
function crow(cells,widths,colors){
  return new TableRow({children:cells.map((t,i)=>new TableCell({
    borders:bdrs,width:{size:widths[i],type:WidthType.DXA},
    shading:{fill:colors[i]||C.white,type:ShadingType.CLEAR},
    margins:{top:70,bottom:70,left:130,right:130},
    children:[new Paragraph({children:[new TextRun({text:String(t),size:19,font:"Arial",color:C.dgrey,bold:i===0})]})]
  }))});
}

const doc=new Document({
  numbering:{config:[
    {reference:"b1",levels:[{level:0,format:LevelFormat.BULLET,text:"●",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:520,hanging:260}}}}]},
    {reference:"b2",levels:[{level:0,format:LevelFormat.BULLET,text:"◦",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:780,hanging:260}}}}]},
    {reference:"n1",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:520,hanging:260}}}}]},
  ]},
  styles:{
    default:{document:{run:{font:"Arial",size:20}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:34,bold:true,font:"Arial",color:C.pink},paragraph:{spacing:{before:360,after:100},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:26,bold:true,font:"Arial",color:C.dpink},paragraph:{spacing:{before:240,after:80},outlineLevel:1}},
    ]
  },
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1080,right:1080,bottom:1080,left:1080}}},
    headers:{default:new Header({children:[new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.mpink,space:3}},
      children:[new TextRun({text:"ふぅ (fuu)　完全版マスター仕様書 Ver 3.0　　妻名義・PWA構成・機密",bold:true,size:19,color:C.pink,font:"Arial"})]
    })]})},
    footers:{default:new Footer({children:[new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:4,color:C.mpink,space:3}},
      alignment:AlignmentType.RIGHT,
      children:[
        new TextRun({text:`作成日 ${new Date().toLocaleDateString('ja-JP')}　社長×CEO　　`,size:18,color:C.grey,font:"Arial"}),
        new TextRun({children:[PageNumber.CURRENT],size:18,color:C.grey,font:"Arial"}),
      ]
    })]})},

    children:[
    // ══════════ COVER ══════════
    ...sp(3),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"ふぅ",bold:true,size:112,color:C.pink,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:40},children:[new TextRun({text:"fuu",size:52,color:C.mpink,font:"Arial",italics:true})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:140},children:[new TextRun({text:"10人のAIママ友とエモいJ-POPが流れる隠れ家SNS",size:26,color:C.grey,font:"Arial"})]}),
    ...sp(1),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2350,2350,2350,2350],rows:[new TableRow({children:[
      ...[["💬","聞いてあげる","解決せず寄り添う"],["🎵","エモBGM","世代別懐かしJ-POP"],["🤫","完全匿名","誰にも言えないことを"],["👩","妻名義","リスクフリー運営"]].map(([e,t,s])=>
        new TableCell({borders:nbs,width:{size:2350,type:WidthType.DXA},shading:{fill:C.lpink,type:ShadingType.CLEAR},margins:{top:140,bottom:140,left:140,right:140},children:[
          new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:e+" "+t,bold:true,size:22,color:C.pink,font:"Arial"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:40},children:[new TextRun({text:s,size:18,color:C.grey,font:"Arial"})]})
        ]})
      )
    ]})]}),
    ...sp(2),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"完全版マスター仕様書　Ver 3.0",size:24,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60},children:[new TextRun({text:"妻名義・PWA（Next.js）＋ Claude API ＋ Stripe構成",size:21,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:40},children:[new TextRun({text:`${new Date().toLocaleDateString('ja-JP')}　社長（オーナー）× CEO（Claude）`,size:19,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:30},children:[new TextRun({text:"※ 本書は機密情報を含みます。外部共有・転用禁止。",size:17,color:C.red,font:"Arial",italics:true})]}),

    // ══════════ Ch1：企画概要 ══════════
    pgbrk(),h1("第1章　企画概要"),div(),
    h2("1-1．サービスコンセプト"),
    box([
      "【ふぅ（fuu）とは？】",
      "",
      "子育て中のママは毎日、誰にも言えない孤独と悩みを抱えている。",
      "でも「ふぅ」は解決しようとしない。ただ、聞いてあげる。ただ、寄り添う。",
      "夜、子どもが寝静まったあとにひっそりスマホを開いたとき——",
      "タイムラインには仲間のAIママ友がリアルなつぶやきを投稿していて、",
      "懐かしいBGMがさりげなく流れている。そんな「隠れ家」体験を月100円で提供する。",
      "",
      "「同じ悩みで苦しんでいるママは何万人もいる。みんな表に出していないだけ。」",
      "このサービスは、その孤独を静かに溶かすために存在する。",
    ],C.lpink,C.dpink),
    ...sp(1),
    h2("1-2．確定事項サマリー"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2600,6800],rows:[
      hrow(["項目","内容"],[2600,6800]),
      drow(["アプリ名","ふぅ（fuu）"],[2600,6800],false),
      drow(["事業主","妻（個人事業主・開業届済み）"],[2600,6800],true),
      drow(["ターゲット","20〜50代の子育て中のママ"],[2600,6800],false),
      drow(["提供価値","悩み解決ではなく傾聴・共感・一息"],[2600,6800],true),
      drow(["スタンダード","年払い¥1,200（実質¥100/月）・初月無料"],[2600,6800],false),
      drow(["プレミアム","月払い¥980・音声通話60分・BGMチャンネル・カスタムペルソナ"],[2600,6800],true),
      drow(["AIペルソナ","10人（20代×2、30代×4、40代×3、50代×1）"],[2600,6800],false),
      drow(["技術スタック","Next.js（PWA）＋ Claude API ＋ Stripe ＋ Supabase ＋ Vercel"],[2600,6800],true),
      drow(["音声機能","OpenAI Realtime API（プレミアム・月60分）"],[2600,6800],false),
      drow(["BGM","著作権フリー音源（Pixabay・甘茶の音楽工房等）"],[2600,6800],true),
      drow(["決済手数料","Stripe 3.6%（Apple/Googleの15%より大幅有利）"],[2600,6800],false),
      drow(["初期投資","社長の持ち出し¥0（OpenAI API初期クレジット約¥700のみ）"],[2600,6800],true),
      drow(["フェーズ2","収益安定後にReact Native（Expo）でネイティブアプリ化"],[2600,6800],false),
    ]}),

    // ══════════ Ch2：要件定義 ══════════
    pgbrk(),h1("第2章　要件定義"),div(),
    h2("2-1．機能要件"),
    h3("■ フリー機能（無料・初月）"),
    bul("SNS風タイムライン：10人のAIペルソナのリアルなつぶやきを表示"),
    bul("お試しチャット：特定3人のペルソナとテキスト会話（各5回まで）"),
    bul("BGM自動再生：起動時にAIおまかせBGMが静かに流れる"),
    bul("会員登録：メール or Google/Apple SSOで登録"),
    ...sp(1),
    h3("■ スタンダード機能（¥100/月・年払い）"),
    bul("10人全ペルソナとのテキストチャット無制限"),
    bul("AIおまかせBGM自動再生（全員一律）"),
    bul("チャット履歴の保存・閲覧"),
    bul("プッシュ通知（ペルソナからの「最近どう？」通知）"),
    ...sp(1),
    h3("■ プレミアム機能（¥980/月）"),
    bul("スタンダード全機能"),
    bul("リアルタイム音声通話（月60分・OpenAI Realtime API）"),
    bul("BGMチャンネル変更・曲リクエスト"),
    bul("カスタムペルソナ作成（4ステップ：年齢/性格/ライフスタイル/経済状況）"),
    bul("専用ペルソナへの優先接続（待機なし）"),
    ...sp(1),
    h2("2-2．非機能要件"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2200,7200],rows:[
      hrow(["要件","内容"],[2200,7200]),
      drow(["セキュリティ","チャットログはAES-256暗号化。Supabase行レベルセキュリティ。HTTPS必須"],[2200,7200],false),
      drow(["プライバシー","会話内容をAI学習に使用しない。退会後90日で完全削除"],[2200,7200],true),
      drow(["可用性","Vercel/Supabaseの99.9%SLA準拠。障害時は自動フェールオーバー"],[2200,7200],false),
      drow(["パフォーマンス","チャット応答3秒以内。タイムライン表示1秒以内"],[2200,7200],true),
      drow(["スケーラビリティ","Vercel Edge Functions + Supabaseで最大10万ユーザーまで無改修対応"],[2200,7200],false),
      drow(["対応端末","スマートフォン（iOS Safari / Android Chrome）・PC"],[2200,7200],true),
      drow(["PWA対応","ホーム画面追加・オフライン表示・プッシュ通知対応"],[2200,7200],false),
      drow(["AI開示","全ペルソナのプロフィールに「AIキャラクター」と明記"],[2200,7200],true),
    ]}),
    ...sp(1),
    h2("2-3．技術スタック詳細"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1800,2200,2200,3200],rows:[
      hrow(["レイヤー","採用技術","無料枠","選定理由"],[1800,2200,2200,3200]),
      drow(["フロントエンド","Next.js 14（PWA）","Vercel Free","Reactベース。SEO対応。PWA化が容易"],[1800,2200,2200,3200],false),
      drow(["ホスティング","Vercel","100GB/月無料","Next.jsと完全統合。デプロイ即時"],[1800,2200,2200,3200],true),
      drow(["データベース","Supabase","500MB無料","PostgreSQL。認証・リアルタイム内蔵"],[1800,2200,2200,3200],false),
      drow(["AI会話","Claude Haiku","従量課金","共感・日本語精度が最高。安価"],[1800,2200,2200,3200],true),
      drow(["AI音声","OpenAI Realtime API","従量課金","低遅延音声対話。代替なし"],[1800,2200,2200,3200],false),
      drow(["決済","Stripe","手数料3.6%のみ","サブスク管理。Apple/Googleの15%より大幅有利"],[1800,2200,2200,3200],true),
      drow(["メール通知","Resend","3,000通/月無料","トランザクションメール送信"],[1800,2200,2200,3200],false),
      drow(["BGM管理","Supabase Storage","1GB無料","著作権フリー音源ファイルを格納"],[1800,2200,2200,3200],true),
    ]}),

    h2("2-4．全体アーキテクチャ＆ユーザーフロー"),
    box([
      "【重要】ふぅはWebアプリ（PWA）です",
      "Next.js PWA を Vercel にデプロイする構成のため、1つのドメインがすべての住所になります。",
      "LP（新規獲得ページ）・アプリ本体・法的ページ（利用規約・特商法）が同じドメイン内に共存します。",
      "iOSアプリ・Androidアプリは Phase 2 以降にReact Native（Expo）で追加予定。初期は不要です。",
    ],C.lblue,C.blue),
    ...sp(1),
    h3("■ ドメイン・屋号・サービス名の関係"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2400,3000,4000],rows:[
      hrow(["区分","名称","用途・説明"],[2400,3000,4000]),
      drow(["屋号（法的名義）","OGDStudio","開業届・特商法表示・Stripe・契約書類の名義。ユーザーはほぼ目にしない"],[2400,3000,4000],false),
      drow(["サービスブランド","fuu　ふぅ","ユーザーが見るブランド名。LP・アプリ・SNS・広告すべてこの名前"],[2400,3000,4000],true),
      drow(["ドメイン（住所）","fuu-app.jp 等","LP〜アプリ〜法的ページすべてを格納する唯一のURL"],[2400,3000,4000],false),
      drow(["OGDStudioサイト","不要（当面）","ふぅ1サービスのみの間は不要。2サービス目追加時または法人化時に検討"],[2400,3000,4000],true),
    ]}),
    ...sp(1),
    h3("■ ドメイン内のページ構成"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2000,2000,5400],rows:[
      hrow(["URL","ページ名","内容・役割"],[2000,2000,5400]),
      drow(["fuu-app.jp/（トップ）","ランディングページ","新規ユーザー獲得の入口。サービス説明・料金・登録ボタン"],[2000,2000,5400],false),
      drow(["/login　/register","認証ページ","メール登録・Googleログイン。Supabase Auth連携"],[2000,2000,5400],true),
      drow(["/app","メインアプリ","ログイン後の本体。チャット・タイムライン・BGM再生"],[2000,2000,5400],false),
      drow(["/app/chat/:id","個別チャット","ペルソナとの1:1テキスト会話（プレミアムは音声も）"],[2000,2000,5400],true),
      drow(["/app/settings","設定","プラン変更・ペルソナ管理・BGM設定"],[2000,2000,5400],false),
      drow(["/terms","利用規約","第12章の利用規約をそのまま掲載"],[2000,2000,5400],true),
      drow(["/privacy","プライバシーポリシー","個人情報の取り扱い"],[2000,2000,5400],false),
      drow(["/tokusho","特定商取引法表示","OGDStudio・妻の本名・住所（バーチャルオフィス可）を記載。法定必須"],[2000,2000,5400],true),
    ]}),
    ...sp(1),
    h3("■ ユーザーが辿る流れ（全体フロー）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[700,2000,6700],rows:[
      hrow(["Step","経路","詳細"],[700,2000,6700]),
      drow(["①","SNS / 口コミ","X・TikTok・Instagram の投稿またはママ友口コミでサービスを知る"],[700,2000,6700],false),
      drow(["②","LP閲覧","fuu-app.jp にアクセス → サービス内容・料金を確認"],[700,2000,6700],true),
      drow(["③","無料登録","メールまたはGoogleアカウントでアカウント作成（初月無料）"],[700,2000,6700],false),
      drow(["④","お試し利用","3人のペルソナと各5回チャット・BGMを体験"],[700,2000,6700],true),
      drow(["⑤","Stripe決済","スタンダード¥100/月 or プレミアム¥980/月を選択してカード登録"],[700,2000,6700],false),
      drow(["⑥","アプリ利用","ブラウザからアクセス。PWAとしてホーム画面に追加可能"],[700,2000,6700],true),
      drow(["⑦","継続 or 解約","年払いで解約率低減。解約はStripeポータルから自己完結"],[700,2000,6700],false),
    ]}),
    ...sp(1),
    h3("■ 外部サービス連携マップ"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2200,1800,2200,3200],rows:[
      hrow(["サービス","役割","通信方向","名義"],[2200,1800,2200,3200]),
      drow(["Supabase","DB・認証・Storage","Next.js ↔ Supabase","妻名義（最初から）"],[2200,1800,2200,3200],false),
      drow(["Claude API（Anthropic）","AIテキスト会話","Next.js → Claude API","開発中:社長 → ローンチ:妻"],[2200,1800,2200,3200],true),
      drow(["OpenAI Realtime API","音声会話（プレミアム）","Next.js → OpenAI","開発中:社長 → ローンチ:妻"],[2200,1800,2200,3200],false),
      drow(["Stripe","サブスク決済処理","ユーザー → Stripe → 妻口座","妻名義（最初から）"],[2200,1800,2200,3200],true),
      drow(["Vercel","ホスティング・デプロイ","GitHub → Vercel → ユーザー","開発中:社長 → ローンチ:妻"],[2200,1800,2200,3200],false),
      drow(["Resend","メール通知送信","Supabase Edge → Resend → ユーザー","開発中:社長 → ローンチ:妻"],[2200,1800,2200,3200],true),
    ]}),

    // ══════════ Ch3：日々のタスク ══════════
    pgbrk(),h1("第3章　日々の運営タスク"),div(),
    h2("3-1．開発フェーズ中（ローンチまで）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1400,2000,6000],rows:[
      hrow(["頻度","担当","タスク内容"],[1400,2000,6000]),
      drow(["毎日","社長","コーディング・テスト・バグ修正・CEOへの進捗共有"],[1400,2000,6000],false),
      drow(["週1回","社長+妻","週次レビュー：進捗確認・仕様調整・デザインフィードバック"],[1400,2000,6000],true),
      drow(["週1回","社長+妻","SNSプレ告知：「作ってるよ」投稿でフォロワー獲得を開始（社長が下書き、妻が投稿）"],[1400,2000,6000],false),
      drow(["随時","妻（社長がサポート）","Stripe/Supabaseアカウント開設（第5章参照）・社長が設定手順を用意"],[1400,2000,6000],true),
      drow(["随時","妻（社長が書類作成）","総務省 電気通信事業届出の提出（社長が記載内容を作成・妻が提出）"],[1400,2000,6000],false),
      drow(["ローンチ前","社長+妻","βテスト：知人ママ5〜10人に使ってもらいフィードバック収集"],[1400,2000,6000],true),
    ]}),
    ...sp(1),
    h2("3-2．ローンチ後（運営フェーズ）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1400,2000,6000],rows:[
      hrow(["頻度","担当","タスク内容"],[1400,2000,6000]),
      drow(["毎日","社長","エラーログ確認（Vercelダッシュボード）・AIの異常応答チェック"],[1400,2000,6000],false),
      drow(["毎日","妻+社長","ユーザーからの問い合わせ対応（メール）・SNSコメント返信（社長も状況確認・返信補助）"],[1400,2000,6000],true),
      drow(["週3回","社長+妻","X・Instagram・TikTok投稿（社長がネタ出し・下書き、妻がアカウントから投稿）"],[1400,2000,6000],false),
      drow(["週1回","社長","Stripeダッシュボードで売上・解約数を確認・記録・妻に共有"],[1400,2000,6000],true),
      drow(["週1回","社長+妻","KPI確認：会員数・解約率・プレミアム転換率・収益"],[1400,2000,6000],false),
      drow(["月1回","社長","AIペルソナのつぶやき内容を更新（季節・流行に合わせて）"],[1400,2000,6000],true),
      drow(["月1回","社長","BGM新曲を追加（Pixabay等から調達・アップロード）"],[1400,2000,6000],false),
      drow(["月1回","社長+妻","売上データをfreee等に入力・経費の記帳（社長が仕訳を整理、妻が承認・保存）"],[1400,2000,6000],true),
      drow(["3ヶ月毎","社長+妻","プロモーション施策レビュー・次フェーズ計画"],[1400,2000,6000],false),
      drow(["年1回","妻（社長がデータ準備）","確定申告（青色申告・2月16日〜3月15日）。社長が収支データをまとめて渡す"],[1400,2000,6000],true),
    ]}),
    ...sp(1),
    box([
      "【自動化で運営工数を最小化する仕組み】",
      "● 解約予兆検知：14日未ログイン → ペルソナから自動プッシュ通知（Supabase Edge Functions）",
      "● タイムライン投稿：Claude APIで週次バッチ生成 → 自動投稿（社長が月1回プロンプト調整のみ）",
      "● Stripe Webhookで支払い失敗 → 自動メール通知（Resend）",
      "● Vercel Analyticsで異常トラフィック → Slackに自動アラート",
    ],C.lteal,C.teal),

    // ══════════ Ch4：売上利益計画 ══════════
    pgbrk(),h1("第4章　売上利益計画"),div(),
    h2("4-1．前提条件"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[3000,6400],rows:[
      hrow(["項目","前提値"],[3000,6400]),
      drow(["プレミアム比率","全会員の15%"],[3000,6400],false),
      drow(["スタンダード単価","¥100/月（年払い¥1,200の月割）"],[3000,6400],true),
      drow(["プレミアム単価","¥980/月"],[3000,6400],false),
      drow(["Stripe手数料","3.6%（Apple/Googleの15%より大幅有利）"],[3000,6400],true),
      drow(["AIコスト（スタンダード）","¥15/月/人（Claude Haiku テキスト）"],[3000,6400],false),
      drow(["AIコスト（プレミアム）","¥400/月/人（Claude Haiku + OpenAI Realtime 60分）"],[3000,6400],true),
      drow(["インフラコスト","¥0〜¥2,500/月（Vercel/Supabase無料枠→Pro移行）"],[3000,6400],false),
      drow(["KPI","3ヶ月:100人 / 6ヶ月:1,000人 / 1年:3,000人 / 2年:5,000人"],[3000,6400],true),
    ]}),
    ...sp(1),
    h2("4-2．フェーズ別 月間収支シミュレーション"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1300,1100,1100,1500,1300,1200,1900],rows:[
      hrow(["フェーズ","会員数","プレミアム","月間総売上","Stripe手数料","AI+インフラ","月間純利益"],[1300,1100,1100,1500,1300,1200,1900]),
      crow(["3ヶ月後","100人","15人","¥23,200","¥835","¥7,275","¥15,090"],[1300,1100,1100,1500,1300,1200,1900],[C.white,C.white,C.white,C.white,C.white,C.white,C.lgreen]),
      crow(["6ヶ月後","1,000人","150人","¥232,000","¥8,352","¥72,750","¥150,898"],[1300,1100,1100,1500,1300,1200,1900],[C.lgrey,C.lgrey,C.lgrey,C.lgrey,C.lgrey,C.lgrey,C.lgreen]),
      crow(["1年後","3,000人","450人","¥696,000","¥25,056","¥220,750","¥450,194"],[1300,1100,1100,1500,1300,1200,1900],[C.white,C.white,C.white,C.white,C.white,C.white,C.lgreen]),
      crow(["2年後","5,000人","750人","¥1,160,000","¥41,760","¥366,250","¥751,990"],[1300,1100,1100,1500,1300,1200,1900],[C.lgrey,C.lgrey,C.lgrey,C.lgrey,C.lgrey,C.lgrey,C.lgreen]),
    ]}),
    new Paragraph({spacing:{before:70},children:[new TextRun({text:"※ 1年後以降はVercel Pro（¥2,500/月）を計上。2年後はAI単価交渉で10〜15%削減見込み。",size:17,color:C.grey,font:"Arial",italics:true})]}),
    ...sp(1),
    h2("4-3．Stripe vs Apple/Google　手数料比較"),
    box([
      "【Stripe（本プラン）で得られる追加利益】",
      "",
      "3ヶ月後（¥23,200売上）：Stripe¥835 vs Apple/Google¥3,480 → 月¥2,645お得",
      "6ヶ月後（¥232,000売上）：Stripe¥8,352 vs Apple/Google¥34,800 → 月¥26,448お得",
      "1年後（¥696,000売上）：Stripe¥25,056 vs Apple/Google¥104,400 → 月¥79,344お得",
      "2年後（¥1,160,000売上）：Stripe¥41,760 vs Apple/Google¥174,000 → 月¥132,240お得",
      "",
      "★ 2年間の累計でStripe採用により約¥200万円以上の手数料節約効果（試算）",
    ],C.lgreen,C.green),
    ...sp(1),
    h2("4-4．フェーズ達成時点の月間収益（MRR）サマリー"),
    body("※ 下表は各マイルストーン達成時点の「その月の収益」です。年間累計とは異なります。"),
    ...sp(1),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1700,1800,1900,1900,2100],rows:[
      hrow(["フェーズ","月間MRR（概算）","月間純利益（概算）","年換算MRR（参考）","妻の所得区分"],[1700,1800,1900,1900,2100]),
      drow(["3ヶ月後（100人）","¥23,200","¥15,090","¥181,080/年","雑所得or事業所得"],[1700,1800,1900,1900,2100],false),
      drow(["6ヶ月後（1,000人）","¥232,000","¥150,898","¥1,810,776/年","事業所得（要freee）"],[1700,1800,1900,1900,2100],true),
      drow(["1年後（3,000人）","¥696,000","¥450,194","¥5,402,328/年","事業所得（青色申告必須）"],[1700,1800,1900,1900,2100],false),
      drow(["2年後（5,000人）","¥1,160,000","¥751,990","¥9,023,880/年","事業所得（税理士推奨）"],[1700,1800,1900,1900,2100],true),
    ]}),
    new Paragraph({spacing:{before:70},children:[new TextRun({text:"※「年換算MRR」はその月の収益×12の参考値。実際の年間累計はユーザー成長カーブを加味した下記を参照。",size:17,color:C.grey,font:"Arial",italics:true})]}),
    ...sp(1),
    h2("4-5．実績ベースの年間累計収益（成長カーブ加味）"),
    body("実際にはユーザーが年間を通じて増加するため、以下が現実的な年間累計の試算です。"),
    ...sp(1),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2000,2300,2300,2800],rows:[
      hrow(["年度","年間総売上（実績ベース）","年間純利益（実績ベース）","妻の事業所得目安"],[2000,2300,2300,2800]),
      drow(["1年目（0→3,000人）","約¥320万","約¥208万","約¥208万"],[2000,2300,2300,2800],false),
      drow(["2年目（3,000→5,000人）","約¥1,114万","約¥724万","約¥724万"],[2000,2300,2300,2800],true),
    ]}),
    new Paragraph({spacing:{before:70},children:[new TextRun({text:"※ 計算根拠：各四半期の平均ユーザー数×ARPU×3ヶ月で積算。1年目Q1平均50人/Q2平均550人/Q3-Q4平均2,000人。2年目平均4,000人。利益率約65%で換算。",size:17,color:C.grey,font:"Arial",italics:true})]}),

    // ══════════ Ch5：メリット・デメリット ══════════
    pgbrk(),h1("第5章　メリット・デメリット"),div(),
    h2("5-1．サービスのメリット"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2400,7000],rows:[
      hrow(["対象","メリット"],[2400,7000]),
      drow(["ユーザー（ママ）","月100円という「お守り」価格。続けやすく、やめやすい。心理的ハードルが極めて低い"],[2400,7000],false),
      drow(["ユーザー（ママ）","誰にも言えない育児の孤独を、AIが24時間・匿名で聞いてくれる"],[2400,7000],true),
      drow(["ユーザー（ママ）","10人の多様なペルソナから「今の自分に合う相手」を選べる"],[2400,7000],false),
      drow(["ユーザー（ママ）","懐かしいBGMが流れることでノスタルジーと安らぎを同時に体験できる"],[2400,7000],true),
      drow(["事業（妻）","Stripeで手数料3.6%。Apple/Googleの15%と比べて大幅有利"],[2400,7000],false),
      drow(["事業（妻）","持ち出し0円スタート。AI駆動開発で外注費不要"],[2400,7000],true),
      drow(["事業（妻）","変動費型コスト構造。会員が増えるほど利益が積み上がる"],[2400,7000],false),
      drow(["事業（妻）","解約率が低いサブスク（年払いのストック収入）"],[2400,7000],true),
      drow(["社会","育児の孤独という社会課題にアプローチする意義あるサービス"],[2400,7000],false),
    ]}),
    ...sp(1),
    h2("5-2．デメリット・リスクと対策"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2800,3200,3400],rows:[
      hrow(["デメリット・リスク","影響度","対策"],[2800,3200,3400]),
      drow(["App Store非掲載で発見されにくい","中：流入機会の損失","SNS・PR・SEOで直接流入を獲得。フェーズ2でアプリ化"],[2800,3200,3400],false),
      drow(["AIの回答が不適切になる可能性","高：ユーザー離脱・炎上リスク","システムプロンプトで厳格にルール設定。定期的な回答品質チェック"],[2800,3200,3400],true),
      drow(["OpenAI Realtime APIのコスト変動","中：プレミアム収益を圧迫","月60分の使用制限で上限コントロール。980円から余裕で回収"],[2800,3200,3400],false),
      drow(["精神的に深刻なユーザーへの対応","高：法的リスク・道義的責任","チャット内に「専門相談窓口」を常設。利用規約に免責明記"],[2800,3200,3400],true),
      drow(["競合サービスの参入","中：会員獲得競争","ペルソナの質・BGMのエモさ・価格で差別化。先行者利益を築く"],[2800,3200,3400],false),
      drow(["妻の運営負担増加","低：モチベーション低下","自動化で日次作業を最小化。問い合わせ対応テンプレート整備"],[2800,3200,3400],true),
      drow(["Claude APIの料金改定","低：コスト増","複数プロバイダー対応可能な設計にしておく（API抽象化）"],[2800,3200,3400],false),
    ]}),

    // ══════════ Ch6：法的リーガルチェック ══════════
    pgbrk(),h1("第6章　法的リーガルチェック（最終版）"),div(),
    box(["【免責】本章はAI（CEO）による法的考慮事項の整理です。ローンチ前に弁護士へのスポット相談（¥10,000〜¥30,000）を推奨します。"],C.lred,C.red),
    ...sp(1),
    h2("6-1．チェック結果サマリー"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[3200,1000,5200],rows:[
      hrow(["法律・規制","判定","対応内容"],[3200,1000,5200]),
      drow(["医師法・公認心理師法（医療行為との境界）","✅","免責文言をアプリ内・利規に明記。緊急相談先を常設"],[3200,1000,5200],false),
      drow(["景品表示法（誇大広告）","✅","「AIが話を聞く」と正確に表現。効果を誇張しない"],[3200,1000,5200],true),
      drow(["AIキャラクター開示義務","✅","全ペルソナプロフィールに「AIキャラクター」と明記"],[3200,1000,5200],false),
      drow(["電気通信事業法（届出）","⚠️要対応","総務省へ無料オンライン届出。ローンチ前に完了"],[3200,1000,5200],true),
      drow(["特定商取引法（通信販売）","⚠️要対応","特商法ページ作成（事業者名・住所・解約方法等を記載）"],[3200,1000,5200],false),
      drow(["消費者契約法","✅","利用規約の免責を「重過失を除く」に限定"],[3200,1000,5200],true),
      drow(["個人情報保護法","⚠️要対応","プライバシーポリシー作成・暗号化保存・同意取得"],[3200,1000,5200],false),
      drow(["外部送信規律（Claude API等への送信）","⚠️要対応","初回起動時に外部送信の同意取得UI実装"],[3200,1000,5200],true),
      drow(["著作権法（BGM）","✅","著作権フリー音源のみ使用。各サービスの利用規約を確認"],[3200,1000,5200],false),
      drow(["未成年者保護","✅","18歳以上限定を利規に明記・年齢確認UI実装"],[3200,1000,5200],true),
      drow(["反社会的勢力排除","✅","利用規約に排除条項を明記"],[3200,1000,5200],false),
    ]}),
    ...sp(1),
    h2("6-2．電気通信事業届出の手順"),
    box([
      "【手順】総務省 電気通信事業届出（無料・オンライン・15分で完了）",
      "",
      "① 総務省「電気通信事業届出・登録システム」にアクセス",
      "  URL: https://musen-shinsei.soumu.go.jp/",
      "② 「電気通信事業の届出」を選択",
      "③ 事業者情報入力：妻の氏名・住所（バーチャルオフィスOK）・屋号",
      "④ 提供するサービス内容を入力：「AIを活用したチャットサービスの提供」",
      "⑤ 提出 → 受理通知が届いたら完了",
      "",
      "※ ローンチの2週間前までに提出すること",
      "※ 届出後は「外部送信規律」に従い、プライバシーポリシーへの記載が義務",
    ],C.lblue,C.blue),

    // ══════════ Ch7：経理処理 ══════════
    pgbrk(),h1("第7章　経理処理"),div(),
    box(["【推奨】freee（個人事業主プラン ¥1,980/月）またはマネーフォワードクラウド確定申告を使用。領収書のスマホ撮影で自動仕分け可能。"],C.lteal,C.teal),
    ...sp(1),
    h2("7-1．売上の記帳"),
    bul("Stripeダッシュボード → 「支払い」→「CSVエクスポート」で月次売上データを取得"),
    bul("売上の勘定科目：「売上高」で計上"),
    bul("Stripeが自動で源泉徴収等は行わない。売上全額を計上し、手数料を経費に"),
    bul("Stripe手数料の勘定科目：「支払手数料」で計上"),
    bul("初月無料分：実際の課金なし。売上計上なし（会計処理不要）"),
    ...sp(1),
    h2("7-2．経費として計上できる主な項目"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2800,2200,4400],rows:[
      hrow(["経費項目","勘定科目","備考"],[2800,2200,4400]),
      drow(["Claude API利用料","外注費 or 通信費","月次でAnthropicから請求書取得"],[2800,2200,4400],false),
      drow(["OpenAI API利用料","外注費 or 通信費","月次でOpenAIから請求書取得"],[2800,2200,4400],true),
      drow(["Stripe手数料","支払手数料","Stripe月次明細から計上"],[2800,2200,4400],false),
      drow(["Apple Developer ¥11,800/年","諸会費","年1回。クレジットカード明細保管"],[2800,2200,4400],true),
      drow(["Google Play Console ¥2,500","諸会費","初回のみ。領収書保管"],[2800,2200,4400],false),
      drow(["バーチャルオフィス代","地代家賃","月次明細保管"],[2800,2200,4400],true),
      drow(["スマートフォン代（按分）","通信費","事業利用割合×金額を計上（50〜80%程度）"],[2800,2200,4400],false),
      drow(["通信費（ネット回線）","通信費","事業利用割合で按分（50%程度）"],[2800,2200,4400],true),
      drow(["freee/MFクラウド利用料","諸会費","全額経費"],[2800,2200,4400],false),
      drow(["弁護士・税理士相談費","顧問料 or 支払報酬","全額経費"],[2800,2200,4400],true),
      drow(["インフルエンサー謝礼","広告宣伝費","振込明細・請求書を保管"],[2800,2200,4400],false),
      drow(["広告費（Meta/Google）","広告宣伝費","月次明細を保管"],[2800,2200,4400],true),
    ]}),
    ...sp(1),
    h2("7-3．消費税・インボイス"),
    box([
      "■ 消費税：免税事業者（当面）",
      "妻の既存事業を含めた年間売上が¥1,000万円以下であれば消費税の納税義務なし。",
      "ふぅの2年後想定売上（¥1,390万/年）は免税ラインを超える可能性あり。",
      "→ 売上が¥800万円を超えてきたタイミングで税理士に相談すること。",
      "",
      "■ インボイス制度：対応不要（当面）",
      "ふぅのユーザーは一般消費者（B2C）のため、インボイス（適格請求書）の発行義務なし。",
      "企業との取引（B2B）が発生した場合は別途検討が必要。",
      "",
      "■ 青色申告：強く推奨",
      "妻がすでに青色申告をしている場合：そのままふぅの収益を合算申告。",
      "白色申告の場合：今期から青色申告に切り替えで65万円控除（または10万円控除）が適用。",
    ],C.lyellow,C.yellow),

    // ══════════ Ch8：奥様の手続き ══════════
    pgbrk(),h1("第8章　奥様の手続き（チェックリスト）"),div(),
    body("以下を優先度順に実施してください。★がローンチ前必須、☆は余裕があれば。"),
    ...sp(1),
    h2("8-1．開発前〜開発中（今すぐ〜3ヶ月）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[600,2600,3200,3000],rows:[
      hrow(["優先","手続き","具体的な作業","費用"],[600,2600,3200,3000]),
      drow(["★","事業内容の確認","既存の開業届の「事業の概要」欄にITサービスが含まれているか確認。含まれていない場合は「個人事業の開業・廃業等届出書」を再提出（業種追加）","無料"],[600,2600,3200,3000],false),
      drow(["★","屋号の決定","例：「ふぅ運営事務局」「fuu lab」等。税務署への届出に屋号を記載","無料"],[600,2600,3200,3000],true),
      drow(["★","事業用メールアドレス取得","Gmail等で「fuu.support@gmail.com」等を取得。既存メールと分離","無料"],[600,2600,3200,3000],false),
      drow(["★","Stripeアカウント開設","stripe.com → 妻名義・妻の銀行口座を登録。本人確認書類が必要","手数料3.6%のみ"],[600,2600,3200,3000],true),
      drow(["★","Supabase登録","supabase.com → 妻メールでアカウント作成","無料"],[600,2600,3200,3000],false),
      drow(["★","Vercelアカウント登録","vercel.com → 妻メールでアカウント作成","無料"],[600,2600,3200,3000],true),
      drow(["★","OpenAIアカウント登録","platform.openai.com → 妻メールで登録・$5チャージ（音声機能用）","約¥700"],[600,2600,3200,3000],false),
      drow(["★","SNSアカウント開設","X・Instagram・TikTok「ふぅ公式」アカウントを妻メールで作成","無料"],[600,2600,3200,3000],true),
      drow(["☆","バーチャルオフィス契約","特商法の住所として使用。Karigo・DMMバーチャルオフィス等","¥1,000〜¥3,000/月"],[600,2600,3200,3000],false),
    ]}),
    ...sp(1),
    h2("8-2．ローンチ3ヶ月前（必須）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[600,2600,3200,3000],rows:[
      hrow(["優先","手続き","具体的な作業","費用"],[600,2600,3200,3000]),
      drow(["★","Apple Developer登録","developer.apple.com → 妻名義で個人アカウント登録。クレジットカード決済","¥11,800/年"],[600,2600,3200,3000],false),
      drow(["★","Google Play Console登録","play.google.com/console → 妻メールで登録・初回費用のみ","¥2,500（一括）"],[600,2600,3200,3000],true),
      drow(["★","電気通信事業届出","総務省のオンラインシステムで届出（第6章参照）","無料"],[600,2600,3200,3000],false),
      drow(["★","特商法ページ作成","社長がアプリ内に作成。妻の屋号・住所・連絡先を記載","無料"],[600,2600,3200,3000],true),
      drow(["★","プライバシーポリシー公開","社長がアプリ内に実装","無料"],[600,2600,3200,3000],false),
      drow(["★","事業用銀行口座（推奨）","妻名義の別口座をふぅの売上受取専用に。Stripe振込先として設定","無料〜¥1,000"],[600,2600,3200,3000],true),
    ]}),
    ...sp(1),
    h2("8-3．ローンチ後（運営フェーズ）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[600,2600,3200,3000],rows:[
      hrow(["優先","手続き","具体的な作業","費用"],[600,2600,3200,3000]),
      drow(["★","freee or MFクラウド契約","確定申告・記帳管理ツール。スマホで領収書撮影→自動仕分け","¥1,980/月〜"],[600,2600,3200,3000],false),
      drow(["★","月次記帳","Stripeダッシュボード→CSV出力→freeeに入力（月1回・30分程度）","無料（工数）"],[600,2600,3200,3000],true),
      drow(["☆","税理士との年1回相談","確定申告前に相談。スポット依頼でOK","¥10,000〜¥30,000/回"],[600,2600,3200,3000],false),
      drow(["★","確定申告","毎年2月16日〜3月15日。青色申告で65万円控除","無料（工数）"],[600,2600,3200,3000],true),
    ]}),

    h2("8-4．社長→妻 切り替え一覧（開発→ローンチ移行計画）"),
    box([
      "【基本方針】",
      "社長が作り込んで、ローンチ直前に妻名義へ移行する。",
      "コードは一切変わらない。「APIキーを差し替える」「プロジェクトを移管する」だけで完了するものがほとんど。",
      "Stripe・Supabase本番・Google Play の3つだけは最初から妻名義が必須（後から変更不可または困難）。",
    ],C.lpink,C.dpink),
    ...sp(1),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2000,1600,1600,4200],rows:[
      hrow(["アカウント/サービス","開発中","ローンチ時","移行方法・備考"],[2000,1600,1600,4200]),
      crow(["【最初から妻名義】","","",""],[2000,1600,1600,4200],[C.lpink,C.lpink,C.lpink,C.lpink]),
      drow(["Stripe","—","妻名義で開設","銀行口座と本人確認が紐づくため移行不可。最初から妻で作成"],[2000,1600,1600,4200],false),
      drow(["Supabase（本番DB）","—","妻名義で開設","本番データが入るので最初から妻のorgに作成"],[2000,1600,1600,4200],true),
      drow(["Google Play Console","—","妻名義で開設","アカウント移管不可の仕様。Phase 2 前に妻で登録"],[2000,1600,1600,4200],false),
      drow(["SNSアカウント（X/IG/TikTok）","—","妻名義で開設","公開アカウントなので最初から妻メールで作成"],[2000,1600,1600,4200],true),
      crow(["【社長で作り→ローンチ時に切り替え】","","",""],[2000,1600,1600,4200],[C.lyellow,C.lyellow,C.lyellow,C.lyellow]),
      drow(["Claude API（Anthropic）","社長アカウント","妻アカウントへ","妻がanthropic.com登録 → APIキー発行 → 本番環境変数を差替（コード変更なし）"],[2000,1600,1600,4200],false),
      drow(["OpenAI API","社長アカウント","妻アカウントへ","同上。platform.openai.com で妻アカウント作成 → キー差替"],[2000,1600,1600,4200],true),
      drow(["Vercel","社長アカウント","妻アカウントへ移管","Vercelの「Transfer Project」機能で妻のアカウントへ移管。GitHub連携も更新"],[2000,1600,1600,4200],false),
      drow(["Resend（メール）","社長アカウント","妻アカウントへ","resend.com で妻アカウント作成 → APIキー差替 → 送信元ドメイン再設定"],[2000,1600,1600,4200],true),
      drow(["ドメイン","社長名義で取得可","妻名義へ移管","お名前.com等のレジストラで「移管申請」。もしくは社長名義のまま継続も実害低"],[2000,1600,1600,4200],false),
      drow(["GitHub リポジトリ","社長アカウント","そのまま可","コードの保管庫。妻はアクセス不要。社長が管理継続で問題なし"],[2000,1600,1600,4200],true),
      crow(["【切り替え不要・社長が継続管理】","","",""],[2000,1600,1600,4200],[C.lgreen,C.lgreen,C.lgreen,C.lgreen]),
      drow(["Supabase（開発用）","社長アカウント","そのまま","開発・テスト用途のみ。本番とは別プロジェクトで管理"],[2000,1600,1600,4200],false),
      drow(["Vercel（プレビュー）","社長アカウント","そのまま","ブランチプレビュー・テスト環境は社長管理で継続"],[2000,1600,1600,4200],true),
    ]}),
    ...sp(1),
    h3("■ ローンチ前チェックリスト（切り替え作業）"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[600,3200,5600],rows:[
      hrow(["✓","作業","担当・所要時間"],[600,3200,5600]),
      drow(["□","妻のAnthropicアカウント作成＋Claude APIキー発行","妻が5分。社長が環境変数を差替（5分）"],[600,3200,5600],false),
      drow(["□","妻のOpenAIアカウント作成＋APIキー発行","妻が5分。社長が環境変数を差替（5分）"],[600,3200,5600],true),
      drow(["□","VercelプロジェクトをTransferして妻アカウントへ","社長がVercel管理画面から実施（10分）"],[600,3200,5600],false),
      drow(["□","ResendをStripeの送信ドメインに再設定","社長が実施（20分・DNS設定含む）"],[600,3200,5600],true),
      drow(["□","本番Supabaseのプロジェクトキー（anon key）を確認","妻のorg配下で発行されているか確認"],[600,3200,5600],false),
      drow(["□","Stripeの本番モードをオン・Webhookエンドポイント設定","社長が実施（30分）"],[600,3200,5600],true),
      drow(["□","特商法ページにOGDStudio・妻本名・住所を記載して公開","社長が実装。妻が内容確認（15分）"],[600,3200,5600],false),
      drow(["□","電気通信事業届出を妻名義で総務省に提出","妻が提出。社長が申請書内容を作成（30分）"],[600,3200,5600],true),
    ]}),

    // ══════════ Ch9：プロモーション ══════════
    pgbrk(),h1("第9章　展開プロモーションプラン"),div(),
    h2("9-1．フェーズ別施策"),
    h3("Phase 1（〜3ヶ月）　目標100人　予算¥0"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2200,7200],rows:[
      hrow(["施策","内容・具体的アクション"],[2200,7200]),
      drow(["口コミ起点","知人・ママ友10〜20人にβテスト依頼。初月無料でハードル最低"],[2200,7200],false),
      drow(["X有機投稿","妻アカウントで「育児疲れに共感してくれるAIアプリ作った」投稿。ペルソナの実際の台詞スクショを公開"],[2200,7200],true),
      drow(["Instagram有機投稿","アプリ画面・ペルソナキャラのビジュアル投稿。「今日のペルソナ一言」シリーズ"],[2200,7200],false),
      drow(["ママコミュニティ投稿","ウィメンズパーク・ままとも・みんなの育児等に体験談として自然に投稿"],[2200,7200],true),
      drow(["ASO最適化","サービス説明文に「育児 孤独 相談 愚痴 ママ友」等のキーワードを入れる"],[2200,7200],false),
    ]}),
    ...sp(1),
    h3("Phase 2（3〜6ヶ月）　目標1,000人　予算〜¥50,000"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2200,7200],rows:[
      hrow(["施策","内容・具体的アクション"],[2200,7200]),
      drow(["インスタグラマーPR","育児系インスタグラマー（フォロワー1〜5万人）5〜10人にプレミアムコードで無償PR依頼"],[2200,7200],false),
      drow(["TikTok体験動画","「AIに旦那への愚痴を言ったら…」「毒舌AIに相談した結果」等のショート動画"],[2200,7200],true),
      drow(["友達招待機能","1人招待→1ヶ月無料延長。アプリ内に招待コード機能を実装"],[2200,7200],false),
      drow(["Xバズ施策","「AIに育児の愚痴を言ったら○○と返ってきた」スレッドで共感RTを狙う"],[2200,7200],true),
      drow(["Noteブログ","妻がnoteで「AIアプリ作った理由」「孤独な育児」等のエモい記事を投稿→Google流入"],[2200,7200],false),
    ]}),
    ...sp(1),
    h3("Phase 3（6ヶ月〜1年）　目標3,000人　予算¥30,000〜¥80,000/月"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2200,7200],rows:[
      hrow(["施策","内容・具体的アクション"],[2200,7200]),
      drow(["PR・メディア掲載","MAMADAYS・ベビーカレンダー・HugMug等にプレスリリース送付。NHKあさイチ等に売り込み"],[2200,7200],false),
      drow(["Meta広告","Instagram広告。25〜45歳女性・育児関連ターゲット。CPA¥300〜¥600目標"],[2200,7200],true),
      drow(["SEO記事","「育児 孤独 相談」「ワンオペ 愚痴 聞いてくれる」等で上位を狙う記事を月2〜4本"],[2200,7200],false),
      drow(["UGC促進","ユーザーの「やってみた」投稿を公式でRT。#ふぅ ハッシュタグ運用"],[2200,7200],true),
      drow(["グッドデザイン賞応募","受賞すれば無料PR効果大。UIが整ってきたら応募検討"],[2200,7200],false),
    ]}),
    ...sp(1),
    h3("Phase 4（1〜2年）　目標5,000人　予算¥50,000〜¥120,000/月"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[2200,7200],rows:[
      hrow(["施策","内容・具体的アクション"],[2200,7200]),
      drow(["アフィリエイト","ママブログにアフィリエイト導入（1人紹介¥200〜¥500）"],[2200,7200],false),
      drow(["企業提携","保育園・産後ケアセンター・自治体との提携。「育児支援ツール」として紹介"],[2200,7200],true),
      drow(["ネイティブアプリ化","React Native（Expo）でiOS/Androidアプリを追加。App Storeに展開"],[2200,7200],false),
      drow(["コミュニティ機能","ユーザー同士の匿名交流機能追加。滞在時間増加→解約率低下"],[2200,7200],true),
      drow(["継続広告","Meta/Google広告を月¥50,000〜¥80,000で安定投下"],[2200,7200],false),
    ]}),
    ...sp(1),
    box([
      "【チャーン対策（解約防止）：プロモーションと同等に重要】",
      "● 14日未ログイン → ペルソナから自動プッシュ通知「最近どうしてる？」",
      "● 毎月新BGM追加 → 「今月の新曲が追加されました」通知で再訪を促す",
      "● 季節限定ペルソナ → 年末・母の日・夏休み等に限定キャラを期間公開",
      "● 解約前「お休みモード」 → 完全解約の前に「1ヶ月一時停止」を選べる設計",
    ],C.lpurple,C.purple),

    // ══════════ Ch10：SNS戦略 ══════════
    pgbrk(),h1("第10章　SNS戦略"),div(),
    h2("10-1．チャンネル別戦略"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1400,1600,1600,4800],rows:[
      hrow(["SNS","投稿頻度","担当","コンテンツ方針"],[1400,1600,1600,4800]),
      drow(["X（旧Twitter）","毎日〜週3","妻","「今日の一言」ペルソナ台詞・育児あるある・ユーザーのRT。短文で共感を狙う"],[1400,1600,1600,4800],false),
      drow(["Instagram","週3〜4","妻","アプリ画面スクショ・キャラクターイラスト・「今月のBGM」告知。ビジュアル重視"],[1400,1600,1600,4800],true),
      drow(["TikTok","週1〜2","妻","「AIに育児の愚痴を言ってみた」「毒舌ペルソナの返し」系ショート動画。バズ狙い"],[1400,1600,1600,4800],false),
      drow(["note","月2〜4","妻","開発秘話・孤独な育児への想い・ユーザーの声。Google検索流入を狙うSEO記事"],[1400,1600,1600,4800],true),
      drow(["LINE公式","Phase2〜","妻","登録ユーザーへのキャンペーン通知・新機能告知。友達招待コードの配布"],[1400,1600,1600,4800],false),
    ]}),
    ...sp(1),
    h2("10-2．投稿コンテンツ例"),
    h3("■ X（旧Twitter）投稿例"),
    box([
      "【毒舌ユカ（20代）のつぶやき投稿例】",
      "「今日のワンオペまじで詰んだんだが。",
      " 旦那の帰宅遅いLINE、完全に既読スルー案件でよくない？",
      " うちらお疲れサマンサすぎ泣」",
      "　→ 「わかりすぎて笑った」「うちだけじゃなかった」系のRTを狙う",
      "",
      "【妻本人の投稿例（リアリティ重視）】",
      "「子どもが寝てから一人でスマホ眺めて",
      " なんか泣きたくなること、ありませんか。",
      " そういう夜のために作りました。#ふぅ」",
    ],C.lpink,C.dpink),
    ...sp(1),
    h3("■ TikTok動画構成例"),
    box([
      "【動画タイトル例】",
      "「AIに『旦那が全然手伝ってくれない』と愚痴ったら…」",
      "",
      "【構成（60秒）】",
      "0:00〜0:05　テロップ：「育児疲れたとき、こんなアプリ使ってる」",
      "0:05〜0:20　アプリ起動→ペルソナ選択→チャット開始の画面録画",
      "0:20〜0:45　「旦那が手伝ってくれない」と入力→毒舌ユカの返答を映す",
      "0:45〜0:60　テロップ：「初月無料。月100円。夜ひとりのお守りに。#ふぅ」",
      "",
      "★ ユーザーの「やってみた」動画をリポストで拡散を加速させる",
    ],C.lpurple,C.purple),
    ...sp(1),
    h2("10-3．SNS KPIと管理"),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1800,2000,2000,3600],rows:[
      hrow(["SNS","3ヶ月目標","6ヶ月目標","重点指標"],[1800,2000,2000,3600]),
      drow(["X","フォロワー500","フォロワー2,000","インプレッション・RT数・プロフィールURL遷移"],[1800,2000,2000,3600],false),
      drow(["Instagram","フォロワー300","フォロワー1,500","保存数・プロフィール遷移・ストーリー視聴率"],[1800,2000,2000,3600],true),
      drow(["TikTok","再生10,000回","バズ1本","再生完了率・いいね率・プロフィール遷移"],[1800,2000,2000,3600],false),
      drow(["note","月500PV","月3,000PV","Google検索流入・スキ数・フォロワー"],[1800,2000,2000,3600],true),
    ]}),

    // ══════════ Ch11：スケジュール ══════════
    pgbrk(),h1("第11章　スケジュール（マイルストーン）"),div(),
    new Table({width:{size:9400,type:WidthType.DXA},columnWidths:[1200,1600,3600,3000],rows:[
      hrow(["フェーズ","期間","開発・法務マイルストーン","事業・プロモーションマイルストーン"],[1200,1600,3600,3000]),
      drow(["準備","Week 1〜2","Supabase・Vercel・Stripe・OpenAIアカウント開設（妻名義）\nDB構築SQL実行\nNext.jsプロジェクト初期設定","妻SNSアカウント開設\nプレ告知投稿開始\n屋号決定・事業内容確認"],[1200,1600,3600,3000],false),
      drow(["MVP","Week 3〜6","タイムライン画面実装\n10人ペルソナChaudeチャット実装\nBGM自動再生実装\nStripe基本サブスク連携","知人βテスト開始\nフィードバック収集\nX/Instagram毎日投稿開始"],[1200,1600,3600,3000],true),
      drow(["法務・決済","Week 7〜8","初月無料フロー完成\n利用規約・プライバシーポリシーをアプリ内実装\n特商法ページ作成\n電気通信事業届出提出（妻）","Apple Developer登録（妻）\nGoogle Play Console登録（妻）\nSNSフォロワー100人目標"],[1200,1600,3600,3000],false),
      drow(["プレミアム","Week 9〜11","音声通話（OpenAI Realtime API）実装\nBGMチャンネル選択実装\nカスタムペルソナ4ステップ実装\n月60分制限ロジック実装","インフルエンサー候補リストアップ\nPRリリース草案作成"],[1200,1600,3600,3000],true),
      drow(["審査準備","Week 12〜13","App Store申請準備\nセキュリティ最終確認\nバグ修正・負荷テスト","インフルエンサーへのPR依頼開始\nSNSフォロワー300人目標"],[1200,1600,3600,3000],false),
      drow(["ローンチ","Month 4","全機能本番公開\nVercel本番環境へデプロイ\nStripe本番モードへ切替","Phase 1プロモーション全開始\n口コミ拡散施策スタート\n目標：3ヶ月後100人"],[1200,1600,3600,3000],true),
      drow(["成長Phase 2","Month 5〜6","友達招待機能実装\n解約予兆検知・自動通知実装\nパフォーマンス最適化","インフルエンサーPR本格化\nTikTok体験動画投稿\n目標：6ヶ月後1,000人"],[1200,1600,3600,3000],false),
      drow(["成長Phase 3","Month 7〜12","季節限定ペルソナ機能\nコミュニティ機能検討","メディアPR・Meta広告開始\nNote SEO記事強化\n目標：1年後3,000人"],[1200,1600,3600,3000],true),
      drow(["拡大Phase 4","Year 2","React Native（Expo）でアプリ化\nApp Store/Google Play展開\nアフィリエイト機能","企業提携・自治体連携\nアプリストア展開\n目標：2年後5,000人"],[1200,1600,3600,3000],false),
    ]}),

    // ══════════ Ch12：利用規約（完全防衛版） ══════════
    pgbrk(),h1("第12章　ふぅ（fuu）利用規約【完全防衛版ドラフト】"),div(),
    box([
      "【重要】本利用規約はCEO（AI）が作成した草案です。",
      "ローンチ前に弁護士による最終レビューを強く推奨します（スポット相談¥10,000〜¥30,000）。",
      "記載の[　]内は実際の情報に置き換えてください。",
    ],C.lred,C.red),
    ...sp(1),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80},children:[new TextRun({text:"ふぅ（fuu）利用規約",bold:true,size:30,color:C.dgrey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:50},children:[new TextRun({text:`制定日：${new Date().toLocaleDateString('ja-JP')}`,size:19,color:C.grey,font:"Arial"})]}),
    ...sp(1),

    h3("第1条（総則）"),
    body("本利用規約（以下「本規約」）は、[屋号]（個人事業主：[妻の氏名]、以下「当事業者」）が提供するWebサービス・スマートフォンアプリ「ふぅ（fuu）」（以下「本サービス」）の利用に関する条件を定めるものです。"),
    body("ユーザーは本規約に同意した上で本サービスを利用するものとし、本サービスに登録または利用を開始した時点で本規約に同意したものとみなします。"),
    ...sp(1),

    h3("第2条（定義）"),
    num("「本サービス」：当事業者が提供するWebサービス「ふぅ（fuu）」およびその付帯一切のサービス"),
    num("「ユーザー」：本サービスに登録した個人"),
    num("「AIキャラクター」：本サービス内に登場する、AI（人工知能）技術により生成された会話キャラクター。実在の人物ではなく、特定の個人を模したものでもありません"),
    num("「コンテンツ」：本サービス上のテキスト・音声・BGM・イラスト・ソフトウェアその他すべてのデータ"),
    num("「サブスクリプション」：本サービスが提供する有料の定期課金プラン"),
    num("「プレミアムプラン」：月額980円（税込）の有料プラン"),
    num("「スタンダードプラン」：年額1,200円（税込）の有料プラン"),
    ...sp(1),

    h3("第3条（サービスの内容および重要事項）"),
    body("本サービスはAIキャラクターとの会話を通じた娯楽・コミュニケーションサービスです。ご利用前に以下の重要事項をご確認ください。"),
    num("本サービスに登場するキャラクターはすべてAI（人工知能）が生成するものであり、実在の人物ではありません。"),
    num("本サービスは医療、精神科・心療内科的治療、心理カウンセリング、法律相談、金融相談等の専門的サービスを提供するものではありません。"),
    num("本サービスのAIは誠実に設計されていますが、AI技術の特性（ハルシネーション等）により、事実と異なる情報や不適切な表現が含まれる可能性があります。"),
    num("精神的に深刻な状況にある方、自傷・自殺を考えている方は、直ちに以下の専門機関にご相談ください。よりそいホットライン：0120-279-338（24時間）"),
    num("本サービスは18歳以上を対象としています。"),
    ...sp(1),

    h3("第4条（利用資格・登録）"),
    num("本サービスは18歳以上の方を対象とします。18歳未満の方の利用を禁止します。"),
    num("ユーザーは真実・正確な情報を提供して登録するものとします。"),
    num("当事業者は、以下の場合にユーザーの登録を拒否または停止できます：虚偽の情報による登録、本規約に違反した場合、当事業者が不適切と判断した場合"),
    num("アカウントはユーザー本人のみが使用できます。第三者への貸与・譲渡・共有を禁止します。"),
    ...sp(1),

    h3("第5条（AIキャラクターに関する重要事項）"),
    num("本サービスのすべてのキャラクターはAIです。本サービスはキャラクターの「人格」や「実在性」を保証しません。"),
    num("AIキャラクターの会話内容は参考情報に過ぎません。医療・法律・金融等の判断の根拠とすることを禁止します。"),
    num("AIの応答に誤り・不適切な表現が含まれる場合があります。当事業者はこれにより生じた損害について、故意または重大な過失がある場合を除き責任を負いません。"),
    num("当事業者はサービス品質向上のためAIの応答品質を定期的にモニタリングします。ユーザーの個人情報は匿名化した上で行います。"),
    ...sp(1),

    h3("第6条（料金・支払い・解約・返金）"),
    num("スタンダードプランの料金は年額1,200円（税込）です。初月無料期間終了後、自動的に年額課金が開始されます。"),
    num("プレミアムプランの料金は月額980円（税込）です。毎月同日に自動課金されます。"),
    num("支払いはクレジットカード（Stripe決済）により行われます。"),
    num("解約はStripe管理画面またはアカウント設定から、次回課金日の24時間前までに手続きください。解約後は当該課金期間終了まで利用できます。"),
    num("デジタルコンテンツの性質上、原則として返金はいたしません。ただし当事業者に重大な過失がある場合はこの限りではありません。"),
    num("料金改定は30日前にアプリ内またはメールで通知します。通知後も利用継続の場合、新料金に同意したものとみなします。"),
    num("初月無料期間中に解約手続きをしない場合、自動的に有料プランに移行します。"),
    ...sp(1),

    h3("第7条（禁止事項）"),
    body("ユーザーは以下の行為を行ってはなりません。"),
    num("法令または本規約に違反する行為"),
    num("犯罪行為または犯罪に関連する行為"),
    num("当事業者または第三者の著作権、商標権、プライバシー権、名誉等の権利を侵害する行為"),
    num("本サービスのシステムに過度な負荷を与える行為（スクレイピング・BOT使用等）"),
    num("本サービスを通じた商業目的の宣伝・勧誘・マルチ商法への勧誘"),
    num("AIキャラクターを欺く目的での不正利用"),
    num("18歳未満のユーザーによる利用"),
    num("反社会的勢力との関与または反社会的行為"),
    num("他のユーザーまたは第三者への嫌がらせ・誹謗中傷"),
    num("その他当事業者が不適切と判断する行為"),
    ...sp(1),

    h3("第8条（プライバシー・個人情報・データ処理）"),
    num("当事業者は別途定めるプライバシーポリシーに従い個人情報を適切に管理します。"),
    num("チャット内容はサーバー上でAES-256暗号化を施して保存します。"),
    num("チャット内容をAIのトレーニングデータとして利用しません。"),
    num("本サービスはAI対話処理のためAnthropicおよびOpenAIのAPIを使用します。会話内容がこれらサービスのサーバーに送信されることをご了承ください。"),
    num("退会後、ユーザーデータは90日以内に完全削除します。"),
    num("当事業者は法令に基づく開示請求がある場合、個人情報を開示することがあります。"),
    ...sp(1),

    h3("第9条（知的財産権）"),
    num("本サービスのコンテンツ（キャラクター・テキスト・音楽・デザイン・ソフトウェア等）の知的財産権は当事業者または正当な権利者に帰属します。"),
    num("ユーザーは本規約で明示的に許可された範囲を超えて、本サービスのコンテンツを使用・複製・配布・改変することはできません。"),
    num("ユーザーが本サービスを通じて作成した会話ログの著作権はユーザーに帰属します。当事業者は匿名化・統計化した形での分析利用権を有します。"),
    ...sp(1),

    h3("第10条（免責事項）"),
    body("当事業者は以下について、故意または重大な過失がある場合を除き、一切の責任を負いません。"),
    num("本サービスのコンテンツの正確性・完全性・有用性・特定目的への適合性"),
    num("AIキャラクターの会話内容によるユーザーの精神的影響・判断・行動"),
    num("通信障害・システム障害・天災等によるサービスの中断・停止・データ損失"),
    num("第三者（Anthropic・OpenAI・Stripe・Supabase・Vercel等）のサービス障害による影響"),
    num("ユーザーが本サービスを通じて第三者に与えた損害"),
    num("ユーザー間または第三者との紛争"),
    num("不可抗力（天災・感染症・戦争・サイバー攻撃等）によるサービス障害"),
    ...sp(1),

    h3("第11条（損害賠償の制限）"),
    body("当事業者がユーザーに対して損害賠償責任を負う場合、その賠償額は、当該損害が発生した月の前月までの3ヶ月間に当該ユーザーが当事業者に支払った利用料金の合計額を上限とします。ただし、当事業者の故意または重大な過失による損害についてはこの限りではありません。"),
    ...sp(1),

    h3("第12条（反社会的勢力排除）"),
    body("ユーザーは、現在および将来にわたり、暴力団・暴力団員・暴力団関係者・総会屋・社会運動等標ぼうゴロ・特殊知能暴力集団その他反社会的勢力（以下「反社会的勢力等」）に該当しないことを表明・保証します。反社会的勢力等に該当することが判明した場合、当事業者は即時にアカウントを削除できます。"),
    ...sp(1),

    h3("第13条（サービスの変更・停止・終了）"),
    num("当事業者は事前通知の上、本サービスの内容を変更・追加・削除できます。"),
    num("メンテナンス・障害対応のため、一時的にサービスを停止することがあります。"),
    num("当事業者は30日前の事前通知をもって本サービスを終了できます。サービス終了時は未消化のサブスクリプション残期間相当の料金を返金します。"),
    ...sp(1),

    h3("第14条（規約の変更）"),
    body("当事業者は必要に応じて本規約を変更できます。重要な変更の場合は効力発生日の30日前までにアプリ内または登録メールアドレスへ通知します。通知後も本サービスを継続利用した場合、変更後の規約に同意したものとみなします。"),
    ...sp(1),

    h3("第15条（分離可能性）"),
    body("本規約のいずれかの条項が法令により無効または執行不能とされた場合においても、その他の条項は引き続き有効に存続します。"),
    ...sp(1),

    h3("第16条（準拠法・管轄裁判所）"),
    body("本規約は日本国法に準拠します。本サービスに関する紛争については、[妻の住所地]を管轄する裁判所を第一審の専属的合意管轄裁判所とします。"),
    ...sp(1),

    h3("第17条（お問い合わせ）"),
    body("本規約に関するお問い合わせは以下までご連絡ください。"),
    bul("事業者名：[屋号]（個人事業主：[妻の氏名]）"),
    bul("住所：[バーチャルオフィスまたは自宅住所]"),
    bul("メールアドレス：[事業用メールアドレス]"),
    bul("受付時間：平日10:00〜18:00（土日祝・年末年始を除く）"),
    ...sp(1),
    new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:80},children:[new TextRun({text:"以上",bold:true,size:21,color:C.dgrey,font:"Arial"})]}),

    // ══════════ COLOPHON ══════════
    ...sp(2),div(),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:160},children:[new TextRun({text:"ふぅ (fuu)　完全版マスター仕様書　Ver 3.0",bold:true,size:24,color:C.pink,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60},children:[new TextRun({text:"社長（オーナー）× CEO（Claude）　共同作成",size:20,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:40},children:[new TextRun({text:"本書に含まれる法的情報は参考です。弁護士・税理士への相談を推奨します。",size:17,color:C.red,font:"Arial",italics:true})]}),

    ]
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync('/sessions/epic-sleepy-lovelace/mnt/outputs/fuu_master_spec_v3.docx',buf);
  console.log('Done: fuu_master_spec_v3.docx');
});
