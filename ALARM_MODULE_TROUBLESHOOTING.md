# AlarmScheduler Module Troubleshooting Guide

## 🔍 Quick Diagnostic

### Step 1: Run the Diagnostic Script
Add this to your `App.tsx` temporarily:

```typescript
import { diagnoseAlarmModule } from './diagnose-alarm-module';

// In your App component, add:
useEffect(() => {
  diagnoseAlarmModule();
}, []);
```

Then check the console output to see if the module is detected.

---

## 🛠️ Solutions (Ordered by Likelihood)

### **Solution 1: Verify Build Configuration in Xcode** ⭐ MOST LIKELY
The module files may not be properly included in the build.

**Steps:**
1. Open the workspace:
   ```bash
   open ios/AffirmationAlarm.xcworkspace
   ```

2. Select **AffirmationAlarm** project → **AffirmationAlarm** target

3. Go to **Build Phases** → **Compile Sources**

4. Verify these Swift files are listed:
   - ✅ `AlarmSchedulerModule.swift`
   - ✅ `AlarmSchedulerStore.swift`
   - ✅ `AlarmNotificationDelegate.swift`
   - ✅ `LocalNotificationScheduler.swift`
   - ✅ `AlarmSchedulerNotifications.swift`
   - ✅ `AlarmKitBridge.swift`

5. Verify this Objective-C file is listed:
   - ✅ `AlarmSchedulerBridge.m`

6. **If any are missing:**
   - Right-click on **Compile Sources**
   - Click **Add Files...**
   - Select the missing file(s)
   - Click **Add**

7. Clean and rebuild:
   - Product → Clean Build Folder (⇧⌘K)
   - Product → Build (⌘B)

---

### **Solution 2: Check Bridging Header Configuration** ⭐ VERY COMMON
The Swift-to-Objective-C bridge may not be configured.

**Steps:**
1. In Xcode, select **AffirmationAlarm** target

2. Go to **Build Settings**

3. Search for "bridging"

4. Find **Objective-C Bridging Header**

5. Verify it's set to:
   ```
   AffirmationAlarm/AffirmationAlarm-Bridging-Header.h
   ```

6. If it's not set or wrong:
   - Click on the field
   - Type the path above
   - Press Enter

7. **Verify the bridging header file exists:**
   ```bash
   ls -la ios/AffirmationAlarm/AffirmationAlarm-Bridging-Header.h
   ```

8. **Content should include:**
   ```objc
   #import <React/RCTBridgeModule.h>
   #import <React/RCTEventEmitter.h>
   ```

---

### **Solution 3: Fix Swift Language Version**
Incompatible Swift version can cause module loading issues.

**Steps:**
1. In Xcode Build Settings, search for "Swift Language Version"

2. Verify it's set to **Swift 5** or later

3. If not, change it to **Swift 5**

4. Clean and rebuild

---

### **Solution 4: Rebuild CocoaPods**
Sometimes the Pods integration gets corrupted.

**Steps:**
```bash
cd ios
rm -rf Pods
rm Podfile.lock
pod install
cd ..
```

Then rebuild:
```bash
npx expo run:ios
```

---

### **Solution 5: Clear Derived Data**
Xcode's build cache can cause issues.

**Steps:**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/AffirmationAlarm-*
```

Then rebuild:
```bash
npx expo run:ios
```

---

### **Solution 6: Check for Swift Compilation Errors**
The module might not be compiling.

**Steps:**
1. Open Xcode workspace:
   ```bash
   open ios/AffirmationAlarm.xcworkspace
   ```

2. Press ⌘B to build

3. Check the **Issue Navigator** (⌘5) for any Swift errors

4. Fix any compilation errors you see

5. Common issues:
   - Missing imports
   - Type mismatches
   - Missing dependencies

---

### **Solution 7: Verify Module Export** 
The module may not be properly exported to React Native.

**Verify `AlarmSchedulerModule.swift` has:**
```swift
@objc(AlarmScheduler)
class AlarmSchedulerModule: RCTEventEmitter {
  // ... rest of the code
}
```

**Verify `AlarmSchedulerBridge.m` has:**
```objc
@interface RCT_EXTERN_MODULE(AlarmScheduler, RCTEventEmitter)
// ... method declarations
@end
```

---

### **Solution 8: Module Registration Order**
Sometimes modules need to be initialized in a specific order.

**Add to `AppDelegate.swift`:**
```swift
public override func application(
  _ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
  // ... existing code ...
  
  // Force module initialization
  _ = AlarmSchedulerModule()
  
  return super.application(application, didFinishLaunchingWithOptions: launchOptions)
}
```

⚠️ **Note:** This is a workaround and shouldn't normally be necessary.

---

## 🐛 Debugging Steps

### Check React Native Bridge
Add this to your JavaScript code:

```javascript
import { NativeModules } from 'react-native';

console.log('All modules:', Object.keys(NativeModules));
console.log('AlarmScheduler?:', NativeModules.AlarmScheduler);
```

### Check Native Logs
In Xcode, open the Debug Console (⌘⇧C) and look for:
- ✅ Success: "✅ AlarmScheduler native module loaded successfully"
- ❌ Error: "❌ Failed to load AlarmScheduler native module"

### Metro Bundler Logs
Check your Metro bundler terminal for:
- Module loading errors
- Native module warnings
- Bridge initialization errors

---

## 🎯 What We Fixed

1. ✅ **Added safe initialization** - Module now handles loading errors gracefully
2. ✅ **Added error logging** - You'll see clear error messages if module fails to load
3. ✅ **Added null checks** - App won't crash if module isn't available
4. ✅ **Created diagnostic script** - Easy way to check module status

---

## 📝 Next Steps

1. **Run the diagnostic** to see if module is detected
2. **Check Xcode Build Phases** (Solution 1)
3. **Verify Bridging Header** (Solution 2)
4. **Look at console logs** for specific errors
5. **Try solutions in order** until it works

---

## 🆘 Still Not Working?

If none of these work, check for:

1. **iOS Simulator version compatibility**
   - Requires iOS 13.0+
   - AlarmKit features require iOS 17.0+

2. **React Native version compatibility**
   - Check `package.json` for React Native version
   - Module expects RN 0.70+

3. **Clean restart everything:**
   ```bash
   # Clean iOS
   cd ios
   rm -rf Pods Podfile.lock
   rm -rf ~/Library/Developer/Xcode/DerivedData/AffirmationAlarm-*
   pod install
   cd ..
   
   # Clean Metro
   rm -rf node_modules/.cache
   
   # Rebuild
   npx expo run:ios
   ```

---

## ✅ Success Indicators

You'll know it's working when you see:
- ✅ Console log: "✅ AlarmScheduler native module loaded successfully"
- ✅ No errors when trying to schedule an alarm
- ✅ Diagnostic script shows AlarmScheduler in the module list

Good luck! 🚀

