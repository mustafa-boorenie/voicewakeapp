/**
 * Permission Status Checker
 * 
 * This script helps debug notification permission issues.
 * Run this to see the current permission status on your device.
 */

import { NativeModules } from 'react-native';

const AlarmScheduler = NativeModules.AlarmScheduler;

async function checkPermissionStatus() {
  console.log('🔍 Checking notification permission status...\n');
  
  if (!AlarmScheduler) {
    console.error('❌ AlarmScheduler native module not found!');
    console.error('Make sure you are running on iOS or Android.');
    return;
  }
  
  try {
    // Check current status
    const status = await AlarmScheduler.getNotificationPermissionStatus();
    
    console.log('📋 Current Permission Status:', status);
    console.log('');
    
    // Explain what this means
    switch (status) {
      case 'notDetermined':
        console.log('✨ Status: NOT DETERMINED');
        console.log('This means permissions have never been requested.');
        console.log('➡️ The iOS permission dialog WILL appear when you try to create an alarm.');
        console.log('');
        console.log('What to do: Just create an alarm and tap "Allow" when the dialog appears.');
        break;
        
      case 'denied':
        console.log('🚫 Status: DENIED');
        console.log('This means permissions were previously denied.');
        console.log('➡️ The iOS permission dialog CANNOT appear again (iOS security).');
        console.log('');
        console.log('What to do:');
        console.log('1. Go to: Settings → VoiceWake → Notifications');
        console.log('2. Enable "Allow Notifications"');
        console.log('3. Return to the app');
        console.log('4. Try creating an alarm again');
        console.log('');
        console.log('Or use the "Open Settings" button in the app when creating an alarm.');
        break;
        
      case 'authorized':
        console.log('✅ Status: AUTHORIZED');
        console.log('Permissions are fully granted!');
        console.log('➡️ Alarms should schedule and trigger normally.');
        console.log('');
        console.log('If alarms are not triggering, check:');
        console.log('- The fire date is not in the past');
        console.log('- The alarm is enabled in the database');
        console.log('- The native module scheduled the alarm (check logs for "✅ Alarm scheduled successfully")');
        break;
        
      case 'provisional':
        console.log('⚡ Status: PROVISIONAL');
        console.log('Permissions are granted provisionally (quiet notifications).');
        console.log('➡️ Alarms should work, but notifications may be quiet.');
        break;
        
      case 'ephemeral':
        console.log('⏱️ Status: EPHEMERAL');
        console.log('Temporary permissions granted (rare).');
        console.log('➡️ Alarms should work temporarily.');
        break;
        
      default:
        console.log('❓ Status: UNKNOWN');
        console.log('The permission status is not recognized.');
        console.log('This might indicate a problem with the native module.');
        break;
    }
    
    console.log('');
    console.log('───────────────────────────────────────────────────────');
    console.log('');
    
    // Try to ensure permissions (will request if notDetermined)
    console.log('🔔 Now attempting to ensure permissions...\n');
    const granted = await AlarmScheduler.ensureNotificationPermission();
    
    if (granted) {
      console.log('✅ SUCCESS! Permissions are granted.');
      console.log('You can now create alarms.');
    } else {
      console.log('❌ FAILED! Permissions are not granted.');
      if (status === 'denied') {
        console.log('As mentioned above, you must enable notifications in iOS Settings.');
      } else {
        console.log('The user may have denied the permission dialog.');
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error checking permissions:');
    console.error(error);
  }
}

// Auto-run
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('         NOTIFICATION PERMISSION CHECKER');
console.log('═══════════════════════════════════════════════════════');
console.log('');

checkPermissionStatus().then(() => {
  console.log('Done! Check the results above.');
}).catch(error => {
  console.error('Fatal error:', error);
});

