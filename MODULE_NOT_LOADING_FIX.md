# Native Module Not Loading - Critical Issue

## The Real Problem

The error shows:
```
ERROR  ❌ Failed to load AlarmScheduler native module: 
[Error: AlarmScheduler native module is unavailable on this platform]
```

This means `NativeModules.AlarmScheduler` is **undefined**. The native module isn't being compiled or linked properly.

## This Is NOT a Permission Issue

We've been fixing permission request code, but the module isn't even loading. The permissions code never runs because the module doesn't exist.

## What's Wrong

One of these is happening:

1. **Swift files aren't compiling**
   - Build errors were ignored
   - Swift syntax errors
   - Missing dependencies

2. **Bridge files aren't linked**
   - `.m` files not in Xcode project
   - Not in build phases

3. **Module not registered**
   - Bridging header issues
   - `@objc(AlarmScheduler)` not working
   - RCT_EXTERN_MODULE mismatch

4. **Build cache corruption**
   - Old build artifacts
   - Pods not updated
   - DerivedData issues

## Diagnostic Steps

### Step 1: List All Native Modules

Run this in the app:
```javascript
import { NativeModules } from 'react-native';
console.log('Available modules:', Object.keys(NativeModules).sort());
```

**Expected:** Should see `AlarmScheduler` in the list  
**If not:** Module isn't being registered

### Step 2: Check Xcode Build Logs

1. Open Xcode
2. Build the project (⌘B)
3. Check for:
   - Swift compilation errors
   - Bridging header errors
   - Linker errors

### Step 3: Verify Files in Project

Check `project.pbxproj` includes:
- `AlarmSchedulerModule.swift`
- `AlarmSchedulerBridge.m`
- `AlarmNotificationDelegate.swift`
- `LocalNotificationScheduler.swift`
- `AlarmSchedulerStore.swift`
- `AlarmKitBridge.swift`

### Step 4: Check Build Phases

In Xcode → Target → Build Phases:
- **Compile Sources** should include all `.swift` and `.m` files
- **Copy Bundle Resources** - check if needed
- **Link Binary With Libraries** - check UserNotifications.framework

## Quick Fixes to Try

### Fix 1: Clean Everything
```bash
cd /Users/mustafaboorenie/voicewakeapp

# Clean iOS
rm -rf ios/build
rm -rf ios/Pods
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reinstall pods
cd ios
pod deintegrate
pod install
cd ..

# Clean Metro
rm -rf node_modules/.cache
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

# Rebuild
npx expo run:ios --device
```

### Fix 2: Verify Bridging Header

Check `AffirmationAlarm-Bridging-Header.h` contains:
```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
```

### Fix 3: Verify Build Settings

In Xcode → Target → Build Settings:
- **Objective-C Bridging Header**: `AffirmationAlarm/AffirmationAlarm-Bridging-Header.h`
- **Swift Language Version**: 5.0
- **Defines Module**: YES

### Fix 4: Check for Duplicate Files

```bash
cd /Users/mustafaboorenie/voicewakeapp
find ios -name "AlarmSchedulerBridge.m" -type f
find ios -name "AlarmSchedulerModule.swift" -type f
```

Should only find ONE of each. If multiples exist, that's the problem.

### Fix 5: Manual Xcode Build

1. Open `ios/AffirmationAlarm.xcodeproj` in Xcode
2. Select your device as target
3. Product → Clean Build Folder (⌘⇧K)
4. Product → Build (⌘B)
5. Watch for errors in the build log
6. Fix any errors
7. Try again

## What the Error Means

```javascript
// In AlarmScheduler.ts constructor:
this.native = getNativeAlarmModule();
```

This calls:
```javascript
// In src/native/alarm/index.ts:
export function getNativeAlarmModule() {
  if (!nativeModule) {
    throw new Error('AlarmScheduler native module is unavailable on this platform');
  }
  return nativeModule;
}

// Where nativeModule is:
const nativeModule = NativeModules.AlarmScheduler;
```

If `NativeModules.AlarmScheduler` is undefined, it throws that error.

## Why This Happens

### Scenario A: Build Failed Silently
- Swift files have errors
- Build continued anyway
- Module not included in binary

**Check:** Look for red errors in Xcode

### Scenario B: Files Not Linked
- Files exist on disk
- But not in Xcode project
- Not compiled into binary

**Check:** Open Xcode, look in file navigator

### Scenario C: Registration Failed
- Files compile fine
- But `@objc(AlarmScheduler)` doesn't work
- Module not exposed to React Native

**Check:** Bridging header, module name

### Scenario D: Wrong Platform
- Module only registered for iOS
- Running on Android or web

**Check:** `Platform.OS` should be `'ios'`

## Expected vs Actual

### Expected (Working):
```javascript
import { NativeModules } from 'react-native';
console.log(NativeModules.AlarmScheduler);
// Output: { scheduleAlarm: [Function], cancelAlarm: [Function], ... }
```

### Actual (Broken):
```javascript
import { NativeModules } from 'react-native';
console.log(NativeModules.AlarmScheduler);
// Output: undefined
```

## Next Steps

1. **Run the diagnostic script:**
   ```bash
   # Load list-native-modules.js into the app
   # It will show ALL available modules
   ```

2. **Check if ANY modules are loading:**
   - If NO modules load → React Native bridge is broken
   - If SOME modules load → AlarmScheduler specifically isn't building

3. **Build in Xcode directly:**
   - Open project in Xcode
   - Build and watch for errors
   - Fix compilation errors

4. **Check the .m and .swift files exist:**
   ```bash
   ls -la ios/AffirmationAlarm/Alarms/
   ```

5. **Verify they're in the Xcode project:**
   - Open Xcode
   - Look in Project Navigator
   - Check Build Phases → Compile Sources

## This Must Be Fixed FIRST

Until the native module loads, NOTHING else will work:
- ❌ Permission requests
- ❌ Alarm scheduling
- ❌ Alarm triggering

The module must be in `NativeModules` before we can call any methods on it.

## How to Confirm It's Fixed

When fixed, you'll see:
```
LOG  ✅ AlarmScheduler native module loaded successfully
```

Instead of:
```
ERROR  ❌ Failed to load AlarmScheduler native module
```

And:
```javascript
console.log(NativeModules.AlarmScheduler);
// Should output an object with methods, not undefined
```

