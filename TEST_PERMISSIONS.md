# Testing Alarm Permissions

## Quick Test Guide

### Test 1: Create Alarm with Permissions
1. Open the app
2. Tap "Create Alarm" or similar button
3. Fill in alarm details
4. Tap "Save" or "Create"
5. **Expected**: You should see a notification permission prompt
6. Tap "Allow"
7. **Expected**: See "Alarm created and scheduled successfully!"
8. Check console logs for: `✅ Alarm scheduled successfully`

### Test 2: Create Alarm without Permissions
1. Go to iOS Settings → VoiceWake → Notifications
2. Disable all notifications
3. Return to app
4. Try to create a new alarm
5. **Expected**: Alert appears: "Permissions Required"
6. Tap "Open Settings"
7. **Expected**: Settings app opens to notification settings
8. Enable notifications
9. Return to app and try creating alarm again
10. **Expected**: Alarm created and scheduled successfully

### Test 3: Edit Alarm
1. Tap on an existing alarm
2. Change the time or days
3. Tap "Save"
4. **Expected**: Alarm updated and rescheduled
5. Check console logs for:
   - `✅ Cancelled old alarm schedule`
   - `✅ Rescheduled alarm with updated settings`

### Test 4: Delete Alarm
1. Tap on an alarm to edit
2. Tap "Delete" button
3. Confirm deletion
4. **Expected**: Alarm deleted from both database and native scheduler
5. Check console logs for:
   - `✅ Cancelled alarm from native scheduler`
   - `✅ Deleted alarm from database`

### Test 5: Alarm Actually Triggers
1. Create an alarm for 2 minutes from now
2. Wait for the alarm time
3. **Expected**: 
   - Notification appears
   - App logs: `🔥🔥🔥 ALARM FIRED! 🔥🔥🔥`
   - App navigates to AlarmTrigger screen

## What to Look For

### Console Logs (Success Path)
```
🔑 Checking permissions before creating alarm...
✅ All alarm permissions granted
✅ Alarm saved to database, now scheduling with native module...
🔑 Checking permissions before scheduling alarm...
✅ All alarm permissions granted
📅 Scheduling alarm:
   ID: alarm_1699290000000
   Label: Wake Up
   Time: 07:00
   Days: [1, 2, 3, 4, 5]
   Will fire at: 11/7/2025, 7:00:00 AM
   Time until fire: 720 minutes
✅ Alarm scheduled successfully with ID: alarm_1699290000000
```

### Console Logs (Permission Denied)
```
🔑 Checking permissions before creating alarm...
❌ Notification permissions not granted
[Alert shown to user]
```

### Console Logs (Alarm Fires)
```
🔥🔥🔥 ALARM FIRED! 🔥🔥🔥
Event details: {
  "alarmId": "alarm_1699290000000",
  "label": "Wake Up",
  ...
}
📱 Navigation ready - navigating to AlarmTrigger
```

## Common Issues

### Issue: Alarm doesn't trigger
**Possible causes:**
- Fire date is in the past (check logs for: `⚠️ WARNING: Fire date is in the past!`)
- Notifications disabled in iOS Settings
- App not granted notification permissions
- Native scheduler not called (check logs for `✅ Alarm scheduled successfully`)

**How to debug:**
1. Check console for scheduling logs
2. Verify permissions in iOS Settings
3. Try setting an alarm for 1-2 minutes in the future
4. Check if fire date calculation is correct

### Issue: "Permissions Required" alert keeps appearing
**Solution:**
- Go to iOS Settings → VoiceWake → Notifications
- Enable "Allow Notifications"
- Return to app

### Issue: Alarm saved but not scheduled
**Possible causes:**
- Permission revoked between check and schedule
- Native module error

**Solution:**
1. Check full error message in console
2. Verify native module is loaded: `✅ AlarmScheduler native module loaded successfully`
3. Try deleting and recreating the alarm

## Expected Behavior Summary

| Action | Permission Granted | Permission Denied |
|--------|-------------------|-------------------|
| Create Alarm | ✅ Saves + Schedules | ❌ Prompts for permission |
| Edit Alarm | ✅ Updates + Reschedules | ❌ Prompts for permission |
| Delete Alarm | ✅ Removes from DB + Cancels schedule | ✅ Removes from DB |
| Alarm Triggers | ✅ Fires notification + Opens app | ❌ Won't trigger |

## Testing Permissions on First Launch

1. Delete the app completely
2. Reinstall from Xcode
3. Open the app
4. Try to create an alarm
5. **Expected**: iOS permission prompt appears
6. Grant permission
7. Alarm should save and schedule successfully

This simulates the first-time user experience.

