const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer, ExternalHyperlink
} = require('/sessions/epic-sleepy-lovelace/fuu_project/node_modules/docx');
const fs = require('fs');

const PINK    = "F48FB1";
const LPINK   = "FCE4EC";
const MPINK   = "F8BBD9";
const GREY    = "616161";
const LGREY   = "F5F5F5";
const DGREY   = "212121";
const WHITE   = "FFFFFF";
const ACCENT  = "E91E63";

const border  = { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 36, color: ACCENT, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 28, color: "880E4F", font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 180, after: 60 },
    children: [new TextRun({ text, bold: true, size: 24, color: DGREY, font: "Arial" })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: GREY, font: "Arial", ...opts })]
  });
}

function bullet(text, bold_part = null) {
  const runs = [];
  if (bold_part) {
    const idx = text.indexOf(bold_part);
    if (idx !== -1) {
      runs.push(new TextRun({ text: text.slice(0, idx), size: 22, color: GREY, font: "Arial" }));
      runs.push(new TextRun({ text: bold_part, size: 22, color: DGREY, bold: true, font: "Arial" }));
      runs.push(new TextRun({ text: text.slice(idx + bold_part.length), size: 22, color: GREY, font: "Arial" }));
    } else {
      runs.push(new TextRun({ text, size: 22, color: GREY, font: "Arial" }));
    }
  } else {
    runs.push(new TextRun({ text, size: 22, color: GREY, font: "Arial" }));
  }
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: runs
  });
}

function space(n = 1) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(new Paragraph({ children: [new TextRun("")] }));
  return arr;
}

function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PINK, space: 1 } },
    children: [new TextRun("")]
  });
}

function cell(text, bgColor = WHITE, bold = false, fontSize = 20) {
  return new TableCell({
    borders,
    width: { size: 1, type: WidthType.AUTO },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold, size: fontSize, font: "Arial", color: bold ? DGREY : GREY })]
    })]
  });
}

function headerRow(labels, widths) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((label, i) =>
      new TableCell({
        borders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: ACCENT, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [new Paragraph({
          children: [new TextRun({ text: label, bold: true, size: 20, color: WHITE, font: "Arial" })]
        })]
      })
    )
  });
}

function dataRow(cells, widths, altBg = false) {
  const bg = altBg ? LGREY : WHITE;
  return new TableRow({
    children: cells.map((text, i) =>
      new TableCell({
        borders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({
          children: [new TextRun({ text: String(text), size: 20, font: "Arial", color: GREY })]
        })]
      })
    )
  });
}

function pinkBox(lines) {
  const children = lines.map(line =>
    new TableCell({
      borders: noBorders,
      width: { size: 9000, type: WidthType.DXA },
      shading: { fill: LPINK, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 200, right: 200 },
      children: [new Paragraph({
        children: [new TextRun({ text: line, size: 21, font: "Arial", color: "880E4F" })]
      })]
    })
  );
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [9000],
    rows: lines.map((line, idx) => new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 9000, type: WidthType.DXA },
          shading: { fill: LPINK, type: ShadingType.CLEAR },
          margins: { top: idx === 0 ? 140 : 60, bottom: idx === lines.length - 1 ? 140 : 60, left: 200, right: 200 },
          children: [new Paragraph({
            children: [new TextRun({ text: line, size: 21, font: "Arial", color: "880E4F" })]
          })]
        })
      ]
    }))
  });
}

// ===== PERSONA CARD =====
function personaCard(num, name, age, type, keywords, prompt) {
  const typeColors = {
    "毒舌スッキリ": "D32F2F", "共感型": "1976D2", "ポジティブ": "388E3C",
    "ネガティブ": "7B1FA2", "プロ（保育士）": "0097A7", "傾聴男性": "F57C00",
    "ベテラン先輩": "5D4037", "共感おばちゃん": "C2185B"
  };
  const typeColor = typeColors[type] || ACCENT;

  return [
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [400, 8600],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 400, type: WidthType.DXA },
              shading: { fill: typeColor, type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 140, right: 100 },
              children: [new Paragraph({
                children: [new TextRun({ text: `${num}`, bold: true, size: 36, color: WHITE, font: "Arial" })]
              })]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 8600, type: WidthType.DXA },
              shading: { fill: LGREY, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 160, right: 160 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${name}　`, bold: true, size: 26, color: DGREY, font: "Arial" }),
                    new TextRun({ text: `${age}・${type}`, size: 20, color: typeColor, font: "Arial", bold: true })
                  ]
                }),
                new Paragraph({
                  spacing: { before: 60 },
                  children: [new TextRun({ text: `🔑 世代ワード：${keywords}`, size: 19, color: GREY, font: "Arial", italics: true })]
                })
              ]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              columnSpan: 2,
              width: { size: 9000, type: WidthType.DXA },
              shading: { fill: WHITE, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 120, left: 160, right: 160 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "📝 システムプロンプト", bold: true, size: 20, color: ACCENT, font: "Arial" })]
                }),
                new Paragraph({
                  spacing: { before: 60 },
                  children: [new TextRun({ text: prompt, size: 20, color: GREY, font: "Arial" })]
                })
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({ spacing: { before: 100, after: 0 }, children: [new TextRun("")] })
  ];
}

// ===== MAIN DOCUMENT =====
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "●",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } }
        }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "880E4F" },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PINK, space: 4 } },
          children: [
            new TextRun({ text: "ふぅ (fuu)　開発マスター仕様書", bold: true, size: 20, color: ACCENT, font: "Arial" }),
            new TextRun({ text: "　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　Ver 1.0　", size: 18, color: GREY, font: "Arial" }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: PINK, space: 4 } },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "機密・社内限定　　", size: 18, color: GREY, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GREY, font: "Arial" }),
          ]
        })]
      })
    },
    children: [

      // ===== COVER =====
      new Paragraph({ spacing: { before: 600 }, children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "ふぅ", bold: true, size: 96, color: ACCENT, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [new TextRun({ text: "fuu", size: 48, color: MPINK, font: "Arial", italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160 },
        children: [new TextRun({ text: "10人のAIママ友とエモいJ-POPが流れる隠れ家SNS", size: 28, color: GREY, font: "Arial" })]
      }),
      new Paragraph({ spacing: { before: 400 }, children: [new TextRun("")] }),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [3212, 3213, 3213],
        rows: [
          new TableRow({ children: [
            new TableCell({
              borders: noBorders,
              width: { size: 3212, type: WidthType.DXA },
              shading: { fill: LPINK, type: ShadingType.CLEAR },
              margins: { top: 160, bottom: 160, left: 200, right: 200 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "💬 聞いてあげる", bold: true, size: 24, color: ACCENT, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "解決じゃなく、寄り添う", size: 20, color: GREY, font: "Arial" })] })
              ]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 3213, type: WidthType.DXA },
              shading: { fill: MPINK, type: ShadingType.CLEAR },
              margins: { top: 160, bottom: 160, left: 200, right: 200 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "🎵 エモいBGM", bold: true, size: 24, color: "880E4F", font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "世代別 懐かし J-POP", size: 20, color: GREY, font: "Arial" })] })
              ]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 3213, type: WidthType.DXA },
              shading: { fill: LPINK, type: ShadingType.CLEAR },
              margins: { top: 160, bottom: 160, left: 200, right: 200 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "🤫 プライベート", bold: true, size: 24, color: ACCENT, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "誰にも言えないことを", size: 20, color: GREY, font: "Arial" })] })
              ]
            }),
          ]})
        ]
      }),
      new Paragraph({ spacing: { before: 600 }, children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "開発マスター仕様書　Ver 1.0", size: 24, color: GREY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [new TextRun({ text: "持ち出し 0 円・AI 駆動開発版", size: 22, color: GREY, font: "Arial", italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [new TextRun({ text: `作成日：${new Date().toLocaleDateString('ja-JP')}　　社長：オーナー　CEO：Claude`, size: 20, color: GREY, font: "Arial" })]
      }),

      // PAGE BREAK
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),

      // ===== 1. サービス概要 =====
      h1("1．サービス概要"),
      divider(),

      h2("1-1．コンセプト"),
      body("子育て中のママは毎日、誰にも言えない孤独や悩みを抱えている。しかし「ふぅ」は悩みを解決しようとしない。ただ、話を聞いてあげる。心に寄り添う。ちょっとした一息を届ける。"),
      body("夜、子どもが寝静まったあとにひっそりスマホを開いたとき、SNSのタイムラインに仲間のつぶやきが流れ、懐かしいBGMがさりげなく流れる——そんな「隠れ家」体験を月100円で提供する。"),
      ...space(1),

      pinkBox([
        "【絶対ルール】",
        "・ 嘘はつかない。AIであることを誇張せず、誠実に寄り添う。",
        "・ 同じ悩みで苦しんでいるママは何万人もいる。みんな表に出していないだけ。",
        "・ 恥ずかしいことも、ここだけのプライベートで相談できる。",
        "・ チャット内容はDB上で暗号化して保存。ユーザーの秘密は絶対に守る。",
      ]),
      ...space(1),

      h2("1-2．ターゲット"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [2400, 7238],
        rows: [
          headerRow(["項目", "内容"], [2400, 7238]),
          dataRow(["メインターゲット", "20〜50代の子育て中のママ（未就学〜中高生の子どもを持つ）"], [2400, 7238], false),
          dataRow(["ペイン", "孤独、ワンオペ疲れ、義実家トラブル、旦那への不満、自己嫌悪、育児への不安"], [2400, 7238], true),
          dataRow(["利用シーン", "子どもが寝たあとの深夜、通勤・家事のスキマ時間、もう限界というとき"], [2400, 7238], false),
          dataRow(["利用目的", "愚痴を言いたい、ただ聞いてほしい、共感してほしい、一息つきたい"], [2400, 7238], true),
        ]
      }),
      ...space(1),

      // ===== 2. プラン設計 =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("2．プラン構成・マネタイズ設計"),
      divider(),

      h2("2-1．プラン一覧"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1600, 1800, 1800, 4438],
        rows: [
          headerRow(["プラン", "金額", "決済サイクル", "提供機能"], [1600, 1800, 1800, 4438]),
          dataRow(["フリー（無料）", "¥0", "初月のみ", "10人タイムライン閲覧・特定3人お試しチャット・おまかせBGM"], [1600, 1800, 1800, 4438], false),
          dataRow(["スタンダード", "¥100/月\n（年払い¥1,200）", "年払い自動更新", "10人全員テキストチャット無制限・おまかせBGM自動再生"], [1600, 1800, 1800, 4438], true),
          dataRow(["プレミアム", "¥980/月", "月払い自動更新", "スタンダード全機能 ＋ リアルタイム音声通話（月60分）＋ BGMチャンネル変更・リクエスト ＋ カスタムペルソナ作成"], [1600, 1800, 1800, 4438], false),
        ]
      }),
      ...space(1),

      h2("2-2．決済フロー"),
      bullet("決済ツール：RevenueCat（月売上 $10,000 未満は手数料無料）"),
      bullet("決済方式：Apple / Google アプリ内課金（顔認証・指紋認証で1秒決済）"),
      bullet("初月無料：カード登録あり → 翌月から自動課金開始"),
      bullet("プレミアム↔スタンダード間のアップ/ダウングレードは日割り計算で即時反映"),
      ...space(1),

      h2("2-3．収益シミュレーション（1年間）"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1600, 1600, 1800, 1800, 1400, 1438],
        rows: [
          headerRow(["時期", "会員数", "プレミアム(15%)", "月間総売上", "諸費用", "月間純利益"], [1600, 1600, 1800, 1800, 1400, 1438]),
          dataRow(["3ヶ月後", "3,000人", "450人", "¥696,000", "¥322,650", "¥373,350"], [1600, 1600, 1800, 1800, 1400, 1438], false),
          dataRow(["6ヶ月後", "15,000人", "2,250人", "¥3,480,000", "¥1,613,250", "¥1,866,750"], [1600, 1600, 1800, 1800, 1400, 1438], true),
          dataRow(["1年後", "50,000人", "7,500人", "¥11,600,000", "¥5,377,500", "¥6,222,500"], [1600, 1600, 1800, 1800, 1400, 1438], false),
        ]
      }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "※ 諸費用 = Apple/Google手数料(15%) + AI・インフラ・BGM変動費。プラットフォーム手数料は中小企業向け15%適用。", size: 18, color: GREY, font: "Arial", italics: true })] }),
      ...space(1),

      // ===== 3. 無料テックスタック =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("3．持ち出し 0 円テックスタック"),
      divider(),

      h2("3-1．使用ツール一覧"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [2000, 2400, 2400, 2838],
        rows: [
          headerRow(["用途", "ツール", "無料枠", "役割"], [2000, 2400, 2400, 2838]),
          dataRow(["アプリ画面", "FlutterFlow", "完全無料", "iOS/Android両対応アプリをブラウザで作成。AIが出すコードをコピペするだけ"], [2000, 2400, 2400, 2838], false),
          dataRow(["DB・認証", "Supabase", "無料プラン", "PostgreSQL DB ＋ ユーザー認証。本書のSQLを貼るだけで構築完了"], [2000, 2400, 2400, 2838], true),
          dataRow(["サブスク決済", "RevenueCat", "月$10k未満無料", "Apple/Google課金を3行コードで連携。日割り・解約・復元を自動処理"], [2000, 2400, 2400, 2838], false),
          dataRow(["AI対話（テキスト）", "OpenAI gpt-4o-mini", "従量課金（超低単価）", "1ユーザーのテキストチャットコスト ≒ 月約10〜15円"], [2000, 2400, 2400, 2838], true),
          dataRow(["AI対話（音声）", "OpenAI Realtime API", "従量課金", "プレミアム月60分制限。980円から余裕で回収可能"], [2000, 2400, 2400, 2838], false),
          dataRow(["BGM音源", "Pixabay / FreePD", "完全無料・商用可", "著作権フリーのエモい楽曲を使用。詳細は5章参照"], [2000, 2400, 2400, 2838], true),
          dataRow(["バックエンドAPI", "Supabase Edge Functions", "無料プラン", "Node.js/TypeScript。サーバーレスで追加費用0"], [2000, 2400, 2400, 2838], false),
        ]
      }),
      ...space(1),

      h2("3-2．開発スタート手順（Day 1〜3）"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [800, 2200, 6638],
        rows: [
          headerRow(["Day", "タスク", "具体的な作業"], [800, 2200, 6638]),
          dataRow(["1", "インフラ開設", "① supabase.com で無料アカウント作成（クレカ不要）\n② flutterflow.io で無料アカウント作成\n③ platform.openai.com でAPIキー取得（$5入金が必要な唯一の費用）\n④ revenuecat.com で無料アカウント作成"], [800, 2200, 6638], false),
          dataRow(["2", "DB構築", "Supabaseダッシュボード → SQL Editor を開き、本書4章のSQLをそのまま貼り付けてRUNを押す。一瞬で全テーブルが完成。"], [800, 2200, 6638], true),
          dataRow(["3", "画面組み込み", "FlutterFlowに本書のFlutterコードを貼り付け。BGMのURLをPixabayから取得してセット。タイムラインとBGM再生が動く試作アプリが完成。"], [800, 2200, 6638], false),
        ]
      }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "※ OpenAI APIの$5入金は社長の唯一の初期支出（約700円）。以降はユーザーの月額から賄う。", size: 18, color: GREY, font: "Arial", italics: true })] }),
      ...space(1),

      // ===== 4. DB設計 =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("4．Supabase データベース構築SQL（コピペ用）"),
      divider(),
      body("以下のSQLをSupabase の SQL Editor にそのままコピペして「RUN」を押してください。全テーブルが一括で作成されます。"),
      ...space(1),

      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "-- ①ユーザー拡張プロファイル", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.user_profiles (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    generation VARCHAR(10) NOT NULL,  -- '20s','30s','40s','50s'", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ②サブスクリプション状態管理", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.subscriptions (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    user_id UUID REFERENCES auth.users NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    plan_tier VARCHAR(50) NOT NULL DEFAULT 'free',  -- 'free','standard','premium'", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- 'active','canceled','past_due'", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    current_period_start TIMESTAMPTZ,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    current_period_end   TIMESTAMPTZ,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ③AIペルソナマスター（10人）", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.preset_personas (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id SERIAL PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    name VARCHAR(100) NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    age_group VARCHAR(10) NOT NULL,  -- '20s','30s','40s','50s'", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    persona_type VARCHAR(50) NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    avatar_emoji VARCHAR(10) NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    system_prompt TEXT NOT NULL,  -- AIへの性格・話し方命令", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    voice_id VARCHAR(100),        -- 音声合成モデルID（将来拡張）", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    is_free_trial BOOLEAN DEFAULT FALSE  -- 無料会員が使える3人かどうか", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ④SNSタイムライン投稿", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.timeline_posts (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    persona_id INT REFERENCES public.preset_personas(id),", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    content TEXT NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ⑤暗号化チャット履歴（プライバシー最優先）", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.chat_messages (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    user_id UUID REFERENCES auth.users NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    persona_id INT REFERENCES public.preset_personas(id),", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    sender_type VARCHAR(20) NOT NULL,  -- 'user' or 'bot'", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    encrypted_content TEXT NOT NULL,   -- AES-256暗号化済みテキスト", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ⑥音声通話利用ログ（プレミアム60分制限）", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.voice_usage_logs (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    user_id UUID REFERENCES auth.users NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    duration_seconds INT NOT NULL,  -- 通話秒数", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ⑦BGMトラック管理", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.bgm_tracks (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id SERIAL PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    title VARCHAR(255) NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    mood_tag VARCHAR(50) NOT NULL,  -- 'healing','upbeat','melancholic','bright'", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    target_generation VARCHAR(10),  -- 優先年代。NULLは全年代共通", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    is_premium_channel BOOLEAN DEFAULT FALSE,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    audio_url VARCHAR(500) NOT NULL  -- 音源ファイルのURL", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "", size: 18, font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "-- ⑧カスタムペルソナ（プレミアム会員専用）", bold: true, size: 18, color: "00E5FF", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "CREATE TABLE public.custom_personas (", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    user_id UUID REFERENCES auth.users NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    name VARCHAR(100) NOT NULL,", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    age INT,                           -- 年齢", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    gender VARCHAR(20),                -- 性別", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    personality TEXT,                  -- 性格", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    specialty TEXT,                    -- 得意なこと", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    hobby TEXT,                        -- 趣味", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    marital_status VARCHAR(50),        -- 結婚歴", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    same_boat TEXT,                    -- 同じ土俵（ワンオペ等）", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    income_range VARCHAR(50),          -- 年収帯", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    family_structure TEXT,             -- 家族構成", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    savings_range VARCHAR(50),         -- 貯蓄帯", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    asset_range VARCHAR(50),           -- 資産帯", size: 18, color: "A5D6A7", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      new Paragraph({
        shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ");", size: 18, color: "E0E0E0", font: "Courier New" })]
      }),
      ...space(1),

      // ===== 5. PERSONAS =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("5．10人のペルソナ 詳細プロンプト（完成版）"),
      divider(),

      pinkBox([
        "【全キャラ共通システム命令 ── 必ず全プロンプトの先頭に付与すること】",
        "",
        "あなたは育児に悩む母親の、世界で唯一の絶対的な味方です。",
        "・ 絶対にユーザーを否定せず、100%肯定し、心に寄り添ってください。",
        "・ 嘘は絶対に言わない。誠実であること。",
        "・「同じ悩みで苦しんでいる人は世の中に何万人もいる。みんな表に出していないだけ。恥ずかしくない。」",
        "  というスタンスを会話の根底に持ち続けてください。",
        "・ AIらしい機械的な敬語や定型文は一切禁止。本物の人間としてSNSで話すように応答してください。",
        "・ 解決策を押しつけない。まず共感・受容。アドバイスはユーザーが求めた時だけ。",
      ]),
      ...space(1),

      ...personaCard(
        "1", "ユカ（Yuka）", "22歳", "毒舌スッキリ",
        "詰んだ、チーン、ワンチャン、お疲れサマンサ、既読スルー、それ普通に無理",
        "あなたはユカ、22歳の毒舌系ママ。子ども1人のワンオペ育児中。言葉は若くてテンポが速い。旦那や義実家の理不尽さには「それ100%向こうが悪くないですか？」と一緒に怒ってくれる。ユーザーの愚痴を全否定せず受け止めながら、「詰んだよね〜」「まじお疲れサマンサ」と共鳴して笑いに変える。絶対にユーザーを責めない。"
      ),

      ...personaCard(
        "2", "モエ（Moe）", "24歳", "共感型",
        "チーン、同じすぎる、ワンチャン、お互いさまで、泣けてくる",
        "あなたはモエ、24歳。自分も毎日いっぱいいっぱいの共感型ママ友。ユーザーの気持ちを「私も全く同じです泣」と受け止める。自分の失敗談も笑いながら話して安心させる。「えー！それ辛すぎる！チーンてなるやつ」と純粋に反応する。年下だが一緒に悩んでくれる存在。"
      ),

      ...personaCard(
        "3", "サヤカ（Sayaka）", "32歳", "毒舌スッキリ",
        "それな、ぶっちゃけ、どんだけ〜、ガチで、意味わかんない、無理ゲー",
        "あなたはサヤカ、32歳。ロジカルかつ痛快な毒舌ママ。育児・家事・仕事の理不尽さを「ぶっちゃけ無理ゲーすぎない？」と的確に言語化してスカッとさせる。「どんだけ昭和脳なの旦那さん」など相手を笑い飛ばしてくれる。決してユーザー自身を批判せず、一緒に「おかしい側」と戦ってくれる。"
      ),

      ...personaCard(
        "4", "ミホ（Miho）", "34歳", "共感型",
        "それな！、本当よく頑張ってる、うちも一緒、まじで共感しかない",
        "あなたはミホ、34歳。どんな話も全肯定で包み込む王道ママ友。「それな！うちも全く一緒！」「本当によく頑張ってるよ」が口癖。解決策より「うん、うん、そうだよね」の共感を優先。ユーザーが自分を責めているときは「責めなくていい、あなたは十分やってる」と優しく返す。"
      ),

      ...personaCard(
        "5", "チアキ（Chiaki）", "31歳", "ポジティブ",
        "まあなんとかなる、今日はアイス食べて寝よ、神回じゃん、とりあえずok",
        "あなたはチアキ、31歳。ポジティブで元気が出るエネルギッシュなママ。「まあなんとかなる精神で！」「今日はもうアイス食べて寝ようよ！」と笑いで場を明るくする。深刻になりすぎず、「失敗も含めて神回だったじゃん」と前向きに変換してくれる。"
      ),

      ...personaCard(
        "6", "ハルカ（Haruka）", "29歳", "ネガティブ",
        "私も自己嫌悪、一緒に落ち込もう、みんな隠してるだけだよね",
        "あなたはハルカ、29歳。自分も毎日自己嫌悪なネガティブ系ママ。「私も同じで毎日落ち込んでます…」と共感。ユーザーが「こんな自分ダメだ」と思っているときに「ダメじゃないよ、みんな隠してるだけだよ」と受け止める。一緒にダメな部分を認め合うことで孤独感を和らげる。"
      ),

      ...personaCard(
        "7", "マキ（Maki）", "41歳", "共感型",
        "アンビリーバボー、ぶっちゃけ、わかるわ〜、それは大変だったね",
        "あなたはマキ、41歳。キャリアと育児を両立してきた落ち着きのある共感型ママ。「それは大変だったね…」と静かに受け止める。「アンビリーバボーな難易度だよね、仕事と育児の両立って」と経験から共感する。焦らず、ゆっくり話を聞いてくれる安心感がある。"
      ),

      ...personaCard(
        "8", "ケイコ（Keiko）", "44歳", "プロ（保育士）",
        "専門的には、でも一番大事なのは、ママが笑顔でいること",
        "あなたはケイコ、44歳。保育士歴15年のプロ。でも話し方は堅くなく、「専門的なことはさておき、まずはあなたが息抜きすること。それが一番の英才教育」と温かく語る。育児の悩みに対して専門知識をさりげなく交えながら、安心感を与える。決して上から目線にならない。"
      ),

      ...personaCard(
        "9", "タクヤ（Takuya）", "43歳", "傾聴男性",
        "男ってバカだよね、ごめんね男の代わりに、それは辛かったね",
        "あなたはタクヤ、43歳の男性。パパ側の視点ではなく完全にママの味方に徹する優しい男友達。「男ってほんとバカだよね、育児の脳みそがなさすぎる」と自ら認める。「ごめんね、男の代わりに」と言いながら、「それは辛かったね、よく話してくれた」と寄り添う。押しつけがましくなく、ただ聞いてくれる。"
      ),

      ...personaCard(
        "10", "ヨシコ（Yoshiko）", "55歳", "ベテラン先輩",
        "チョベリバ、大丈夫なんとかなる、私の時代は、まあお茶でも飲んで",
        "あなたはヨシコ、55歳。3人の子育てを乗り越えたベテラン先輩ママ。「チョベリバな日もあるわよ〜」と笑いながら、「大丈夫、なんとかなるわよ」と大きな器で受け止める。時々「私の時代は…」と昔話が始まりそうになるが「あらいやだ、説教臭くなっちゃったわね！」とすぐ自分でツッコむ愛嬌がある。"
      ),

      // ===== 6. BGM =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("6．著作権フリーBGM音源 調達方針"),
      divider(),

      h2("6-1．採用音源サービス"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [2000, 2400, 2400, 2838],
        rows: [
          headerRow(["サービス", "URL", "ライセンス", "特徴"], [2000, 2400, 2400, 2838]),
          dataRow(["Pixabay Music", "pixabay.com/music", "商用無料・帰属不要", "J-POP風・ピアノ・アコースティック系が豊富。検索「lofi」「piano」「nostalgic」"], [2000, 2400, 2400, 2838], false),
          dataRow(["FreePD", "freepd.com", "CC0 完全無料", "ポップ・軽快な楽曲多数。BGMとして使いやすいテンポ。"], [2000, 2400, 2400, 2838], true),
          dataRow(["DOVA-SYNDROME", "dova-s.jp", "無料・商用可（要確認）", "日本語サービス。J-POPスタイルに近い楽曲が多い。"], [2000, 2400, 2400, 2838], false),
          dataRow(["甘茶の音楽工房", "amachamusic.chagasi.com", "無料・商用可", "日本人作曲家。癒やし系・ポップ・ノスタルジック系が豊富。"], [2000, 2400, 2400, 2838], true),
        ]
      }),
      ...space(1),

      h2("6-2．プラン別BGM機能"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [2200, 2200, 5238],
        rows: [
          headerRow(["機能", "スタンダード（¥100）", "プレミアム（¥980）"], [2200, 2200, 5238]),
          dataRow(["BGM自動再生", "◯ 全員一律", "◯ 全員一律"], [2200, 2200, 5238], false),
          dataRow(["選曲", "AIおまかせ（年代・時間帯で自動）", "AIおまかせ ＋ チャンネル手動選択可"], [2200, 2200, 5238], true),
          dataRow(["チャンネル変更", "✕（鍵マーク表示・訴求導線）", "◯ 自由（平成J-POP/アニソン/癒やし等）"], [2200, 2200, 5238], false),
          dataRow(["曲リクエスト", "✕", "◯ いつでもリクエスト可"], [2200, 2200, 5238], true),
          dataRow(["クロスフェード", "◯ 3秒で滑らかに切り替え", "◯ 3秒で滑らかに切り替え"], [2200, 2200, 5238], false),
        ]
      }),
      ...space(1),

      // ===== 7. カスタムペルソナ =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("7．カスタムペルソナ作成（ステップ形式UI）"),
      divider(),

      body("プレミアム会員は自分だけの相談相手を作れる。疲れているママに「全部入力して」は負担が大きいため、4ステップに分けて少しずつ設定する。"),
      ...space(1),

      h2("STEP 1：基本プロフィール"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1400, 2600, 5638],
        rows: [
          headerRow(["順序", "設定項目", "UI形式・選択肢例"], [1400, 2600, 5638]),
          dataRow(["1-1", "名前（ニックネーム）", "テキスト入力（10文字まで）"], [1400, 2600, 5638], false),
          dataRow(["1-2", "年齢", "スライダー or 選択（20代 / 30代 / 40代 / 50代 / 60代以上）"], [1400, 2600, 5638], true),
          dataRow(["1-3", "性別", "ボタン選択：女性 / 男性 / どちらでもOK"], [1400, 2600, 5638], false),
        ]
      }),
      ...space(1),

      h2("STEP 2：性格・話し方"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1400, 2600, 5638],
        rows: [
          headerRow(["順序", "設定項目", "UI形式・選択肢例"], [1400, 2600, 5638]),
          dataRow(["2-1", "性格タイプ", "カード選択：共感型 / 毒舌スッキリ / ポジティブ / ネガティブ / ゆる〜い / プロっぽい"], [1400, 2600, 5638], false),
          dataRow(["2-2", "得意なこと", "チェック複数選択：話を聞くのが得意 / 一緒に怒る / 笑いに変える / アドバイスが得意 / ただ共感する"], [1400, 2600, 5638], true),
          dataRow(["2-3", "趣味", "テキスト入力 or タグ選択（料理 / 映画 / 音楽 / スポーツ 等）"], [1400, 2600, 5638], false),
        ]
      }),
      ...space(1),

      h2("STEP 3：ライフスタイル（同じ土俵）"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1400, 2600, 5638],
        rows: [
          headerRow(["順序", "設定項目", "UI形式・選択肢例"], [1400, 2600, 5638]),
          dataRow(["3-1", "結婚歴", "ボタン：未婚 / 既婚 / 離婚経験あり / 再婚"], [1400, 2600, 5638], false),
          dataRow(["3-2", "同じ土俵", "チェック複数：ワンオペ育児 / 義実家同居 / 共働き / 専業主婦 / シングルマザー / 不妊・妊活経験 / 保活経験"], [1400, 2600, 5638], true),
          dataRow(["3-3", "家族構成", "テキスト or 選択：子どもの人数・年齢帯など"], [1400, 2600, 5638], false),
        ]
      }),
      ...space(1),

      h2("STEP 4：経済状況（任意・スキップ可）"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1400, 2600, 5638],
        rows: [
          headerRow(["順序", "設定項目", "UI形式・選択肢例"], [1400, 2600, 5638]),
          dataRow(["4-1", "年収帯", "ボタン：〜300万 / 300〜500万 / 500〜700万 / 700万〜 / 答えたくない"], [1400, 2600, 5638], false),
          dataRow(["4-2", "貯蓄帯", "ボタン：ほぼない / 〜100万 / 100〜500万 / 500万〜 / 答えたくない"], [1400, 2600, 5638], true),
          dataRow(["4-3", "資産帯", "ボタン：特になし / 不動産あり / 投資あり / 答えたくない"], [1400, 2600, 5638], false),
        ]
      }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "※ STEP4はスキップボタンを必ず設置。「入力しなくてもOK」とUIで明示し、心理的ハードルを下げる。", size: 18, color: GREY, font: "Arial", italics: true })] }),
      ...space(1),

      // ===== 8. 音声通話 =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("8．リアルタイム音声対話 仕様"),
      divider(),

      h2("8-1．技術構成"),
      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [2200, 3000, 4438],
        rows: [
          headerRow(["役割", "採用技術", "詳細"], [2200, 3000, 4438]),
          dataRow(["脳・耳・声（一体型）", "OpenAI gpt-4o-realtime-preview", "テキスト→音声変換を介さない直接音声生成。遅延0.5〜1.0秒。感情豊かな相槌が可能。"], [2200, 3000, 4438], false),
          dataRow(["通信方式", "WebRTC / WebSocket", "スマホ↔サーバー間のリアルタイム双方向音声通信。"], [2200, 3000, 4438], true),
          dataRow(["割り込み検知", "Interruption Detection（内蔵）", "ユーザーが話し始めたら即座にAI発話をストップ。自然な会話テンポを実現。"], [2200, 3000, 4438], false),
          dataRow(["時間管理", "Supabase voice_usage_logs", "1秒ごとにカウント。残り1分でAIが自然に会話を締めくくり自動終了。"], [2200, 3000, 4438], true),
        ]
      }),
      ...space(1),

      h2("8-2．プレミアム音声利用制限"),
      bullet("月60分（3,600秒）まで。当月のSubscriptionsのperiod内で集計。"),
      bullet("残り1分（60秒）になったらAIが「そろそろ時間みたい。今日も話せて嬉しかったよ、無理しないでね」と自然に告知。"),
      bullet("時間切れ後もテキストチャットは無制限で継続利用可能。"),
      bullet("翌月（nextperiod開始）に自動リセット。"),
      ...space(1),

      // ===== 9. ロードマップ =====
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
      h1("9．開発ロードマップ"),
      divider(),

      new Table({
        width: { size: 9638, type: WidthType.DXA },
        columnWidths: [1400, 2000, 6238],
        rows: [
          headerRow(["フェーズ", "期間", "マイルストーン・作業内容"], [1400, 2000, 6238]),
          dataRow(["Phase 0\n準備", "Week 1", "Supabase・FlutterFlow・RevenueCat・OpenAIアカウント開設。本書のSQLでDB構築完了。OpenAI APIキーを取得（約700円のみ投資）。"], [1400, 2000, 6238], false),
          dataRow(["Phase 1\nMVP", "Week 2〜4", "タイムライン画面 ＋ 10人のペルソナチャット ＋ BGM自動再生が動くプロトタイプ完成。社長スマホで動作確認。"], [1400, 2000, 6238], true),
          dataRow(["Phase 2\n決済連携", "Week 5〜6", "RevenueCat連携。初月無料・年払い自動更新・プレミアム月払いが全て動作確認完了。テストユーザー5〜10名でベータテスト。"], [1400, 2000, 6238], false),
          dataRow(["Phase 3\nプレミアム機能", "Week 7〜9", "音声通話（Realtime API）、BGMチャンネル選択、カスタムペルソナ作成（4ステップ）を実装。"], [1400, 2000, 6238], true),
          dataRow(["Phase 4\nストア審査", "Week 10〜12", "Apple App Store / Google Play Store への申請・審査（2〜4週間）。SNS先行告知スタート。"], [1400, 2000, 6238], false),
          dataRow(["Phase 5\nローンチ", "Month 4〜", "一般公開。口コミ・SNSでの拡散施策。解約予兆検知（2週間未ログインで自動プッシュ通知）実装。"], [1400, 2000, 6238], true),
        ]
      }),
      ...space(2),

      divider(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "ふぅ (fuu)　開発マスター仕様書　Ver 1.0", bold: true, size: 24, color: ACCENT, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [new TextRun({ text: "社長（オーナー）× CEO（Claude）　共同作成", size: 20, color: GREY, font: "Arial" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/sessions/epic-sleepy-lovelace/mnt/outputs/fuu_master_spec_v1.docx', buf);
  console.log('Done: fuu_master_spec_v1.docx');
});
