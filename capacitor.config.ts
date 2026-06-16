// @capacitor/cli は `npm run cap:sync` 実行前に `npm install` で導入してください
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CapacitorConfig = any;

const config: CapacitorConfig = {
  // App Store / Google Play の Bundle ID（逆ドメイン形式）
  // 例：com.ogdstudio.fuu
  // ※ Apple Developer / Google Play に登録するIDと完全一致させること
  appId: 'com.ogdstudio.fuu',

  appName: 'fuu ふぅ',

  // Capacitorビルド時の静的ファイル出力先（next build の output dir）
  webDir: 'out',

  // iOS / Android 共通設定
  server: {
    url: 'https://fuu-app.vercel.app',
    cleartext: false,
  },

  plugins: {
    // ─── プッシュ通知 ──────────────────────────────────────────
    // iOS: Apple Push Notification Service (APNs) が必要
    // → Xcode で Push Notifications Capability を追加すること
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // ─── ディープリンク（Supabase OTP メール認証コールバック用）──
    // fuu://auth/callback 形式のリンクをアプリ内で処理する
    // iOS: Info.plist に URL Scheme を追加
    // Android: AndroidManifest.xml に intent-filter を追加
    // ※ Supabase Dashboard → Auth → URL Configuration → Redirect URLs に
    //   「fuu://auth/callback」を追加すること

    // ─── ステータスバー ────────────────────────────────────────
    StatusBar: {
      style: 'light',  // ステータスバーのテキスト色（light = 白）
      backgroundColor: '#E91E63',  // ふぅのピンク
    },

    // ─── スプラッシュスクリーン ────────────────────────────────
    SplashScreen: {
      launchShowDuration: 2000,  // 2秒表示
      backgroundColor: '#E91E63',
      showSpinner: false,
    },
  },

  // ─── iOS 固有設定 ──────────────────────────────────────────────
  ios: {
    // App Store Connect で設定する Team ID
    // Xcode → Signing & Capabilities → Team から確認
    // contentInset: 'automatic',
    allowsLinkPreview: false,
    // ディープリンク用 URL Scheme
    // Info.plist に追加する必要あり（Capacitor が自動生成）
  },

  // ─── Android 固有設定 ─────────────────────────────────────────
  android: {
    // Google Play Console のパッケージ名と一致させること
    // allowMixedContent: false,  // 本番は false（HTTPS のみ）
    captureInput: true,  // 日本語入力の改善
    webContentsDebuggingEnabled: false,  // 本番は false
  },
};

export default config;
