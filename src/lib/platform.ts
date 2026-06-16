/**
 * プラットフォーム検出ユーティリティ
 *
 * Capacitor（ネイティブアプリ）上で動いているか、
 * 通常のWebブラウザで動いているかを判定する。
 *
 * window.Capacitor は Capacitor ランタイムが自動で注入するオブジェクト。
 * ブラウザ（Vercel Web版）では undefined になる。
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
 * iOS ネイティブアプリでは Apple ガイドライン上、
 * アプリ内でデジタルコンテンツの購入 UI を表示できない。
 * （Stripe 決済ページへの誘導も NG）
 * → Safari（外部ブラウザ）に誘導する必要がある。
 *
 * Android・Web では通常の Stripe Checkout をそのまま使える。
 */
export const canShowInAppPurchase = (): boolean => {
  return !isIOS()
}

/**
 * Stripe Checkout URL を開く
 * - iOS ネイティブ: Safari（外部ブラウザ）で開く
 * - Android / Web: 同じタブで開く（通常の Stripe 遷移）
 */
export const openStripeCheckout = (url: string): void => {
  if (isIOS()) {
    // iOS: window.open で Safari が開く
    // Capacitor の Browser プラグインを入れた場合は Browser.open() が望ましいが、
    // window.open でも動作する（Safariが開く）
    window.open(url, '_blank')
  } else {
    // Android / Web: 同ページ遷移
    window.location.href = url
  }
}
