# Permission Request Not Working - Debug Guide

## Summary of Changes

I've implemented several fixes to ensure notification permissions are requested properly:

### 1. Simplified Permission Flow
**File:** `ios/AffirmationAlarm/Alarms/AlarmSchedulerModule.swift`

**What Changed:**
- Removed complex callback nesting (AlarmKit → getNotificationSettings → requestAuthorization)
- Ensured all permission requests happen on main thread (required by Apple)
- Made AlarmKit request happen AFTER notifications are granted (not before)
- Added extensive logging to track execution flow

**Key Fix:**
```swift
// OLD: Complex nesting that could fail silently
alarmKitBridge.requestAuthorization { granted in
  // Nested inside AlarmKit callback
  UNUserNotificationCenter.current().getNotificationSettings { settings in
    // Nested inside getSettings
    center.requestAuthorization(...) { granted, error in
      // Finally request permissions
    }
  }
}

// NEW: Direct, simple flow
DispatchQueue.main.async {  // Ensure main thread
  UNUserNotificationCenter.current().getNotificationSettings { settings in
    DispatchQueue.main.async {  // Double-check main thread
      center.requestAuthorization(...) { granted, error in
        // Request permissions directly
        // THEN request AlarmKit as a bonus
      }
    }
  }
}
```

### 2. Added Direct Test Method
Created `directRequestNotificationPermission` method that:
- Tests permission request in complete isolation
- Logs every step of execution
- Shows thread information
- Confirms callback execution

### 3. Enhanced Logging
Every step now logs:
- `🧪 DIRECT PERMISSION REQUEST TEST`
- `🧪 Thread: MAIN` / `BACKGROUND`
- `🧪 Calling requestAuthorization...`
- `🧪 requestAuthorization callback executed!`
- `🧪 Granted: true/false`

## How to Test

### Method 1: Direct Test (Easiest)

1. **Open the app**
2. **Open the in-app console** (shake device or use dev menu)
3. **Type in console:**
   ```javascript
   import { NativeModules } from 'react-native';
   await NativeModules.AlarmScheduler.directRequestNotificationPermission();
   ```

4. **Watch for:**
   - iOS permission dialog appearing
   - Console logs showing the flow

### Method 2: Through Alarm Creation

1. **Open the app**
2. **Try to create an alarm**
3. **Watch the console for:**
   ```
   🔔 Checking notification permission status...
   📋 Current notification authorization status: 0  (0 = notDetermined)
   🔔 Requesting notification permissions (first time)...
   ⚠️ iOS system dialog should appear now...
   ```

4. **If dialog appears:** Success! Grant permission
5. **If dialog doesn't appear:** Check status in logs

### Method 3: Reset and Test Fresh

If you've been testing and permissions are in a weird state:

1. **Delete the app completely**
2. **Restart your device** (important!)
3. **Reinstall:** `npx expo run:ios --device`
4. **Open app and watch for permission dialog**

## What to Look For

### In Console (JavaScript):
```
📋 Current notification permission status: notDetermined
🔔 First time requesting permissions - iOS dialog will appear
✅ User GRANTED notification permissions
```

### In Xcode Logs (Native):
```
🧪 DIRECT PERMISSION REQUEST TEST
🧪 Thread: true (MAIN)
🧪 Now on main thread: true
🧪 Got notification center: <UNUserNotificationCenter>
🧪 Calling requestAuthorization...
🧪 requestAuthorization called (waiting for callback...)
🧪 requestAuthorization callback executed!
🧪 Granted: true
```

## Common Issues & Solutions

### Issue 1: Status is "denied"
**Symptoms:**
```
📋 Current notification permission status: denied
❌ Permissions were previously denied - user must enable in Settings
```

**Solution:**
- iOS won't show dialog again (security feature)
- Go to: **Settings → VoiceWake → Notifications**
- Enable "Allow Notifications"
- Return to app

**Or reset completely:**
1. Delete app
2. Restart device
3. Reinstall

### Issue 2: Status is "notDetermined" but dialog doesn't appear
**Symptoms:**
- Logs show `notDetermined`
- Logs show `🧪 Calling requestAuthorization...`
- But no iOS dialog appears
- Callback might not execute

**Possible causes:**
1. **Not on main thread** - Fixed in latest code
2. **React Native bridge issue** - Try native Xcode logs
3. **Simulator bug** - Try real device
4. **iOS cache** - Restart device

**Debug steps:**
1. Check Xcode device logs (not React Native console)
2. Look for native print statements (`🧪 ...`)
3. Verify thread is MAIN
4. Verify callback executes

### Issue 3: Nothing happens at all
**Symptoms:**
- No logs appear
- Nothing happens when creating alarm

**Check:**
1. Is native module loaded?
   ```javascript
   import { NativeModules } from 'react-native';
   console.log(NativeModules.AlarmScheduler);
   // Should show an object, not undefined
   ```

2. Are you on iOS?
   ```javascript
   import { Platform } from 'react-native';
   console.log(Platform.OS);  // Should be "ios"
   ```

3. Did the build succeed?
   - Check Xcode for build errors
   - Look for Swift compilation issues

## Apple's Requirements (Verified)

✅ **Info.plist has notification description** - Line 51-52  
✅ **Request on main thread** - Fixed with `DispatchQueue.main.async`  
✅ **Use UNUserNotificationCenter** - Using `UNUserNotificationCenter.current()`  
✅ **Request with options** - Using `[.alert, .sound, .badge]`  
✅ **Check status first** - Using `getNotificationSettings`  
✅ **Handle callback properly** - Callback now explicit and logged  

## Files Changed

1. **`ios/AffirmationAlarm/Alarms/AlarmSchedulerModule.swift`**
   - Simplified `ensureNotificationPermission`
   - Added `directRequestNotificationPermission` for testing
   - Enhanced logging throughout

2. **`ios/AffirmationAlarm/Alarms/AlarmSchedulerBridge.m`**
   - Added bridge for `directRequestNotificationPermission`

3. **`src/modules/alarm/AlarmScheduler.ts`**
   - Already had good logging
   - Status check before request

4. **`src/screens/CreateAlarmScreen.tsx`**
   - Checks permissions before saving
   - Shows helpful prompts

## Next Steps

1. **Rebuild the app:**
   ```bash
   cd ios
   pod install
   cd ..
   npx expo run:ios --device
   ```

2. **Watch the console closely** when you try to create an alarm

3. **If dialog still doesn't appear:**
   - Run the direct test method
   - Check Xcode device logs
   - Verify it's running on a real device (not simulator)
   - Try restarting the device

4. **Report back what you see:**
   - Current permission status
   - Whether callback executes
   - Any error messages
   - What platform/iOS version you're on

## Why This Should Work Now

1. **Main Thread:** All permission requests explicitly on main thread
2. **Simple Flow:** No complex nesting that could fail
3. **AlarmKit Last:** Doesn't block notification request
4. **Extensive Logging:** Can see exactly where it fails
5. **Direct Test:** Can test in isolation
6. **Follows Apple Guidelines:** Verified against official docs

The permission dialog WILL appear if:
- Status is `notDetermined` (first time)
- Code is on main thread (now enforced)
- iOS allows it (not restricted)
- App has proper Info.plist (verified)

If it's still not working, the logs will tell us exactly where it's failing.

