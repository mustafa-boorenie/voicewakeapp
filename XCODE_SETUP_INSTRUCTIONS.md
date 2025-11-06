# iOS Module Registration Fix

The error you're seeing happens because the Swift modules need Objective-C bridge files to be registered with React Native.

## Quick Fix Steps

### Option 1: Using Xcode (Recommended)

1. **Open the project in Xcode:**
   ```bash
   cd /Users/mustafaboorenie/voicewakeapp
   open ios/AffirmationAlarm.xcworkspace
   ```

2. **Add the bridge files to the project:**
   - In Xcode's Project Navigator (left sidebar), right-click on the `AffirmationAlarm/Alarms` folder
   - Select "Add Files to AffirmationAlarm..."
   - Navigate to and select: `ios/AffirmationAlarm/Alarms/AlarmSchedulerBridge.m`
   - Make sure "Copy items if needed" is **unchecked**
   - Make sure "Add to targets: AffirmationAlarm" is **checked**
   - Click "Add"

3. **Add the speech recognizer files:**
   - Right-click on the `AffirmationAlarm` folder (not the Alarms subfolder)
   - Select "Add Files to AffirmationAlarm..."
   - Add these files one by one:
     - `ios/AffirmationAlarm/SpeechRecognizerModule.swift`
     - `ios/AffirmationAlarm/SpeechRecognizerBridge.m`
     - `ios/AffirmationAlarm/Alarms/AlarmKitBridge.swift`

4. **Clean and rebuild:**
   - In Xcode menu: Product → Clean Build Folder (⇧⌘K)
   - Product → Build (⌘B)

5. **Restart Metro bundler:**
   ```bash
   # Kill existing Metro
   pkill -f "react-native"
   
   # Start fresh
   npm start -- --reset-cache
   ```

### Option 2: Command Line (if you have xcodeproj gem)

```bash
cd /Users/mustafaboorenie/voicewakeapp
gem install xcodeproj
ruby add_bridge_files.rb
```

## Files Created

The following bridge files have been created for you:

1. **`ios/AffirmationAlarm/Alarms/AlarmSchedulerBridge.m`**
   - Exposes the AlarmScheduler Swift module to React Native

2. **`ios/AffirmationAlarm/SpeechRecognizerBridge.m`**
   - Exposes the SpeechRecognizer Swift module to React Native

These files tell React Native how to communicate with your Swift code.

## Verify It Works

After adding the files and rebuilding, you should see:
- No more "AlarmScheduler native module is unavailable" error
- The app should load successfully
- You can test by creating an alarm

## Troubleshooting

If you still see errors:

1. **Check bridging header:**
   - Open `ios/AffirmationAlarm/AffirmationAlarm-Bridging-Header.h`
   - Make sure it contains:
     ```objc
     #import <React/RCTBridgeModule.h>
     #import <React/RCTEventEmitter.h>
     ```

2. **Check build settings:**
   - In Xcode, select the project in the navigator
   - Select the "AffirmationAlarm" target
   - Go to "Build Settings"
   - Search for "Objective-C Bridging Header"
   - Make sure it's set to: `AffirmationAlarm/AffirmationAlarm-Bridging-Header.h`

3. **Clean everything:**
   ```bash
   cd ios
   rm -rf build
   rm -rf ~/Library/Developer/Xcode/DerivedData/AffirmationAlarm-*
   pod install
   cd ..
   npm start -- --reset-cache
   ```

## Why This Happened

Swift modules in React Native need Objective-C bridge files (`.m` files) that use the `RCT_EXTERN_MODULE` macro to register the module with React Native's bridge. Without these files, JavaScript can't find the native modules.


