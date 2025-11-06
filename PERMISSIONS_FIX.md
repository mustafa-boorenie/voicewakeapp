# Permission Request Fix

## The Problem

You noticed that permissions were being **checked** but never actually **requested**. The logs showed:
```
LOG  🔑 Checking permissions before creating alarm...
LOG  🔑 Checking permissions before creating alarm...
```

But the iOS permission dialog never appeared.

## Why This Was Happening

The iOS permission system works in three states:

1. **`notDetermined`** - User has never been asked for permissions
   - ✅ App CAN show the permission dialog
   - This happens on first launch

2. **`denied`** - User previously denied permissions
   - ❌ App CANNOT show the dialog again
   - User MUST go to Settings to enable

3. **`authorized`** - User has granted permissions
   - ✅ Permissions already granted
   - No dialog needed

The native code WAS requesting permissions correctly, but only when the status was `notDetermined`. If you had previously denied permissions (or were testing repeatedly), the status would be `denied` and iOS wouldn't allow the app to show the dialog again.

## What I Fixed

### 1. Enhanced Native Module (`AlarmSchedulerModule.swift`)

Added detailed logging to show exactly what's happening:

```swift
// Now logs the current permission status
print("📋 Current notification authorization status: \(settings.authorizationStatus.rawValue)")

// Different messages for each state
case .notDetermined:
  print("🔔 Requesting notification permissions (first time)...")
  // Shows iOS permission dialog here

case .denied:
  print("❌ Notification permissions previously denied - user must enable in Settings")
  // Cannot show dialog - user must go to Settings

case .authorized:
  print("✅ Notification permissions already granted")
  // No dialog needed
```

### 2. Added Permission Status Method

New method to check current permission status before attempting to request:

```swift
@objc(getNotificationPermissionStatus:rejecter:)
func getNotificationPermissionStatus() -> Promise<String>
```

Returns: `"notDetermined"`, `"denied"`, `"authorized"`, `"provisional"`, `"ephemeral"`, or `"unknown"`

### 3. Improved JavaScript Logging

Updated `AlarmScheduler.ts` to check and log the permission status:

```typescript
const status = await native.getNotificationPermissionStatus();
console.log(`📋 Current notification permission status: ${status}`);

if (status === 'notDetermined') {
  console.log('🔔 First time requesting permissions - iOS dialog will appear');
} else if (status === 'denied') {
  console.log('❌ Permissions were previously denied - user must enable in Settings');
}
```

## What You'll See Now

### Scenario 1: First Time (notDetermined)
```
🔑 Checking permissions before creating alarm...
📋 Current notification permission status: notDetermined
🔔 First time requesting permissions - iOS dialog will appear
[iOS Permission Dialog Appears]
✅ User granted notification permissions
✅ All alarm permissions granted
```

### Scenario 2: Previously Denied
```
🔑 Checking permissions before creating alarm...
📋 Current notification permission status: denied
❌ Permissions were previously denied - user must enable in Settings
❌ Notification permissions not granted
[Alert shown: "Permissions Required" with "Open Settings" button]
```

### Scenario 3: Already Granted
```
🔑 Checking permissions before creating alarm...
📋 Current notification permission status: authorized
✅ Permissions already granted
✅ All alarm permissions granted
```

## Testing the Fix

### Test 1: Clean Install (First Time User)
1. Delete the app completely from your device
2. Rebuild and install: `npx expo run:ios --device`
3. Open the app
4. Try to create an alarm
5. **Expected**: iOS permission dialog appears asking "Allow notifications?"
6. Tap "Allow"
7. **Expected**: Alarm saves and schedules successfully

### Test 2: Denied Permissions (Repeat Testing)
If you've been testing and denied permissions:

1. Check current status:
   - Go to iOS Settings → VoiceWake
   - Check if "Notifications" are OFF

2. Try to create an alarm in the app
3. **Expected logs**:
   ```
   📋 Current notification permission status: denied
   ❌ Permissions were previously denied - user must enable in Settings
   ```

4. **Expected UI**: Alert with "Open Settings" button

5. Tap "Open Settings"
6. Enable "Allow Notifications"
7. Return to app
8. Try creating alarm again
9. **Expected**: Now works successfully

### Test 3: Reset Permissions (For Testing)
To reset to `notDetermined` state:

1. Delete the app
2. Restart your device (important!)
3. Reinstall the app
4. Now it's truly first-time state

## Key Differences

### Before:
- Silent permission checks
- No indication whether dialog would appear
- Confusing when repeatedly testing

### After:
- Explicit logging of permission state
- Clear indication of what will happen
- Native iOS logs show permission request attempts
- Better user feedback in UI

## iOS Permission Behavior (Important!)

**You cannot request permissions multiple times!**

Once a user denies permissions:
- iOS will NOT show the dialog again
- The app must direct users to Settings
- This is an iOS security/privacy feature

This is why the "Open Settings" button is so important - it's the ONLY way for users to grant permissions after denying them.

## What Happens on First Alarm Creation

The complete flow:

1. User fills out alarm form
2. Taps "Create Alarm"
3. App checks permission status
4. If `notDetermined`:
   - iOS permission dialog appears: "VoiceWake Would Like to Send You Notifications"
   - User taps "Allow" or "Don't Allow"
5. If allowed:
   - Alarm saves to database
   - Alarm schedules with native module
   - Success message shown
6. If denied:
   - Alert shown: "Permissions Required"
   - User can tap "Open Settings"
   - Settings app opens
   - User enables notifications
   - Returns to app and tries again

## Debugging Permission Issues

### Check Console Logs

Look for these key log lines:

```
📋 Current notification permission status: [status]
```

This tells you the current state.

```
🔔 Requesting notification permissions (first time)...
```

This means the iOS dialog WILL appear.

```
❌ Permissions were previously denied - user must enable in Settings
```

This means you need to go to Settings.

### Check iOS Settings

Settings → VoiceWake → Notifications

Make sure:
- ✅ Allow Notifications is ON
- ✅ Banner Style is set (Temporary or Persistent)
- ✅ Sounds is ON (optional)

### Native iOS Logs

In Xcode, check the device logs for these print statements:
- `⚠️ AlarmKit authorization denied or unavailable`
- `✅ AlarmKit authorization granted`
- `📋 Current notification authorization status:`
- `🔔 Requesting notification permissions (first time)...`
- `✅ User granted notification permissions`
- `❌ User denied notification permissions`

## Summary

The permission system now:
1. ✅ **Checks** current status
2. ✅ **Requests** permissions on first launch (shows iOS dialog)
3. ✅ **Logs** detailed status for debugging
4. ✅ **Guides** users to Settings when needed
5. ✅ **Explains** what's happening at each step

The dialog WILL appear when status is `notDetermined`. If you're not seeing it, check the logs to see what status you're in!

