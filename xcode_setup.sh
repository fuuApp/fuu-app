#!/bin/bash
# ─────────────────────────────────────────────────────────────
# fuu ふぅ  ─  Xcode / Android Studio 起動前準備スクリプト
# 実行: bash xcode_setup.sh
# ─────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  fuu ふぅ  ─  ネイティブビルド準備"
echo "═══════════════════════════════════════════════════════"

# 1. 依存パッケージ確認
echo ""
echo "▶ [1/4] npm install ..."
npm install --silent

# 2. Capacitor sync（iOS + Android 両方）
echo ""
echo "▶ [2/4] npx cap sync ..."
npx cap sync

# 3. iOS Pods 更新
echo ""
echo "▶ [3/4] pod install (iOS) ..."
cd ios/App
pod install --silent
cd ../..

echo ""
echo "▶ [4/4] 準備完了！"
echo ""
echo "─── iOS (Xcode) ──────────────────────────────────────"
echo "  open ios/App/App.xcworkspace"
echo ""
echo "  Xcode 起動後:"
echo "  1. Signing & Capabilities → Team を設定"
echo "  2. Simulator: iPhone 15 Pro (iOS 17+) を選択"
echo "  3. ⌘R でビルド & 起動"
echo "  4. プラン画面（/app/plans）を開いて"
echo "     「🌐 プランを見る →」ボタンを確認"
echo ""
echo "─── Android (Android Studio) ──────────────────────────"
echo "  open -a 'Android Studio' android"
echo ""
echo "  起動後:"
echo "  1. Sync Project with Gradle Files"
echo "  2. AVD Manager → Pixel 8 (API 35) を起動"
echo "  3. ▶ Run でビルド & 起動"
echo ""
echo "  ⚠  targetSdkVersion を 34 → 35 に更新済み"
echo "     build.gradle sync が必要な場合は"
echo "     File → Sync Project with Gradle Files"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  完了！Xcodeを開くには:"
echo "  open ios/App/App.xcworkspace"
echo "═══════════════════════════════════════════════════════"
