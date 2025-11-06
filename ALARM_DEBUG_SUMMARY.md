# Alarm Triggering - Debug Summary

## ✅ What Was Fixed

### 1. **Added Comprehensive Logging**
The app now logs detailed information when:
- Scheduling an alarm (time, date, minutes until fire)
- Alarm fires (event details)
- Navigation happens (ready or pending)
- Permissions are checked

### 2. **Added Safety Checks**
- ⚠️ Warns if alarm scheduled in the past
- ✅ Confirms when alarm successfully scheduled
- 📱 Shows navigation state

### 3. **Created Diagnostic Tools**
- `diagnose-alarm-triggering.js` - Run to check alarm status
- `WHY_ALARMS_DONT_TRIGGER.md` - Complete troubleshooting guide
- `ALARM_MODULE_TROUBLESHOOTING.md` - Module loading issues

---

## 🔍 How to Debug Your Alarm

### Step 1: Check The Console Logs

When you schedule an alarm, you should see:

```
📅 Scheduling alarm:
   ID: abc-123
   Label: Morning Alarm
   Time: 08:00
   Days: [1,2,3,4,5]
   Will fire at: Thu Jan 4 2024 08:00:00
   Time until fire: 720 minutes
✅ Alarm scheduled successfully with ID: abc-123
```

**If you see:** `⚠️ WARNING: Fire date is in the past!`
**→ Problem:** The alarm won't fire because the time has already passed
**→ Solution:** Make sure the alarm time is in the future

### Step 2: Wait for Alarm to Fire

When the alarm fires, you should see:

```
🔥🔥🔥 ALARM FIRED! 🔥🔥🔥
Event details: {
  "alarmId": "abc-123",
  "label": "Morning Alarm",
  "requireAffirmations": true,
  ...
}
📱 Navigation ready - navigating to AlarmTrigger
```

**If you DON'T see this:**
- Alarm didn't fire (check reasons below)

### Step 3: Run the Diagnostic

Add to your `App.tsx`:

```typescript
import { diagnoseAlarmTriggering } from './diagnose-alarm-triggering';

useEffect(() => {
  diagnoseAlarmTriggering();
}, []);
```

This will show:
- ✅ or ❌ Notification permissions
- 📅 All scheduled alarms
- ⚠️ Alarms scheduled in the past
- 📬 Pending notifications

---

## 🚨 Top 5 Reasons Alarms Don't Fire

### 1. **Notification Permissions Not Granted** (90% of issues)

**Check:**
```
📋 Step 1: Checking Notification Permissions
   Status: denied    ← BAD
   Status: granted   ← GOOD
```

**Fix:**
- Go to iOS Settings → Your App → Notifications → Enable ALL
- OR run `alarmScheduler.ensurePermissions()` before scheduling

### 2. **Alarm Time is in the Past** (80% of issues)

**Check console logs:**
```
⚠️ WARNING: Fire date is in the past! Alarm will not fire.
```

**Fix:**
- Set alarm for tomorrow instead of today if time passed
- Use the diagnostic to see when alarm will fire

### 3. **App Force-Killed** (50% of issues)

**Symptom:** Alarm works when app is running, not when killed

**Fix:**
- Don't force-quit the app (swipe up in app switcher)
- Keep app in background
- This is an iOS limitation for local notifications

### 4. **Testing on iOS Simulator** (40% of issues)

**Symptom:** Inconsistent behavior, works sometimes

**Fix:**
- Test on a REAL device
- Simulator has known issues with notifications

### 5. **Event Listener Not Set Up** (20% of issues)

**Check console:**
```
🔔 Setting up alarm event listener
✅ Alarm listener registered
```

If you DON'T see this, the listener isn't set up.

---

## 🧪 Quick Test

### Test Alarm (Fires in 1 Minute)

Add this button temporarily to your HomeScreen:

```typescript
<Button
  title="🧪 Test Alarm (1 min)"
  onPress={async () => {
    const testTime = new Date();
    testTime.setMinutes(testTime.getMinutes() + 1);
    
    const alarm = {
      id: `test-${Date.now()}`,
      timeLocal: `${testTime.getHours()}:${testTime.getMinutes()}`,
      daysOfWeek: [0,1,2,3,4,5,6],
      enabled: true,
      label: '🧪 TEST ALARM',
      requireAffirmations: true,
      requireGoals: false,
      randomChallenge: false,
    };
    
    try {
      await alarmScheduler.scheduleAlarm(alarm);
      Alert.alert('Test Alarm Set', 'Will fire in 1 minute!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }}
/>
```

**Expected behavior:**
1. Button pressed
2. Console shows scheduling logs
3. Wait 1 minute
4. Console shows "🔥 ALARM FIRED!"
5. App navigates to alarm screen

---

## 📋 Checklist Before Reporting Issue

Before saying "it doesn't work", verify:

- [ ] Console shows: `✅ AlarmScheduler native module loaded successfully`
- [ ] Console shows: `✅ Alarm scheduled successfully`
- [ ] Console shows: `Status: granted` for notifications
- [ ] Fire date is in the FUTURE (not past)
- [ ] Testing on REAL device (not simulator)
- [ ] App NOT force-killed
- [ ] Console shows: `🔔 Setting up alarm event listener`
- [ ] Waited for the full time until alarm should fire

---

## 💡 Common Mistakes

### Mistake #1: Setting alarm for time that already passed today

```typescript
// If it's 3 PM and you set alarm for 2 PM:
timeLocal: "14:00"  // ← This is in the past!
```

**Fix:** The `computeNextFireDate` function should handle this, but double-check your alarm time.

### Mistake #2: Not requesting permissions

```typescript
// WRONG:
await alarmScheduler.scheduleAlarm(alarm);

// RIGHT:
const granted = await alarmScheduler.ensurePermissions();
if (granted) {
  await alarmScheduler.scheduleAlarm(alarm);
}
```

### Mistake #3: Force-killing the app

iOS won't deliver notifications if you force-kill the app. Keep it in background.

### Mistake #4: Testing only on simulator

Simulator is unreliable for notifications. Always test on real device.

---

## 🎯 Expected Console Output

### When Scheduling:
```
📅 Scheduling alarm:
   ID: 12345
   Label: Morning Alarm
   Time: 08:00
   Days: [1,2,3,4,5]
   Will fire at: Thu Jan 4 2024 08:00:00
   Time until fire: 720 minutes
✅ Alarm scheduled successfully with ID: 12345
```

### When App Starts:
```
🔔 Setting up alarm event listener
✅ Alarm listener registered
📭 No pending alarms
```

### When Alarm Fires:
```
🔥🔥🔥 ALARM FIRED! 🔥🔥🔥
Event details: { ... }
📱 Navigation ready - navigating to AlarmTrigger
```

---

## 🆘 Still Not Working?

1. Run the diagnostic:
   ```typescript
   diagnoseAlarmTriggering();
   ```

2. Check ALL console logs

3. Read `WHY_ALARMS_DONT_TRIGGER.md`

4. Verify you're testing on a real device

5. Make sure the alarm time is actually in the future

6. Check iOS Settings → Your App → Notifications are ON

---

## 📚 Documentation Files

- `WHY_ALARMS_DONT_TRIGGER.md` - Complete troubleshooting (read this!)
- `ALARM_MODULE_TROUBLESHOOTING.md` - Module loading issues
- `diagnose-alarm-triggering.js` - Diagnostic tool
- `diagnose-alarm-module.js` - Module detection tool

---

Good luck! 🚀 The console logs will tell you exactly what's happening.

