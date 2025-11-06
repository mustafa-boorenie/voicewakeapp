# Permission Check Hanging - Debug Guide

## Current Issue

The permission check starts but then hangs:
```
LOG  🔑 Checking permissions before creating alarm...
[Nothing after this]
```

This means the JavaScript code is calling the native method, but:
1. The native method isn't responding
2. The Promise isn't resolving
3. Or there's an error being swallowed

## What I've Added

### 1. Enhanced Logging in AlarmScheduler.ts

Now includes detailed step-by-step logs:
```
📍 ensurePermissions() called
📍 Native module retrieved
📍 About to call getNotificationPermissionStatus()...
📋 Current notification permission status: [status]
📍 About to call ensureNotificationPermission()...
📍 ensureNotificationPermission() returned: [result]
```

### 2. Simple Test Script

Created `test-permissions-simple.js` that:
- Tests each method with timeout
- Shows exactly where it hangs
- Provides actionable error messages

## How to Debug

### Step 1: Reload the App

The new logging code needs to be loaded:
```bash
# In Metro bundler, press 'r' to reload
# Or shake device and tap "Reload"
```

### Step 2: Try Creating an Alarm Again

Watch the console carefully. You should now see:
```
🔑 Checking permissions before creating alarm...
📍 ensurePermissions() called
📍 Native module retrieved
📍 About to call getNotificationPermissionStatus()...
```

**Where does it stop?**

#### Scenario A: Stops at "About to call getNotificationPermissionStatus()..."
**Problem:** `getNotificationPermissionStatus()` is hanging

**Solution:**
1. Check Xcode device logs for native errors
2. The Swift method might be stuck
3. Callback might not be called

#### Scenario B: Gets status but stops at "About to call ensureNotificationPermission()..."
**Problem:** `ensureNotificationPermission()` is hanging

**Solution:**
1. iOS permission dialog might not be appearing
2. Check device restrictions (Screen Time)
3. Check Xcode logs for errors

#### Scenario C: Shows error message
**Problem:** Exception is being thrown

**Solution:**
- Read the error message carefully
- It will show exactly what failed
- Error details will be logged

### Step 3: Run the Simple Test

In the app console or Dev Menu:
```javascript
// Load the test
require('./test-permissions-simple.js');

// Or if it auto-runs, just watch the output
```

This test includes **timeouts** so it won't hang forever. It will show:
```
❌ ERROR: TIMEOUT after 5 seconds
The native method is not responding.
```

### Step 4: Check Xcode Logs

1. Open Xcode
2. Window → Devices and Simulators
3. Select your device
4. View Device Logs
5. Filter for "AffirmationAlarm" or "AlarmScheduler"
6. Look for errors or Swift print statements

Look for these native logs:
```
🔔 Checking notification permission status...
📋 Current notification authorization status: 0
🔔 Requesting notification permissions (first time)...
⚠️ iOS system dialog should appear now...
```

If you DON'T see these, the native method isn't even being called.

## Common Causes & Solutions

### Cause 1: Native Method Not Implemented

**Symptoms:**
- Hangs at "About to call..."
- No Xcode logs appear
- Timeout occurs

**Check:**
```bash
# Verify methods are in bridge file
grep "getNotificationPermissionStatus" ios/AffirmationAlarm/Alarms/AlarmSchedulerBridge.m
grep "ensureNotificationPermission" ios/AffirmationAlarm/Alarms/AlarmSchedulerBridge.m
```

Should show:
```objc
RCT_EXTERN_METHOD(getNotificationPermissionStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
                  
RCT_EXTERN_METHOD(ensureNotificationPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
```

**Fix:** If missing, the bridge file needs to be updated.

### Cause 2: Promise Not Being Resolved

**Symptoms:**
- Xcode logs show method is called
- But callback never returns to JavaScript
- Hangs forever

**Check Swift method:**
```swift
// Look for this in AlarmSchedulerModule.swift
@objc(getNotificationPermissionStatus:rejecter:)
func getNotificationPermissionStatus(
  _ resolve: @escaping RCTPromiseResolveBlock,
  rejecter reject: @escaping RCTPromiseRejectBlock
) {
  // MUST call resolve() or reject()
}
```

**Fix:** Ensure `resolve()` is called in ALL code paths.

### Cause 3: Main Thread Issues

**Symptoms:**
- Method hangs on certain code paths
- Works sometimes, fails others
- iOS warns about main thread

**Fix:** Already implemented - all permission requests wrapped in `DispatchQueue.main.async`

### Cause 4: Module Build Issue

**Symptoms:**
- Methods exist in code
- But calling them does nothing
- No logs appear

**Check:**
```javascript
import { NativeModules } from 'react-native';
const methods = Object.keys(NativeModules.AlarmScheduler || {});
console.log('Available methods:', methods);
```

**Fix:** If methods are missing, rebuild:
```bash
cd ios
pod install
cd ..
npx expo run:ios --device
```

## Quick Diagnostic Commands

### Check Module Exists
```javascript
import { NativeModules } from 'react-native';
console.log('AlarmScheduler exists:', !!NativeModules.AlarmScheduler);
```

### Check Methods Exist
```javascript
import { NativeModules } from 'react-native';
const AS = NativeModules.AlarmScheduler;
console.log('Has getStatus:', typeof AS?.getNotificationPermissionStatus);
console.log('Has ensure:', typeof AS?.ensureNotificationPermission);
```

### Try Direct Call with Timeout
```javascript
import { NativeModules } from 'react-native';
const AS = NativeModules.AlarmScheduler;

const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('TIMEOUT')), 5000)
);

Promise.race([
  AS.getNotificationPermissionStatus(),
  timeoutPromise
]).then(
  status => console.log('✅ Status:', status),
  error => console.error('❌ Error:', error.message)
);
```

## What Should Happen (Working Flow)

```
# JavaScript side:
🔑 Checking permissions before creating alarm...
📍 ensurePermissions() called
📍 Native module retrieved
📍 About to call getNotificationPermissionStatus()...
📋 Current notification permission status: notDetermined
🔔 First time requesting permissions - iOS dialog will appear
📍 About to call ensureNotificationPermission()...

# Native side (Xcode logs):
🔔 Checking notification permission status...
📋 Current notification authorization status: 0
🔔 Requesting notification permissions (first time)...
⚠️ iOS system dialog should appear now...

# iOS shows permission dialog
# User taps "Allow"

# Native side:
✅ User GRANTED notification permissions

# JavaScript side:
📍 ensureNotificationPermission() returned: true
✅ All alarm permissions granted
```

## If Still Stuck

1. **Share your logs:**
   - All JavaScript console logs
   - Xcode device logs
   - Where exactly it stops

2. **Run test script:**
   - The timeout will show if it's hanging
   - Error messages are detailed

3. **Check device settings:**
   - Settings → Screen Time → Content & Privacy
   - Make sure app isn't restricted

4. **Try fresh install:**
   ```bash
   # Delete app from device
   # Restart device (clears permission state)
   npx expo run:ios --device
   ```

## Files to Check

1. **`src/modules/alarm/AlarmScheduler.ts`** - Updated with detailed logging
2. **`ios/AffirmationAlarm/Alarms/AlarmSchedulerModule.swift`** - Native implementation
3. **`ios/AffirmationAlarm/Alarms/AlarmSchedulerBridge.m`** - Method bridge
4. **`test-permissions-simple.js`** - Diagnostic script

The enhanced logging will show EXACTLY where it fails now!

