const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer, PageBreak
} = require('/sessions/epic-sleepy-lovelace/fuu_project/node_modules/docx');
const fs = require('fs');

// ===== COLOR PALETTE =====
const C = {
  pink:   "E91E63", lpink: "FCE4EC", mpink: "F8BBD9",
  grey:   "616161", lgrey: "F5F5F5", dgrey: "212121",
  white:  "FFFFFF", black: "000000",
  green:  "2E7D32", lgreen: "E8F5E9",
  red:    "C62828", lred:   "FFEBEE",
  yellow: "F57F17", lyellow:"FFFDE7",
  blue:   "1565C0", lblue:  "E3F2FD",
  purple: "6A1B9A", lpurple:"F3E5F5",
  navy:   "1A1A2E", code:   "00E5FF", codegreen: "A5D6A7",
};

const bdr  = { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" };
const bdrs = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const nobdr= { style: BorderStyle.NONE,   size: 0, color: C.white };
const nobdrs={ top: nobdr, bottom: nobdr, left: nobdr, right: nobdr };

// ===== HELPERS =====
const sp = (n=1) => Array.from({length:n},()=>new Paragraph({children:[new TextRun("")]}));

const h1 = t => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing:{before:400,after:120},
  children:[new TextRun({text:t,bold:true,size:36,color:C.pink,font:"Arial"})]
});
const h2 = t => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing:{before:280,after:80},
  children:[new TextRun({text:t,bold:true,size:28,color:"880E4F",font:"Arial"})]
});
const h3 = t => new Paragraph({
  spacing:{before:180,after:60},
  children:[new TextRun({text:t,bold:true,size:24,color:C.dgrey,font:"Arial"})]
});
const body = (t,opts={}) => new Paragraph({
  spacing:{before:60,after:60},
  children:[new TextRun({text:t,size:21,color:C.grey,font:"Arial",...opts})]
});
const bul = t => new Paragraph({
  numbering:{reference:"bullets",level:0}, spacing:{before:40,after:40},
  children:[new TextRun({text:t,size:21,color:C.grey,font:"Arial"})]
});
const bul2 = t => new Paragraph({
  numbering:{reference:"bullets2",level:0}, spacing:{before:30,after:30},
  children:[new TextRun({text:t,size:20,color:C.grey,font:"Arial"})]
});
const div = () => new Paragraph({
  spacing:{before:100,after:100},
  border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.mpink,space:1}},
  children:[new TextRun("")]
});
const pgbrk = () => new Paragraph({pageBreakBefore:true,children:[new TextRun("")]});

function colorBox(lines, bg, textColor, borderColor=null) {
  return new Table({
    width:{size:9500,type:WidthType.DXA}, columnWidths:[9500],
    rows: lines.map((line,i) => new TableRow({ children:[
      new TableCell({
        borders: borderColor
          ? {top:{style:BorderStyle.SINGLE,size:6,color:borderColor},bottom:{style:BorderStyle.NONE,size:0,color:C.white},left:{style:BorderStyle.SINGLE,size:6,color:borderColor},right:{style:BorderStyle.NONE,size:0,color:C.white}}
          : nobdrs,
        width:{size:9500,type:WidthType.DXA},
        shading:{fill:bg,type:ShadingType.CLEAR},
        margins:{top:i===0?140:50,bottom:i===lines.length-1?140:50,left:200,right:200},
        children:[new Paragraph({
          children:[new TextRun({text:line,size:21,font:"Arial",color:textColor,
            bold: line.startsWith("【") || line.startsWith("■") || line.startsWith("⚠") || line.startsWith("✅") || line.startsWith("❌")
          })]
        })]
      })
    ]}))
  });
}

function hrow(labels,widths) {
  return new TableRow({ tableHeader:true, children: labels.map((l,i) =>
    new TableCell({
      borders:bdrs, width:{size:widths[i],type:WidthType.DXA},
      shading:{fill:C.pink,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:140,right:140},
      children:[new Paragraph({children:[new TextRun({text:l,bold:true,size:20,color:C.white,font:"Arial"})]})]
    })
  )});
}
function drow(cells,widths,alt=false,bold=false) {
  return new TableRow({ children: cells.map((t,i) =>
    new TableCell({
      borders:bdrs, width:{size:widths[i],type:WidthType.DXA},
      shading:{fill:alt?C.lgrey:C.white,type:ShadingType.CLEAR},
      margins:{top:80,bottom:80,left:140,right:140},
      children:[new Paragraph({children:[new TextRun({text:String(t),size:20,font:"Arial",color:C.grey,bold:bold&&i===0})]})]
    })
  )});
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    shading:{fill:C.navy,type:ShadingType.CLEAR},
    children:[new TextRun({text:line,size:18,font:"Courier New",
      color: line.trim().startsWith("--") ? C.codegreen : line.trim().startsWith("CREATE")||line.trim().startsWith("INSERT") ? C.code : "E0E0E0"
    })]
  }));
}

function legalBadge(label, color, bg) {
  return new Table({
    width:{size:9500,type:WidthType.DXA}, columnWidths:[1200,8300],
    rows:[new TableRow({children:[
      new TableCell({
        borders:nobdrs, width:{size:1200,type:WidthType.DXA},
        shading:{fill:color,type:ShadingType.CLEAR},
        margins:{top:100,bottom:100,left:140,right:140},
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:label,bold:true,size:22,color:C.white,font:"Arial"})]})]
      }),
      new TableCell({
        borders:nobdrs, width:{size:8300,type:WidthType.DXA},
        shading:{fill:bg,type:ShadingType.CLEAR},
        margins:{top:100,bottom:100,left:180,right:140},
        children:[new Paragraph({children:[new TextRun({text:"",size:20,font:"Arial",color:C.dgrey})]})]
      })
    ]})]
  });
}

// ===== DOCUMENT =====
const doc = new Document({
  numbering:{config:[
    {reference:"bullets", levels:[{level:0,format:LevelFormat.BULLET,text:"●",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:560,hanging:280}}}}]},
    {reference:"bullets2",levels:[{level:0,format:LevelFormat.BULLET,text:"◦",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:840,hanging:280}}}}]},
    {reference:"numbers", levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:560,hanging:280}}}}]},
  ]},
  styles:{
    default:{document:{run:{font:"Arial",size:21}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:36,bold:true,font:"Arial",color:C.pink},
        paragraph:{spacing:{before:400,after:120},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:28,bold:true,font:"Arial",color:"880E4F"},
        paragraph:{spacing:{before:280,after:80},outlineLevel:1}},
    ]
  },
  sections:[{
    properties:{page:{
      size:{width:11906,height:16838},
      margin:{top:1134,right:1134,bottom:1134,left:1134}
    }},
    headers:{default:new Header({children:[new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.mpink,space:4}},
      children:[
        new TextRun({text:"ふぅ (fuu)　開発マスター仕様書　Ver 2.0　改訂版",bold:true,size:20,color:C.pink,font:"Arial"}),
        new TextRun({text:"　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　社内限定・機密",size:18,color:C.grey,font:"Arial"}),
      ]
    })]})},
    footers:{default:new Footer({children:[new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:4,color:C.mpink,space:4}},
      alignment:AlignmentType.RIGHT,
      children:[
        new TextRun({text:"ふぅ (fuu)　社長 × CEO　共同作成　　",size:18,color:C.grey,font:"Arial"}),
        new TextRun({children:[PageNumber.CURRENT],size:18,color:C.grey,font:"Arial"}),
      ]
    })]})},

    children:[

    // ========== COVER ==========
    ...sp(2),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"ふぅ",bold:true,size:96,color:C.pink,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60},children:[new TextRun({text:"fuu",size:48,color:C.mpink,font:"Arial",italics:true})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:160},children:[new TextRun({text:"10人のAIママ友とエモいJ-POPが流れる隠れ家SNS",size:28,color:C.grey,font:"Arial"})]}),
    ...sp(1),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[3167,3166,3167],rows:[new TableRow({children:[
      new TableCell({borders:nobdrs,width:{size:3167,type:WidthType.DXA},shading:{fill:C.lpink,type:ShadingType.CLEAR},margins:{top:160,bottom:160,left:200,right:200},
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"💰 修正版 収益計画",bold:true,size:23,color:C.pink,font:"Arial"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:50},children:[new TextRun({text:"現実的KPIで再設計",size:19,color:C.grey,font:"Arial"})]})]}),
      new TableCell({borders:nobdrs,width:{size:3166,type:WidthType.DXA},shading:{fill:C.mpink,type:ShadingType.CLEAR},margins:{top:160,bottom:160,left:200,right:200},
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"⚖️ リーガルチェック",bold:true,size:23,color:"880E4F",font:"Arial"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:50},children:[new TextRun({text:"3回確認・法的整合性",size:19,color:C.grey,font:"Arial"})]})]}),
      new TableCell({borders:nobdrs,width:{size:3167,type:WidthType.DXA},shading:{fill:C.lpink,type:ShadingType.CLEAR},margins:{top:160,bottom:160,left:200,right:200},
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"👩 妻名義移行設計",bold:true,size:23,color:C.pink,font:"Arial"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:50},children:[new TextRun({text:"個人事業主として収益化",size:19,color:C.grey,font:"Arial"})]})]})
    ]})]}),
    ...sp(2),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"開発マスター仕様書　Ver 2.0（全面改訂版）",size:24,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80},children:[new TextRun({text:`作成日：${new Date().toLocaleDateString('ja-JP')}　　社長（オーナー）× CEO（Claude）`,size:20,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60},children:[new TextRun({text:"※ 本書は機密情報を含みます。社外への共有・転用を禁止します。",size:18,color:C.red,font:"Arial",italics:true})]}),

    // ========== CHAPTER 1: 収益シミュレーション修正 ==========
    pgbrk(),
    h1("第1章　修正版 収益シミュレーション"),
    div(),
    body("社長のご指摘の通り、前回の会員数予測（3ヶ月3,000人等）は楽観的すぎました。副業・ゼロ広告費スタートという現実を踏まえ、現実的かつ達成可能なKPIに修正します。"),
    ...sp(1),

    h2("1-1．KPI（会員数目標）"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[1400,1600,1800,1800,1400,1500],rows:[
      hrow(["フェーズ","期間","累計会員数","スタンダード","プレミアム(15%)","主な施策"],[1400,1600,1800,1800,1400,1500]),
      drow(["Phase 1","〜3ヶ月","100人","85人","15人","口コミ・SNS有機投稿"],[1400,1600,1800,1800,1400,1500],false),
      drow(["Phase 2","〜6ヶ月","1,000人","850人","150人","インフルエンサーPR"],[1400,1600,1800,1800,1400,1500],true),
      drow(["Phase 3","〜1年","3,000人","2,550人","450人","メディア掲載・友達紹介"],[1400,1600,1800,1800,1400,1500],false),
      drow(["Phase 4","〜2年","5,000人","4,250人","750人","コミュニティ・提携"],[1400,1600,1800,1800,1400,1500],true),
    ]}),
    ...sp(1),

    h2("1-2．フェーズ別 月間収益シミュレーション"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[1300,1600,1600,1500,1500,2000],rows:[
      hrow(["フェーズ","月間総売上","手数料(15%)","AI・インフラ費","月間純利益","備考"],[1300,1600,1600,1500,1500,2000]),
      drow(["3ヶ月後","¥23,200","¥3,480","¥7,275","¥12,445","黒字化スタート。APIコストが重い時期"],[1300,1600,1600,1500,1500,2000],false),
      drow(["6ヶ月後","¥232,000","¥34,800","¥72,750","¥124,450","月12万円超え。副業として十分な収益"],[1300,1600,1600,1500,1500,2000],true),
      drow(["1年後","¥696,000","¥104,400","¥218,250","¥373,350","月37万円。確定申告が必要な水準"],[1300,1600,1600,1500,1500,2000],false),
      drow(["2年後","¥1,160,000","¥174,000","¥363,750","¥622,250","月62万円。専業収入レベル"],[1300,1600,1600,1500,1500,2000],true),
    ]}),
    new Paragraph({spacing:{before:80},children:[new TextRun({text:"※ スタンダード月間収益 = 人数 × ¥100（年払い¥1,200の月割）　プレミアム = 人数 × ¥980",size:18,color:C.grey,font:"Arial",italics:true})]}),
    new Paragraph({spacing:{before:40},children:[new TextRun({text:"※ AIコスト：スタンダード1人あたり約¥15/月、プレミアム1人あたり約¥400/月（音声通話60分含む）",size:18,color:C.grey,font:"Arial",italics:true})]}),
    ...sp(1),

    h2("1-3．損益分岐点（BEP）"),
    colorBox([
      "【損益分岐点の考え方】",
      "",
      "固定費：OpenAI APIキー維持費（初期¥700相当）、Supabase無料枠内、RevenueCat無料枠内",
      "→ 変動費のみで運営可能。会員1人目から黒字構造。",
      "",
      "ただし現実的な最低ラインとして：",
      "● スタンダード会員のみ10人で月¥570の純利益（ほぼ0だが赤字にはならない）",
      "● スタンダード10人 ＋ プレミアム2人で月約¥3,000（安定ライン）",
      "● OpenAI APIの無料クレジット（$5 ≒ ¥700）は約100〜200回の会話分",
      "  → 10人以上になったら月¥700〜1,400のAPI費用が発生。それ以外はほぼ0。",
    ], C.lyellow, C.yellow),
    ...sp(1),

    // ========== CHAPTER 2: リーガルチェック ==========
    pgbrk(),
    h1("第2章　リーガルチェック（3回確認）"),
    div(),
    colorBox([
      "【重要免責】 本章はCEO（AI）による一般的な法的考慮事項の整理です。実際の事業開始前に、",
      "弁護士・税理士への相談を強く推奨します。本内容は法的アドバイスではありません。",
    ], C.lred, C.red),
    ...sp(1),

    // --- Legal Check 1 ---
    h2("【第1回確認】サービス内容の適法性チェック"),
    ...sp(1),

    h3("✅ 確認①：医療行為・心理カウンセリングとの境界線"),
    colorBox([
      "判定：問題なし（条件付き）",
      "",
      "根拠：医師法・保健師助産師看護師法・公認心理師法は「診断・治療・投薬」を医療従事者に限定。",
      "「ふぅ」は診断・治療を一切行わず『話を聞く・共感する』のみ。法的には該当しない。",
      "",
      "【必須対応】以下の文言を利用規約・アプリ内に明記すること。",
      "「本サービスはAIが提供するエンターテインメント・コミュニケーションサービスです。",
      " 医療・心理・法律・金融に関する専門的なアドバイスを提供するものではありません。」",
      "",
      "【追加対応】精神的に深刻なユーザーへの出口設計が必要。",
      "チャット内に「本格的な相談はこちら」→ よりそいホットライン（0120-279-338）等を常設。",
    ], C.lgreen, C.green),
    ...sp(1),

    h3("✅ 確認②：AIキャラクター（ペルソナ）の開示義務"),
    colorBox([
      "判定：問題なし（開示が条件）",
      "",
      "現時点（2026年）の日本国内法にはAI開示を直接義務付ける法律は未整備。",
      "ただし景品表示法（誇大広告）・消費者契約法（誤認）の観点から、AIであることの明示が必須。",
      "",
      "【必須対応】",
      "● アプリ内のペルソナプロフィールに「AIキャラクター」と明記",
      "● 初回利用時に「本サービスのキャラクターはAIです」と表示・同意取得",
      "● 「嘘をつかない」という表現は「誠実に設計されたAI」に言い換え推奨",
      "  （LLMの幻覚＝ハルシネーションリスクを完全排除できないため）",
    ], C.lgreen, C.green),
    ...sp(1),

    h3("⚠️ 確認③：電気通信事業法（届出義務）"),
    colorBox([
      "判定：要注意 → 届出が必要な可能性あり",
      "",
      "2023年改正電気通信事業法により、他人の通信を媒介・管理するWebサービス・アプリは",
      "「電気通信事業」の届出または登録が必要になる場合がある。",
      "",
      "「ふぅ」はユーザーとAIの会話ログをサーバー（Supabase）に保存するため、",
      "総務省への『届出電気通信事業者』の届出が必要になる可能性が高い。",
      "",
      "【対応アクション】",
      "● 総務省 電気通信事業届出 → オンライン無料・書類1枚で完了",
      "● 届出先：総務省 総合通信基盤局 電気通信事業部",
      "● 届出後は個人情報の取扱方針公開・外部送信規律の遵守が義務",
      "● ローンチ前に完了させること（罰則あり）",
    ], C.lyellow, C.yellow),
    ...sp(1),

    // --- Legal Check 2 ---
    h2("【第2回確認】消費者保護法制チェック"),
    ...sp(1),

    h3("✅ 確認①：特定商取引法（通信販売）"),
    colorBox([
      "判定：対応必要（対応方法は明確）",
      "",
      "定期購入（サブスクリプション）は特商法の「通信販売」に該当。以下の表示が義務。",
      "",
      "【必須表示事項】",
      "● 事業者名（妻の屋号または氏名）・住所・電話番号",
      "● 料金：スタンダード¥1,200/年、プレミアム¥980/月（税込）",
      "● 支払時期・方法（アプリ内課金・Apple/Google経由）",
      "● サービスの提供時期（登録直後から）",
      "● 解約方法・解約期限（次回課金日の24時間前まで）",
      "● 返金ポリシー（デジタルサービスのため原則返金不可・明記）",
      "",
      "→ アプリ内の「特定商取引法に基づく表示」ページに全項目掲載で対応完了",
    ], C.lgreen, C.green),
    ...sp(1),

    h3("✅ 確認②：消費者契約法"),
    colorBox([
      "判定：問題なし（利用規約設計に注意）",
      "",
      "消費者契約法は事業者と消費者の契約に適用される。以下の条項は無効になるため設計に注意。",
      "",
      "【利用規約に入れてはいけない条項（無効）】",
      "● 事業者の損害賠償責任を全免除する条項",
      "● 消費者の解約権を一方的に制限する条項",
      "● 解約方法を不当に難しくする設計",
      "",
      "【対応】本書第3章の利用規約ではこれらを適切に設計済み。",
      "免責事項は「故意・重過失を除く」という限定付きにすること。",
    ], C.lgreen, C.green),
    ...sp(1),

    h3("✅ 確認③：初月無料（フリートライアル）の表示"),
    colorBox([
      "判定：問題なし（表示方法に注意）",
      "",
      "「初月無料」は適法だが、2022年の特商法改正で定期購入の表示規制が強化された。",
      "",
      "【必須表示】",
      "● 「初月無料、翌月から自動課金」と登録フロー中に大きく表示",
      "● 初回課金のタイミング・金額を登録前の画面で明示",
      "● 解約方法を登録時・マイページに常時表示",
      "● Apple/Googleの定期購入UIは規約で上記を自動的に満たす設計になっているため、",
      "  アプリ内課金を使う限りは対応しやすい",
    ], C.lgreen, C.green),
    ...sp(1),

    // --- Legal Check 3 ---
    h2("【第3回確認】個人情報・データ保護チェック"),
    ...sp(1),

    h3("⚠️ 確認①：個人情報保護法（要配慮個人情報）"),
    colorBox([
      "判定：要注意 → 適切な設計で対応可能",
      "",
      "チャット内容にはユーザーの精神状態・家族関係・健康情報等が含まれる可能性があり、",
      "「要配慮個人情報」（法第2条3項）に準ずる扱いが推奨される。",
      "",
      "【必須対応】",
      "● プライバシーポリシーに個人情報の利用目的・第三者提供の有無を明記",
      "● チャットログはAES-256等の暗号化で保存（Supabaseでは行レベルセキュリティで設定可）",
      "● AIのトレーニングデータへのチャット内容の使用は行わない旨を明記",
      "● データの保存期間・削除ポリシーを定める（例：退会後90日で完全削除）",
      "● 個人情報保護委員会への届出は不要（規模が小さい間）",
    ], C.lyellow, C.yellow),
    ...sp(1),

    h3("✅ 確認②：Cookieとトラッキング（外部送信規律）"),
    colorBox([
      "判定：問題なし（電気通信事業届出後は対応必要）",
      "",
      "2023年電気通信事業法改正により、外部サービス（OpenAI等）への情報送信については",
      "ユーザーへの通知・オプトアウト機会の提供が義務となる可能性がある。",
      "",
      "【対応】",
      "● アプリ起動時に「AIサービス（OpenAI）にメッセージ内容が送信されます」と同意取得",
      "● プライバシーポリシーに外部送信先（OpenAI / Supabase）を明記",
      "● OpenAIのAPI利用規約はビジネス向けではデータ学習に使用されない設定が可能",
    ], C.lgreen, C.green),
    ...sp(1),

    h3("✅ 確認③：未成年者保護"),
    colorBox([
      "判定：問題なし（利用規約で対応）",
      "",
      "サービスの性質（育児に悩むママ向け）から主なユーザーは成人だが、念のため：",
      "",
      "● 利用規約に「18歳以上を対象とする」と明記",
      "● 登録時の年齢確認（生年月日入力など）をUIに組み込む",
      "● App Store / Google Playの年齢レーティング：「4+」または「12+」で申請（暴力・性的表現なし）",
    ], C.lgreen, C.green),
    ...sp(1),

    // Legal Summary
    h2("リーガルチェック 総合判定"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[2800,1200,5500],rows:[
      hrow(["チェック項目","判定","対応アクション"],[2800,1200,5500]),
      drow(["医療行為・心理相談との境界線","✅ OK","免責文言をアプリ内・利用規約に明記。緊急相談先を常設"],[2800,1200,5500],false),
      drow(["AIキャラクター開示","✅ OK","「AIキャラクター」と明記。初回同意取得"],[2800,1200,5500],true),
      drow(["電気通信事業法 届出","⚠️ 要対応","総務省へ無料届出（ローンチ前に完了）"],[2800,1200,5500],false),
      drow(["特定商取引法 表示","✅ OK","アプリ内に特商法ページを設置（第3章利用規約参照）"],[2800,1200,5500],true),
      drow(["消費者契約法 利用規約","✅ OK","免責を限定付きに。解約を容易に設計"],[2800,1200,5500],false),
      drow(["初月無料の表示","✅ OK","登録フローで課金条件を大きく表示"],[2800,1200,5500],true),
      drow(["個人情報保護法","⚠️ 要対応","プライバシーポリシー作成・チャットログ暗号化・同意取得"],[2800,1200,5500],false),
      drow(["外部送信規律（OpenAI等）","⚠️ 要対応","起動時に外部送信の同意取得・プライポリに明記"],[2800,1200,5500],true),
      drow(["未成年者保護","✅ OK","18歳以上限定を利用規約に明記・年齢確認UI"],[2800,1200,5500],false),
    ]}),
    new Paragraph({spacing:{before:100},children:[new TextRun({text:"⚠️ 2項目の「要対応」は難易度が低い。電気通信事業届出はオンライン無料。プライバシーポリシーは本書で提供。",size:19,color:C.yellow,font:"Arial",bold:true})]}),
    ...sp(1),

    // ========== CHAPTER 3: 利用規約 ==========
    pgbrk(),
    h1("第3章　ふぅ（fuu）利用規約"),
    div(),
    colorBox([
      "【弁護士確認推奨】本利用規約はCEO（AI）が作成した草案です。",
      "実際のリリース前に弁護士によるレビューを推奨します（スポット相談：¥10,000〜¥30,000程度）。",
    ], C.lred, C.red),
    ...sp(1),

    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:100},children:[new TextRun({text:"ふぅ（fuu）利用規約",bold:true,size:32,color:C.dgrey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60},children:[new TextRun({text:`制定日：${new Date().toLocaleDateString('ja-JP')}`,size:20,color:C.grey,font:"Arial"})]}),
    ...sp(1),

    h3("第1条（総則）"),
    body("本利用規約（以下「本規約」）は、[屋号]（個人事業主：[妻の氏名]）（以下「当事業者」）が提供するスマートフォンアプリ「ふぅ（fuu）」（以下「本サービス」）の利用条件を定めるものです。本サービスを利用するすべてのユーザーは本規約に同意したものとみなします。"),
    ...sp(1),

    h3("第2条（定義）"),
    bul("「本サービス」：当事業者が提供するアプリ「ふぅ（fuu）」およびその付帯サービス"),
    bul("「ユーザー」：本サービスに登録した個人"),
    bul("「AIキャラクター」：本サービス内に登場するAIにより生成された会話キャラクター（実在の人物ではありません）"),
    bul("「コンテンツ」：本サービス上のテキスト・音声・BGM・イラスト等すべてのデータ"),
    ...sp(1),

    h3("第3条（サービスの内容・重要事項）"),
    body("本サービスは、AIキャラクターとの会話・共感を通じた娯楽・コミュニケーションサービスです。以下の事項をご理解の上でご利用ください。"),
    bul("本サービスに登場するキャラクターはすべてAI（人工知能）が生成するものであり、実在の人物ではありません。"),
    bul("本サービスは医療、心理相談、法律相談、金融相談等の専門的なアドバイスを提供するものではありません。"),
    bul("本サービスのAIは誠実に設計されていますが、AI技術の特性上、不正確な情報・不適切な表現が含まれる可能性があります。"),
    bul("精神的に深刻なお悩みをお持ちの方は、専門の相談窓口（よりそいホットライン：0120-279-338）をご利用ください。"),
    ...sp(1),

    h3("第4条（利用資格）"),
    bul("本サービスは18歳以上の方を対象とします。"),
    bul("日本国内在住の方を対象とします。"),
    bul("虚偽の情報による登録を禁じます。"),
    ...sp(1),

    h3("第5条（アカウント登録）"),
    body("ユーザーはApple ID / Google アカウントを用いて本サービスに登録します。アカウントの管理はユーザー自身の責任において行うものとし、第三者への貸与・譲渡を禁じます。"),
    ...sp(1),

    h3("第6条（料金・支払い・解約）"),
    bul("スタンダードプラン：年額1,200円（税込）。Apple/Googleアプリ内課金により初月無料終了後に自動課金。"),
    bul("プレミアムプラン：月額980円（税込）。Apple/Googleアプリ内課金により毎月自動課金。"),
    bul("初月無料期間中の解約：次回課金日の24時間前までにApple/Googleの定期購読管理画面で解約すること。"),
    bul("料金の改定は30日前にアプリ内通知またはメールで告知します。"),
    bul("デジタルコンテンツの性質上、原則として返金はいたしません。ただし、当事業者に重大な過失がある場合はこの限りではありません。"),
    bul("解約後は当該課金期間の終了まで本サービスをご利用いただけます。"),
    ...sp(1),

    h3("第7条（プライバシー・個人情報）"),
    bul("当事業者は別途定めるプライバシーポリシーに従い、個人情報を適切に管理します。"),
    bul("チャット内容はサーバー上で暗号化して保存されます。"),
    bul("チャット内容はAIのトレーニングデータとして利用しません。"),
    bul("会話内容の解析はサービス品質向上のため匿名化・統計化した形でのみ使用する場合があります。"),
    bul("退会後、ユーザーデータは90日以内に完全削除します。"),
    bul("本サービスはAI対話処理のためOpenAI社のAPIを使用しており、会話内容がOpenAI社のサーバーに送信されます（詳細はOpenAI社プライバシーポリシーをご参照ください）。"),
    ...sp(1),

    h3("第8条（禁止事項）"),
    body("ユーザーは以下の行為を禁止します。"),
    bul("本サービスを犯罪・違法行為に使用する行為"),
    bul("本サービスのシステムに過度な負荷をかける行為"),
    bul("他のユーザーや第三者を誹謗中傷する行為"),
    bul("本サービスのコンテンツを無断で複製・配布・販売する行為"),
    bul("本サービスを利用して商業目的の広告・勧誘を行う行為"),
    bul("本サービスのAIを騙す・不正利用する行為"),
    bul("18歳未満の方による利用"),
    ...sp(1),

    h3("第9条（知的財産権）"),
    body("本サービスのコンテンツ（キャラクター・テキスト・音楽・デザイン等）に関する知的財産権は当事業者または正当な権利者に帰属します。ユーザーが本サービスを通じて作成した会話ログの著作権はユーザーに帰属しますが、当事業者は匿名化・統計化した形での利用権を有します。"),
    ...sp(1),

    h3("第10条（免責事項）"),
    body("当事業者は以下について、故意または重大な過失がある場合を除き、責任を負いません。"),
    bul("本サービスの内容の正確性・完全性・有用性"),
    bul("AIキャラクターとの会話内容によるユーザーの精神的影響"),
    bul("通信障害・システム障害によるサービス中断"),
    bul("ユーザーが第三者に与えた損害"),
    bul("本サービスを通じた外部サービス（Apple/Google/OpenAI等）利用に関する事項"),
    ...sp(1),

    h3("第11条（サービスの変更・停止・終了）"),
    body("当事業者は以下の権利を有します。"),
    bul("事前通知の上、サービス内容の変更・機能追加・削除を行うこと"),
    bul("メンテナンス等のため一時的にサービスを停止すること"),
    bul("事業上の理由によりサービスを終了すること（30日前告知）"),
    ...sp(1),

    h3("第12条（準拠法・管轄）"),
    body("本規約は日本国法に準拠します。本サービスに関する紛争については、[居住地]を管轄する裁判所を専属的合意管轄とします。"),
    ...sp(1),

    h3("第13条（規約の改定）"),
    body("当事業者は必要に応じて本規約を改定できます。改定後もサービスを継続利用した場合、改定後の規約に同意したとみなします。重要な変更の場合は30日前にアプリ内・メール通知を行います。"),
    ...sp(1),

    new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:100},children:[new TextRun({text:"以上",bold:true,size:22,color:C.dgrey,font:"Arial"})]}),
    ...sp(1),

    // ========== CHAPTER 4: 妻名義 ==========
    pgbrk(),
    h1("第4章　妻名義への移行設計"),
    div(),

    h2("4-1．基本設計方針"),
    colorBox([
      "【設計の方針】",
      "社長（夫）が開発・CEOとして設計を進め、ローンチ直前に全アカウントを妻（個人事業主）名義に移行。",
      "妻はすでに開業届を提出済みのため、本サービスを事業の一つとして追加するだけで対応可能。",
      "この構造により、社長の副業収入リスクを回避しつつ、妻の事業所得として適法に収益化できる。",
    ], C.lpink, C.pink),
    ...sp(1),

    h2("4-2．移行スケジュール"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[1600,2400,5500],rows:[
      hrow(["タイミング","作業者","内容"],[1600,2400,5500]),
      drow(["開発中","社長 ＋ CEO","FlutterFlow・Supabase・RevenueCat・OpenAIの開発用アカウントは社長名義でOK（無料のため）"],[1600,2400,5500],false),
      drow(["ローンチ3ヶ月前","妻","Appleデベロッパーアカウント登録（¥11,800/年）→ 妻名義で新規取得"],[1600,2400,5500],true),
      drow(["ローンチ3ヶ月前","妻","Google Play Consoleアカウント登録（¥2,500 一括）→ 妻名義で新規取得"],[1600,2400,5500],false),
      drow(["ローンチ1ヶ月前","社長 → 妻","Supabase・RevenueCat・OpenAI：管理者メールアドレスを妻のアドレスに変更"],[1600,2400,5500],true),
      drow(["ローンチ1ヶ月前","妻","特定商取引法ページに妻の屋号・住所・電話番号を記載"],[1600,2400,5500],false),
      drow(["ローンチ1ヶ月前","社長 → 妻","FlutterFlowで開発したアプリを妻のApple/Google開発者アカウントへ移行して提出"],[1600,2400,5500],true),
      drow(["ローンチ後","妻","確定申告（青色申告推奨）で本サービスの収益を事業所得として申告"],[1600,2400,5500],false),
    ]}),
    ...sp(1),

    h2("4-3．AppleアプリのアカウントTransfer（移行）方法"),
    colorBox([
      "【Apple App Store：アプリ移転が可能】",
      "",
      "手順：",
      "1. 社長のApple Developer AccountでApp Store Connectにログイン",
      "2. アプリ → 「App Transfer」機能を選択",
      "3. 妻のApple Developer Account（メールアドレス）を指定",
      "4. 双方で承認 → 移転完了（レビューの再審査なし）",
      "",
      "注意：移転後は妻のアカウントでアップデート・売上管理が行われる",
    ], C.lblue, C.blue),
    ...sp(1),

    colorBox([
      "【Google Play：アプリの引き継ぎ方法】",
      "",
      "Google Playはアカウント移転が不可。以下の方法で対応：",
      "",
      "方法A（推奨）：最初から妻名義のGoogle Playアカウントでアプリを開発・提出する。",
      "  → 社長が開発したコードを妻アカウントのPlay Consoleからアップロードするだけ。",
      "  → アプリのビルド・アップロードは社長でも妻でも可能（Consoleのアクセス権限付与で対応）",
      "",
      "方法B（やむを得ない場合）：社長アカウントで先行リリース後、",
      "  妻アカウントで別アプリとして再提出。旧アプリを非公開にしてユーザーに移行を案内。",
      "  ※ この場合、初期ユーザーへの引き継ぎ作業が必要。",
    ], C.lblue, C.blue),
    ...sp(1),

    h2("4-4．税務への影響（社会保険の懸念なし・確認済み）"),
    colorBox([
      "✅【確認済み】妻はすでに社長（夫）の扶養を外れているため、社会保険・配偶者控除の影響はゼロ",
      "",
      "本サービスの収益が増えても、社会保険や税控除の面で新たな不利益は発生しない。",
      "純粋に「妻の事業所得が増える」だけ。非常にクリーンな構造。",
      "",
      "■ 確定申告（妻）：",
      "● 妻はすでに開業届済み・個人事業主として確定申告している",
      "● 本サービスの収益はそのまま既存事業の事業所得に合算して申告するだけ",
      "● 青色申告（65万円控除）を活用していれば節税効果が大きい",
      "● 青色申告をまだしていない場合は、今期から切り替えを検討（税理士相談推奨）",
      "",
      "■ 経費として計上できる可能性があるもの：",
      "● OpenAI APIの利用料（全額）",
      "● RevenueCat等のサービス利用料（発生した場合）",
      "● スマートフォン・通信費（事業利用分の按分）",
      "● Apple Developer Program年会費 ¥11,800",
      "● Google Play Console登録費 ¥2,500",
      "● インフルエンサーへの謝礼・広告費",
      "● 弁護士・税理士への相談費用",
      "",
      "■ 注意点（税理士確認推奨）：",
      "● 収益が年¥100万円を超えてくる段階（1年後目安）で消費税の免税事業者の確認を",
      "● インボイス制度（適格請求書）への対応は取引先の状況次第で検討",
      "● 社長（夫）が開発に費やした時間・費用を妻の事業経費にする場合は名目を明確に",
    ], C.lgreen, C.green),
    ...sp(1),

    h2("4-5．「名義貸し」リスクの回避"),
    colorBox([
      "【重要】名義貸しにならないための設計",
      "",
      "単に名義を妻にするだけでは「名義貸し」と判断されるリスクがある。",
      "妻が実際に事業に関与する形を作ることが重要。",
      "",
      "推奨アクション：",
      "● 妻がSNS発信・カスタマーサポート・プロモーション管理を担当（役割分担を明確化）",
      "● 事業の意思決定（料金改定・機能追加等）は妻が最終承認者となる",
      "● 妻名義の銀行口座で収益を受け取る（RevenueCatの振込先を妻口座に設定）",
      "● 事業用のメールアドレス・SNSアカウントは妻名義で運営",
      "● 上記の役割分担を書面化しておくことを推奨",
    ], C.lgreen, C.green),
    ...sp(1),

    // ========== CHAPTER 5: プロモーション ==========
    pgbrk(),
    h1("第5章　プロモーションプラン（KPI連動型）"),
    div(),
    body("会員数KPI（3ヶ月100人 → 6ヶ月1,000人 → 1年3,000人 → 2年5,000人）を達成するための、フェーズ別プロモーション戦略。持ち出し0円スタートから始め、収益に応じてマーケティング投資を段階的に拡大する。"),
    ...sp(1),

    h2("Phase 1（〜3ヶ月）：目標100人　コスト¥0"),
    h3("施策：ソフトローンチ × 口コミ起点"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[2000,3000,4500],rows:[
      hrow(["施策","チャンネル","具体的なアクション"],[2000,3000,4500]),
      drow(["身内への周知","LINE・知人ネットワーク","夫婦の知人・ママ友にテストユーザーとして依頼。フィードバック収集。初月無料で気軽に試してもらう"],[2000,3000,4500],false),
      drow(["SNS有機投稿","X（旧Twitter）","妻アカウントで「育児疲れに共感してくれるアプリ作った」系の投稿。体験談・ペルソナの台詞をスクショで公開"],[2000,3000,4500],true),
      drow(["SNS有機投稿","Instagram","アプリ画面・ペルソナキャラのビジュアル投稿。ストーリーで「こんな時どのキャラに話す？」アンケート実施"],[2000,3000,4500],false),
      drow(["コミュニティ投稿","ママ向け掲示板・アプリ","ウィメンズパーク・ままとも・みんなの育児等に体験談として投稿（宣伝色を出さず）"],[2000,3000,4500],true),
      drow(["ASO最適化","App Store / Google Play","キーワード：「育児 相談」「ママ 愚痴」「孤独 育児」等で上位を狙う。スクリーンショットとキャッチコピーを磨く"],[2000,3000,4500],false),
    ]}),
    ...sp(1),
    colorBox([
      "Phase 1 KPI補足：100人のうち初月無料の離脱を差し引いてスタンダード維持率50%以上を目標。",
      "→ 50人以上が月継続 = 最初の安定収益基盤。ここでペルソナやBGMのUXを磨く。",
    ], C.lpink, C.pink),
    ...sp(1),

    h2("Phase 2（3〜6ヶ月）：目標1,000人　コスト月¥0〜¥50,000"),
    h3("施策：インフルエンサー × バイラル設計"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[2000,3000,4500],rows:[
      hrow(["施策","チャンネル","具体的なアクション"],[2000,3000,4500]),
      drow(["インフルエンサーPR","Instagram/TikTok","ママ系インスタグラマー（フォロワー1〜5万人）に無償提供でPR依頼。「AIに愚痴ったら…」系のリアル体験を投稿してもらう"],[2000,3000,4500],false),
      drow(["バイラル動画","TikTok","「AIに旦那への愚痴を言ってみた結果」「毒舌AIに相談したら爽快すぎた」等のショート動画を妻アカウントで投稿"],[2000,3000,4500],true),
      drow(["友達招待機能","アプリ内","1人紹介するごとにプレミアム1ヶ月無料（またはスタンダード1ヶ月延長）。紹介コード発行機能をアプリに実装"],[2000,3000,4500],false),
      drow(["X バズ施策","X（旧Twitter）","「AIに育児の愚痴を言ったら○○と返ってきた」スレッドを投稿。共感RTを狙う。ペルソナの実際の台詞を公開"],[2000,3000,4500],true),
      drow(["Podcastコラボ","育児系Podcast","育児系Podcastに体験談・開発秘話として出演依頼。ニッチだが信頼度が高い"],[2000,3000,4500],false),
    ]}),
    ...sp(1),
    colorBox([
      "Phase 2 KPI補足：3ヶ月で100人 → 6ヶ月で1,000人は10倍成長。",
      "インフルエンサー1人のPRで平均500〜2,000人リーチ。CVR（インストール率）2〜3%で10〜60人獲得。",
      "5〜10人のインフルエンサーに依頼で目標達成ライン。費用は無償提供（プレミアムコード）のみ。",
    ], C.lpink, C.pink),
    ...sp(1),

    h2("Phase 3（6ヶ月〜1年）：目標3,000人　コスト月¥30,000〜¥80,000"),
    h3("施策：メディア掲載 × 広告投資"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[2000,3000,4500],rows:[
      hrow(["施策","チャンネル","具体的なアクション"],[2000,3000,4500]),
      drow(["PR掲載","ママ向けWebメディア","MAMADAYS・ベビーカレンダー・HugMug等にプレスリリース送付。「月100円で話を聞いてくれるAIアプリ」切り口でピッチ"],[2000,3000,4500],false),
      drow(["PR掲載","テレビ・ラジオ","NHK「あさイチ」「ニュースウォッチ9」やTBSラジオ等に「孤独な育児を救うAIアプリ」として売り込む"],[2000,3000,4500],true),
      drow(["有料広告","Meta広告","Instagram/Facebook広告。ターゲット：25〜45歳女性・育児関連。CPA（1人獲得コスト）¥300〜¥600目標"],[2000,3000,4500],false),
      drow(["SEO・ブログ","Google検索","「育児 孤独 相談」「ワンオペ 愚痴 聞いてくれる」等のキーワードで記事作成。妻のnoteで体験談を定期投稿"],[2000,3000,4500],true),
      drow(["UGC促進","SNS全般","ユーザーの「やってみた」投稿を公式でRT・シェア。ハッシュタグ #ふぅ を運用"],[2000,3000,4500],false),
    ]}),
    ...sp(1),

    h2("Phase 4（1〜2年）：目標5,000人　コスト月¥50,000〜¥120,000"),
    h3("施策：コミュニティ × 提携 × ブランド確立"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[2000,3000,4500],rows:[
      hrow(["施策","チャンネル","具体的なアクション"],[2000,3000,4500]),
      drow(["企業提携","保育園・産後ケア","自治体・保育施設・産後ケアセンター等との提携。「育児支援ツール」として紹介してもらう"],[2000,3000,4500],false),
      drow(["コミュニティ機能","アプリ内","ユーザー同士が繋がれる匿名コミュニティ機能を追加。滞在時間増加 → 解約率低下"],[2000,3000,4500],true),
      drow(["アフィリエイト","ママブログ","アフィリエイトプログラム導入（紹介1人につき¥200〜¥500）。ママブロガーに登録を促す"],[2000,3000,4500],false),
      drow(["アワード応募","IT・アプリ系","グッドデザイン賞・Google Play ベストアプリ等に応募。受賞すれば無料PR効果大"],[2000,3000,4500],true),
      drow(["継続広告","Meta/Google広告","月¥50,000〜¥80,000の広告投資。LTV（顧客生涯価値）から逆算したCPA設計"],[2000,3000,4500],false),
    ]}),
    ...sp(1),

    h2("プロモーション KPI一覧"),
    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[1400,1500,1500,1500,1500,2100],rows:[
      hrow(["フェーズ","期間","目標会員数","月間予算","主要施策","重点チャンネル"],[1400,1500,1500,1500,1500,2100]),
      drow(["Phase 1","〜3ヶ月","100人","¥0","口コミ・SNS有機","X・Instagram・ママコミュ"],[1400,1500,1500,1500,1500,2100],false),
      drow(["Phase 2","〜6ヶ月","1,000人","〜¥50,000","インフルエンサーPR","TikTok・Instagram"],[1400,1500,1500,1500,1500,2100],true),
      drow(["Phase 3","〜1年","3,000人","〜¥80,000","メディア・広告","Meta広告・PR"],[1400,1500,1500,1500,1500,2100],false),
      drow(["Phase 4","〜2年","5,000人","〜¥120,000","提携・コミュニティ","企業提携・アフィリ"],[1400,1500,1500,1500,1500,2100],true),
    ]}),
    ...sp(1),

    colorBox([
      "【チャーン（解約）対策も同時実行】",
      "会員を増やすことと同じくらい、解約を防ぐことが重要。以下を実装する。",
      "",
      "● 解約予兆検知：14日間ログインなし → 好きなペルソナから「最近どうしてる？」プッシュ通知",
      "● エモBGMの定期更新：毎月新曲を追加。「今月の新曲が追加されました」通知で再訪を促す",
      "● 限定ペルソナの季節配信：年末・母の日等の節目に限定キャラを期間限定公開",
      "● プレミアムから無料への「一時休止」機能：完全解約の前に「1ヶ月お休み」を選べる設計",
    ], C.lpurple, C.purple),
    ...sp(1),

    // ========== CHAPTER 6: ロードマップ ==========
    pgbrk(),
    h1("第6章　改訂版 開発・事業ロードマップ"),
    div(),

    new Table({width:{size:9500,type:WidthType.DXA},columnWidths:[1400,1800,3200,3100],rows:[
      hrow(["フェーズ","期間","開発・事業作業","マーケティング作業"],[1400,1800,3200,3100]),
      drow(["準備","Week 1〜2","アカウント開設（Supabase・FlutterFlow・OpenAI・RevenueCat）\nDB構築（本書SQLをコピペ）\nOpenAI APIキーで対話テスト","妻のSNSアカウント整備\nアプリのコンセプト投稿を開始（プレ告知）"],[1400,1800,3200,3100],false),
      drow(["MVP開発","Week 3〜6","タイムライン画面実装\n10人ペルソナチャット実装\nBGM自動再生実装\n社長スマホでテスト","知人へのβテスト依頼\nフィードバック収集"],[1400,1800,3200,3100],true),
      drow(["決済・法務","Week 7〜8","RevenueCat連携（Apple/Google決済）\n初月無料フロー実装\n利用規約・プライポリ画面実装\n総務省への電気通信事業届出","特商法ページ作成\nApp Store/Google Playアプリ申請の準備"],[1400,1800,3200,3100],false),
      drow(["プレミアム実装","Week 9〜11","音声通話（Realtime API）実装\nBGMチャンネル選択\nカスタムペルソナ4ステップ実装\nプレミアムロジック（月60分制限）","妻アカウントでApple/Google登録\n（ローンチ3ヶ月前）"],[1400,1800,3200,3100],true),
      drow(["審査・準備","Week 12〜14","App Store申請（審査1〜2週間）\nGoogle Play申請（審査数日）\nバグ修正・最終調整","インフルエンサー候補リストアップ\nプレスリリース草案作成"],[1400,1800,3200,3100],false),
      drow(["ローンチ","Month 4","全アカウント妻名義へ移行完了\nストア公開","Phase 1 プロモーション開始\n口コミ・SNS有機投稿フル稼働"],[1400,1800,3200,3100],true),
      drow(["Phase 2","Month 5〜6","解約予兆検知・プッシュ通知実装\n友達招待機能実装","インフルエンサーPR開始\nTikTok体験動画投稿"],[1400,1800,3200,3100],false),
      drow(["Phase 3","Month 7〜12","コミュニティ機能検討・実装\n季節限定キャラ機能","プレスリリース配信\nMeta広告開始（予算¥30,000〜）"],[1400,1800,3200,3100],true),
      drow(["Phase 4","Year 2〜","アフィリエイト機能\n企業提携向け管理ダッシュボード","アフィリエイトプログラム開設\n自治体・保育施設への営業"],[1400,1800,3200,3100],false),
    ]}),
    ...sp(2),

    div(),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:200},children:[new TextRun({text:"ふぅ (fuu)　開発マスター仕様書　Ver 2.0（全面改訂版）",bold:true,size:24,color:C.pink,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80},children:[new TextRun({text:"社長（オーナー）× CEO（Claude）　共同作成",size:20,color:C.grey,font:"Arial"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60},children:[new TextRun({text:"本書に含まれる法的情報はあくまで参考です。弁護士・税理士への相談を推奨します。",size:18,color:C.red,font:"Arial",italics:true})]}),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/sessions/epic-sleepy-lovelace/mnt/outputs/fuu_master_spec_v2.docx', buf);
  console.log('Done: fuu_master_spec_v2.docx');
});
