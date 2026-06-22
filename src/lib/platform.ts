/**
 * プラットフォーム検出ユーティリティ
 *
 * Capacitor（ネイティブアプリ）上で動いているか、
 * 通常のWebブラウザで動いているかを判定する。
 *
 * window.Capacitor は Capacitor ランタイムが自動で注入するオブジェクト。
 * ブラウザ（Vercel Web版）では undefined になる。
 *
 * ── 決済方針 ──────────────────────────────────────────────────────────
 * Apple/Google IAP は一切使用しない（手数料30%回避）。
 * Netflix・Spotify と同じ「Reader App」方式を採用。
 *
 * iOS（App Store）:
 *   @capacitor/browser の Browser.open() で Safari（外部ブラウザ）を開く。
 *   WebView 内で Stripe 画面を表示すると Apple ガイドライン違反になるため必須。
 *
 * Android（Google Play）:
 *   同様に Browser.open() で Chrome（外部ブラウザ）を開く。
 *   WebView 内決済は Google Play ポリシー上グレーゾーンのため外部ブラウザに統一。
 *
 * Web（Vercel / ブラウザ直アクセス）:
 *   window.location.href で同タブ遷移（通常の Stripe Checkout）。
 *
 * 決済完了後の success_url は https://fuu-app.vercel.app/app/plans?success=true。
 * ユーザーがアプリに戻った際、App.appStateChange リスナーでプラン状態を再取得する。
 * ──────────────────────────────────────────────────────────────────────
 */

// Capacitor ランタイムの型定義（インポート不要でアクセスできる）
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean
      getPlatform: () => 'ios' | 'android' | 'web'
    }
  }
}

/** ネイティブアプリとして動いているか（iOS / Android） */
export const isNative = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.Capacitor?.isNativePlatform() ?? false
}

/** iOS ネイティブアプリとして動いているか */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.Capacitor?.getPlatform() === 'ios'
}

/** Android ネイティブアプリとして動いているか */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.Capacitor?.getPlatform() === 'android'
}

/**
 * Stripe Checkout URL を開く
 *
 * - iOS / Android ネイティブ:
 *     @capacitor/browser の Browser.open() で外部ブラウザ（Safari / Chrome）を起動。
 *     WebView 内決済を完全に回避する。
 *
 * - Web（Vercel）:
 *     window.location.href で同タブ遷移。
 *
 * ※ 非同期だが呼び出し元は await 不要（エラーは内部でキャッチ）。
 */
export const openStripeCheckout = async (url: string): Promise<void> => {
  if (isNative()) {
    try {
      // SSR 対策: useEffect 内（クライアント限定）でのみ到達するが念のため動的 import
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } catch (e) {
      // Browser プラグインが使えない場合のフォールバック
      console.warn('[platform] Browser.open failed, fallback to window.open', e)
      window.open(url, '_blank')
    }
  } else {
    // Web: 通常の Stripe Checkout 遷移
    window.location.href = url
  }
}
