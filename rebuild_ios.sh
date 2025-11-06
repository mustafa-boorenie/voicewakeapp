#!/bin/bash
set -e

echo "🧹 Cleaning previous builds..."
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/AffirmationAlarm-* 2>/dev/null || true

echo "📦 Installing pods..."
cd ios
pod install
cd ..

echo "🔨 Building iOS app..."
npx expo run:ios --no-build-cache

echo "✅ Build complete!"
