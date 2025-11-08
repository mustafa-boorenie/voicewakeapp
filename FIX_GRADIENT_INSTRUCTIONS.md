# Fixing the Gradient Issue

## What Happened
The `expo-linear-gradient` is a native module that requires the iOS app to be rebuilt after installation.

## Solution

### Option 1: Rebuild with Expo (RECOMMENDED)
```bash
# Stop the current development server (Ctrl+C)
# Then run:
npx expo run:ios
```

This will rebuild the app with the native module properly linked.

### Option 2: Clean Build
If Option 1 doesn't work:

```bash
# 1. Clean the iOS build folder
cd ios
rm -rf build
cd ..

# 2. Rebuild the app
npx expo run:ios
```

### Option 3: Manual Xcode Rebuild
1. Open Xcode: `open ios/AffirmationAlarm.xcworkspace`
2. Product → Clean Build Folder (Cmd+Shift+K)
3. Close Xcode
4. Run: `npx expo run:ios`

## After Rebuild

Once the app rebuilds successfully:
- The gradient card should display properly (pink → lavender → cyan)
- No more ViewManagerAdapter errors
- The alarm screens will look beautiful! ✨

## Troubleshooting

### If you still see errors:
1. Check that expo-linear-gradient is installed:
   ```bash
   npm ls expo-linear-gradient
   ```

2. Verify node_modules:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Full clean rebuild:
   ```bash
   cd ios
   rm -rf build Pods Podfile.lock
   cd ..
   npx pod-install
   npx expo run:ios
   ```

### Alternative: Use Solid Color Temporarily
If you need the app to work immediately without rebuilding, I can replace the gradient with a solid color temporarily.

## What the Gradient Should Look Like
- Top: Soft pink (#FFC0CB)
- Middle: Lavender (#E0BBE4)  
- Bottom: Light cyan (#B0E0E6)
- Diagonal gradient from top-left to bottom-right

The gradient appears on the alarm preview card showing the alarm label and time.

