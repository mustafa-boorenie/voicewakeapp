# Why Alarms Don't Trigger - Complete Troubleshooting Guide

## 🔍 Quick Diagnostic

Add this to your `App.tsx` (after imports):

```typescript
import { diagnoseAlarmTriggering, addTestAlarmListener } from './diagnose-alarm-triggering';

// In your App component:
useEffect(() => {
  diagnoseAlarmTriggering();
  const testListener = addTestAlarmListener();
  return () => testListener.remove();
}, []);
```

Then check the console output!

---

## 🚨 TOP 7 Reasons Alarms Don't Fire (iOS)

### **1. Notification Permissions Not Granted** ⭐⭐⭐⭐⭐ MOST COMMON

**Symptoms:**
- Alarm scheduled successfully
- No notification appears at alarm time
- Console shows no errors

**Check:**
```javascript
const { alarmScheduler } = require('./src/modules/alarm/AlarmScheduler');
const granted = await alarmScheduler.ensurePermissions();
console.log('Permissions granted:', granted);
```

**Solution:**
1. **Request permissions BEFORE scheduling:**
   ```typescript
   const granted = await alarmScheduler.ensurePermissions();
   if (!granted) {
     Alert.alert('Permissions Required', 'Please enable notifications');
     return;
   }
   // Now schedule the alarm
   ```

2. **Check iOS Settings:**
   - Open iOS Settings
   - Go to your app
   - Ensure Notifications are ON
   - Ensure Alerts and Sounds are enabled

3. **If permissions denied:**
   ```typescript
   await alarmScheduler.openAlarmSettings(); // Opens Settings
   ```

---

### **2. Alarm Time is in the Past** ⭐⭐⭐⭐⭐ VERY COMMON

**Symptoms:**
- Alarm shows in scheduled list
- Never fires
- No error messages

**Check:**
Run the diagnostic script - it will show if fire date is in the past.

**Solution:**

The issue is in `computeNextFireDate` - if the time has already passed today, it schedules for TODAY (past), not tomorrow!

**Fix in `src/modules/alarm/AlarmScheduler.ts`:**

```typescript
private computeNextFireDate(alarm: Alarm): Date {
  const now = new Date();
  const [hour, minute] = alarm.timeLocal.split(':').map(Number);
  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);

  // If the time has passed today, schedule for next occurrence
  if (candidate <= now) {
    // Find next enabled day
    const daysToCheck = 7;
    for (let i = 1; i <= daysToCheck; i++) {
      const nextDay = new Date(candidate);
      nextDay.setDate(candidate.getDate() + i);
      const dayOfWeek = nextDay.getDay();
      
      if (alarm.days[dayOfWeek]) {
        return nextDay;
      }
    }
    
    // Fallback: tomorrow at the specified time
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}
```

---

### **3. App Force-Killed** ⭐⭐⭐⭐ VERY COMMON

**Symptoms:**
- Alarm doesn't fire
- Works when app is running

**Explanation:**
iOS has limitations: If user force-kills the app (swipe up in app switcher), notifications may not fire reliably.

**Solution:**
- **For Development:** Keep app running in background (don't force-kill)
- **For Production:** Tell users not to force-kill the app
- **Alternative:** Use AlarmKit (iOS 17+) which works even when app is killed

**Add to your app's onboarding:**
```
"For alarms to work reliably:
1. Keep the app running (it can be in background)
2. Don't force-quit the app
3. Enable notifications"
```

---

### **4. iOS Simulator Limitations** ⭐⭐⭐⭐

**Symptoms:**
- Works inconsistently on simulator
- Sometimes fires, sometimes doesn't

**Explanation:**
iOS Simulator has known issues with:
- Local notifications
- Background execution
- Timer precision

**Solution:**
**Test on a real device!**

```bash
# Connect your iPhone via cable
npx expo run:ios --device
```

Notifications work MUCH more reliably on real devices.

---

### **5. Notification Delegate Not Configured** ⭐⭐⭐

**Symptoms:**
- Notification appears
- App doesn't navigate to alarm screen
- Event listener not called

**Check:**
Verify `AppDelegate.swift` has:

```swift
public override func application(
  _ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
  // ... other code ...
  
  AlarmNotificationDelegate.shared.configure()  // ← THIS LINE IS CRITICAL
  
  return super.application(application, didFinishLaunchingWithOptions: launchOptions)
}
```

**Solution:**
If missing, add the line above. This tells iOS to use our custom handler.

---

### **6. Event Listener Not Set Up** ⭐⭐⭐

**Symptoms:**
- Notification shows
- App doesn't open alarm screen
- No console log when alarm fires

**Check `App.tsx`:**

```typescript
useEffect(() => {
  // THIS MUST BE PRESENT
  const subscription = alarmScheduler.addAlarmFiredListener(handleAlarmEvent);
  
  // Check for pending alarms
  alarmScheduler.consumePendingAlarm().then((event) => {
    if (event) {
      handleAlarmEvent(event);
    }
  });
  
  return () => {
    subscription.remove();
  };
}, [handleAlarmEvent]);
```

**Solution:**
Ensure the listener is set up in `App.tsx` as shown above.

---

### **7. iOS Background App Refresh Disabled** ⭐⭐

**Symptoms:**
- App doesn't wake up for notification
- Notification shows but app doesn't open

**Check:**
iOS Settings → General → Background App Refresh → Your App (should be ON)

**Solution:**
Enable Background App Refresh for your app.

---

## 🐛 Debugging Steps

### Step 1: Add Extensive Logging

**In `App.tsx`:**
```typescript
useEffect(() => {
  console.log('🔔 Setting up alarm listener');
  
  const subscription = alarmScheduler.addAlarmFiredListener((event) => {
    console.log('🔥 ALARM FIRED:', event);
    // ... rest of handler
  });
  
  console.log('✅ Alarm listener set up successfully');
  
  return () => {
    console.log('🔕 Removing alarm listener');
    subscription.remove();
  };
}, [handleAlarmEvent]);
```

**In `AlarmSchedulerModule.swift`:**
Add to the `handleAlarmFired` method:
```swift
@objc private func handleAlarmFired(_ notification: Notification) {
  print("📢 Swift: Alarm notification received")
  guard hasListeners else { 
    print("⚠️ Swift: No JS listeners attached!")
    return 
  }
  // ... rest of method
}
```

### Step 2: Test Notification Immediately

Schedule a test alarm for 1 minute from now:

```typescript
// Test alarm that fires in 1 minute
const testDate = new Date();
testDate.setMinutes(testDate.getMinutes() + 1);

await alarmScheduler.scheduleAlarm({
  id: 'test-alarm',
  timeLocal: `${testDate.getHours()}:${testDate.getMinutes()}`,
  days: [0,1,2,3,4,5,6], // every day
  enabled: true,
  label: 'TEST ALARM',
  requireAffirmations: true,
  requireGoals: false,
  randomChallenge: false,
});

console.log('Test alarm scheduled for:', testDate.toLocaleTimeString());
```

### Step 3: Check iOS Notification Center

After scheduling:
```bash
# While app is running, schedule an alarm
# Then check if it appears in iOS notification center:
# Settings → Notifications → Your App → "Scheduled Summary" should show it
```

### Step 4: Monitor Native Logs

In Xcode (⌘⇧C for Console):
- Look for "Alarm notification received"  
- Look for "alarmFired" events
- Look for any Swift errors

---

## 🛠️ Complete Fix Checklist

### Before You Schedule an Alarm:

- [ ] **Request permissions**
  ```typescript
  const granted = await alarmScheduler.ensurePermissions();
  if (!granted) {
    // Handle denial
    return;
  }
  ```

- [ ] **Verify alarm time is in future**
  ```typescript
  const fireDate = computeNextFireDate(alarm);
  console.log('Will fire at:', fireDate.toLocaleString());
  ```

- [ ] **Test on real device** (not just simulator)

### In Your Code:

- [ ] **App.tsx has alarm listener**
- [ ] **AppDelegate configures delegate**
  ```swift
  AlarmNotificationDelegate.shared.configure()
  ```
- [ ] **Notification permissions granted in iOS Settings**
- [ ] **Background App Refresh enabled**

### Testing:

- [ ] Schedule alarm for 1-2 minutes in future
- [ ] Keep app in foreground
- [ ] Check console for "🔥 ALARM FIRED"
- [ ] Verify navigation to AlarmTrigger screen

If it works in foreground:

- [ ] Put app in background (home button)
- [ ] Wait for alarm
- [ ] Tap notification
- [ ] Should open app to alarm screen

---

## 📱 Platform-Specific Issues

### iOS Simulator Issues:
- Notifications unreliable
- Background execution limited
- **→ Use real device for testing**

### iOS Real Device:
- Must have valid provisioning profile
- Must enable push notifications capability
- May need Background Modes capability

### If Using AlarmKit (iOS 17+):
The app uses AlarmKit as fallback for iOS 17+, but it:
- Requires additional permissions
- Only works on iOS 17+
- May not be fully implemented

---

## 🎯 Quick Fixes

### Fix #1: Ensure Permissions Every Time
```typescript
async function scheduleNewAlarm(alarm: Alarm) {
  // ALWAYS check permissions first
  const granted = await alarmScheduler.ensurePermissions();
  if (!granted) {
    Alert.alert('Cannot schedule alarm', 'Notifications are required');
    return;
  }
  
  const alarmId = await alarmScheduler.scheduleAlarm(alarm);
  console.log('Alarm scheduled:', alarmId);
}
```

### Fix #2: Add Debug Alarm Button
```typescript
<Button 
  title="Test Alarm (1 min)" 
  onPress={async () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    
    await alarmScheduler.scheduleAlarm({
      id: `test-${Date.now()}`,
      timeLocal: `${now.getHours()}:${now.getMinutes()}`,
      days: [0,1,2,3,4,5,6],
      enabled: true,
      label: 'Test',
      requireAffirmations: true,
      requireGoals: false,
      randomChallenge: false,
    });
    
    Alert.alert('Test alarm set for 1 minute from now');
  }}
/>
```

### Fix #3: Better Error Handling
```typescript
try {
  const alarmId = await alarmScheduler.scheduleAlarm(alarm);
  console.log('✅ Alarm scheduled:', alarmId);
  
  // Verify it was actually scheduled
  const scheduled = await alarmScheduler.getScheduledAlarms();
  console.log('Total scheduled alarms:', scheduled.length);
  
} catch (error) {
  console.error('❌ Failed to schedule alarm:', error);
  Alert.alert('Error', error.message);
}
```

---

## ✅ Success Indicators

You'll know alarms are working when:

1. **Permissions granted:**
   ```
   ✅ Notification permissions: granted
   ```

2. **Alarm scheduled:**
   ```
   ✅ Alarm scheduled: abc-123
   📅 Scheduled alarms: 1
   ```

3. **Alarm fires:**
   ```
   🔥 ALARM FIRED: { alarmId: 'abc-123', ... }
   ```

4. **Navigation works:**
   ```
   📱 Navigating to AlarmTrigger screen
   ```

---

## 🆘 Still Not Working?

1. **Run the diagnostic:**
   ```typescript
   import { diagnoseAlarmTriggering } from './diagnose-alarm-triggering';
   diagnoseAlarmTriggering();
   ```

2. **Check all console logs** for errors

3. **Try on a real device** (simulator is unreliable)

4. **Verify ALL of these:**
   - ✅ Permissions granted
   - ✅ Fire date in future  
   - ✅ App not force-killed
   - ✅ Testing on real device
   - ✅ Listener set up in App.tsx
   - ✅ Delegate configured in AppDelegate

5. **Test with 1-minute alarm** to verify basic functionality

---

Good luck! 🚀 The most common issue is **permissions** or **time in the past**.

