#!/bin/bash
set -e

echo "🔨 Building VoiceWake iOS App"
echo ""

cd /Users/mustafaboorenie/voicewakeapp

# Step 1: Clean Metro cache
echo "📦 Cleaning Metro cache..."
rm -rf node_modules/.cache
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

# Step 2: Start Metro in background
echo "🚀 Starting Metro bundler..."
npx expo start --clear &
METRO_PID=$!
echo "   Metro PID: $METRO_PID"

# Wait for Metro to start
echo "⏳ Waiting for Metro to start..."
sleep 5

# Step 3: Build and run on device
echo "📱 Building and running on device..."
echo "   Make sure your iPhone is connected via USB"
echo "   and unlocked..."
echo ""

# List connected devices
echo "Available devices:"
xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v Simulator || echo "No devices found"
echo ""

# Run on device (will prompt for device selection)
npx expo run:ios --device

# Cleanup
echo ""
echo "Stopping Metro..."
kill $METRO_PID 2>/dev/null || true

echo ""
echo "✅ Done!"

