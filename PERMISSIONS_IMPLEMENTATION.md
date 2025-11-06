# Alarm Permissions Implementation

## Overview
This document explains the comprehensive permissions system implemented for alarm scheduling in the VoiceWake app.

## What Changed

### 1. AlarmScheduler Module (`src/modules/alarm/AlarmScheduler.ts`)

#### Enhanced Permission Checking
- **`ensurePermissions()`**: Now includes detailed logging for permission checks
- **`requestPermissionsWithPrompt()`**: New method that wraps permission checks with user-friendly prompts
- **`scheduleAlarm()`**: ALWAYS checks permissions before scheduling, throws `PERMISSIONS_REQUIRED` error if denied

#### Error Handling
The `scheduleAlarm` method now:
- Checks permissions at the start of every scheduling attempt
- Throws a specific `PERMISSIONS_REQUIRED` error message that UI can detect
- Logs permission status and scheduling progress for debugging

### 2. CreateAlarmScreen (`src/screens/CreateAlarmScreen.tsx`)

#### Permission Flow
1. **Pre-save Check**: Permissions are checked BEFORE saving to database
2. **User Prompt**: If permissions denied, shows alert with "Open Settings" button
3. **Graceful Handling**: If user cancels, operation aborts without saving

#### Implementation Details
```typescript
// Check permissions FIRST before saving anything
const hasPermissions = await alarmScheduler.ensurePermissions();

if (!hasPermissions) {
  Alert.alert(
    'Permissions Required',
    'This app needs notification permissions to schedule alarms...',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => alarmScheduler.openAlarmSettings() }
    ]
  );
  return;
}
```

#### Post-save Scheduling
After successfully saving to database:
1. Creates an `Alarm` object
2. Calls `alarmScheduler.scheduleAlarm(alarm)`
3. Handles two error scenarios:
   - **Permission Error**: Shows specific permission prompt with Settings option
   - **Other Errors**: Shows generic error with error message

### 3. EditAlarmScreen (`src/screens/EditAlarmScreen.tsx`)

#### Save Flow
When updating an alarm:
1. **Permission Check**: Only checks if alarm is being enabled
2. **Cancel Old Schedule**: Cancels the existing alarm schedule
3. **Reschedule**: If enabled, schedules with new settings
4. **Error Handling**: Same two-tier approach as CreateAlarmScreen

#### Delete Flow
When deleting an alarm:
1. **Cancel Schedule**: First cancels from native scheduler
2. **Delete from DB**: Then removes from database
3. **Graceful Failure**: Continues with DB deletion even if cancel fails

## Permission Check Points

Permissions are now checked at these critical points:

1. ✅ **Before Creating Alarm** - Pre-save check in CreateAlarmScreen
2. ✅ **After Creating Alarm** - When scheduling with native module
3. ✅ **Before Updating Alarm** - Pre-save check in EditAlarmScreen (if enabled)
4. ✅ **After Updating Alarm** - When rescheduling with native module
5. ✅ **Before Deleting Alarm** - Cancels native schedule

## User Experience

### Scenario 1: Permissions Already Granted
- User creates/edits alarm
- Alarm is saved and scheduled immediately
- Success message: "Alarm created and scheduled successfully!"

### Scenario 2: Permissions Not Granted (First Time)
- User attempts to create/edit alarm
- Alert appears: "Permissions Required"
- User taps "Open Settings"
- System Settings opens to notification permissions
- User grants permissions
- User returns to app and tries again
- Alarm is saved and scheduled successfully

### Scenario 3: Permissions Denied (Subsequent Attempts)
- User creates alarm without permissions
- Pre-save check catches this
- User is prompted to enable in Settings
- If user cancels, nothing is saved
- If user goes to Settings, they can enable and retry

### Scenario 4: Partial Failure
- Alarm saves to database successfully
- Native scheduling fails (rare edge case)
- User sees: "Alarm saved but not scheduled"
- User is prompted to open Settings
- Alarm remains in database for future scheduling

## Technical Details

### Error Detection
The system detects permission errors by checking if the error message contains `PERMISSIONS_REQUIRED`:

```typescript
if (scheduleError.message && scheduleError.message.includes('PERMISSIONS_REQUIRED')) {
  // Show permission-specific alert
} else {
  // Show generic error
}
```

### Logging
Extensive console logging helps debug permission issues:

```
🔑 Checking permissions before creating alarm...
✅ All alarm permissions granted
✅ Alarm saved to database, now scheduling with native module...
📅 Scheduling alarm:
   ID: alarm_1699290000000
   Label: Wake Up
   Time: 07:00
   Days: [1, 2, 3, 4, 5]
   Will fire at: 11/7/2025, 7:00:00 AM
   Time until fire: 720 minutes
✅ Alarm scheduled successfully with ID: alarm_1699290000000
```

### Settings Integration
The `openAlarmSettings()` method:
- On iOS: Opens the app's notification settings in iOS Settings
- On Android: Opens exact alarm settings
- Allows users to grant permissions without leaving the app context

## Testing Checklist

To verify the implementation:

### Basic Flow
- [ ] Create a new alarm → Should prompt for permissions if not granted
- [ ] Edit an alarm → Should check permissions when enabling
- [ ] Delete an alarm → Should cancel native schedule
- [ ] Toggle alarm on HomeScreen → Should check permissions

### Permission Scenarios
- [ ] Deny permissions → Should show "Open Settings" prompt
- [ ] Grant permissions → Alarm should schedule successfully
- [ ] Revoke permissions → Next alarm creation should prompt
- [ ] Background app → Permissions persist across sessions

### Error Handling
- [ ] Database save success + schedule failure → Should show partial success
- [ ] Database save failure → Should show creation error
- [ ] Permission check during save → Should prevent save if denied

## Benefits

1. **User-Friendly**: Clear prompts explain why permissions are needed
2. **Proactive**: Checks permissions before any database changes
3. **Fail-Safe**: Multiple checkpoints ensure alarms are properly scheduled
4. **Transparent**: Extensive logging helps diagnose issues
5. **Recoverable**: Partial failures still save to DB for later scheduling
6. **Consistent**: Same pattern across Create, Edit, and Delete flows

## Recent Updates (Permission Request Fix)

### Problem Identified
Permissions were being checked but never actually requested. The iOS permission dialog wasn't appearing.

### Root Cause
- iOS has three permission states: `notDetermined`, `denied`, `authorized`
- The dialog only appears when state is `notDetermined` (first time)
- If previously denied, iOS requires users to manually enable in Settings
- The native code was working correctly, but lacked visibility into the current state

### What Was Fixed

1. **Added Permission Status Method** (`getNotificationPermissionStatus`)
   - Returns current permission state as a string
   - Allows JS code to understand why dialog isn't appearing

2. **Enhanced Native Logging**
   - Added detailed console output in Swift code
   - Shows current permission status before requesting
   - Explains what action is being taken

3. **Improved JS Logging**
   - Checks and logs permission status before requesting
   - Provides clear feedback about what will happen
   - Distinguishes between "will prompt" and "must go to Settings" scenarios

### New Console Output

You'll now see:
```
🔑 Checking permissions before creating alarm...
📋 Current notification permission status: notDetermined
🔔 First time requesting permissions - iOS dialog will appear
[iOS Dialog Appears]
✅ User granted notification permissions
✅ All alarm permissions granted
```

Or if denied:
```
🔑 Checking permissions before creating alarm...
📋 Current notification permission status: denied
❌ Permissions were previously denied - user must enable in Settings
❌ Notification permissions not granted
```

### Testing Tools

1. **PERMISSIONS_FIX.md** - Comprehensive explanation of the fix
2. **check-permissions.js** - Diagnostic script to check current status
3. **TEST_PERMISSIONS.md** - Step-by-step testing guide

## Next Steps

To further improve the system:

1. ✅ **Permission Status Visibility** - DONE! Added status checking
2. **Auto-Reschedule**: When permissions are granted, auto-schedule saved alarms
3. **Permission Status UI**: Show permission status in Settings screen
4. **Batch Operations**: Handle multiple alarms efficiently
5. **Background Sync**: Verify scheduled alarms match database on app launch
6. **Migration**: Add migration script to schedule existing alarms in database

## Conclusion

The permissions system is now comprehensive, user-friendly, and robust. Every alarm operation checks permissions and provides clear guidance when they're missing. The system gracefully handles edge cases and provides detailed logging for debugging.

