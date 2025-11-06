/**
 * Alarm Triggering Diagnostic Tool
 * Import and use this in your App.tsx to debug why alarms aren't firing
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function diagnoseAlarmTriggering() {
  console.log('\n🚨 ==========================================');
  console.log('🔍 ALARM TRIGGERING DIAGNOSTICS');
  console.log('==========================================\n');
  
  // 1. Check notification permissions
  console.log('📋 Step 1: Checking Notification Permissions');
  try {
    const settings = await Notifications.getPermissionsAsync();
    console.log('   Status:', settings.status);
    console.log('   Can ask again:', settings.canAskAgain);
    console.log('   Granted:', settings.granted);
    
    if (!settings.granted) {
      console.log('   ❌ ISSUE: Notifications not granted!');
      console.log('   💡 Solution: Request permissions first');
    } else {
      console.log('   ✅ Notifications are granted');
    }
  } catch (error) {
    console.log('   ❌ Error checking permissions:', error);
  }
  
  // 2. Check if AlarmScheduler module is available
  console.log('\n📋 Step 2: Checking AlarmScheduler Module');
  try {
    const { alarmScheduler } = require('./src/modules/alarm/AlarmScheduler');
    console.log('   ✅ AlarmScheduler module loaded');
    
    // Try to get scheduled alarms
    const scheduled = await alarmScheduler.getScheduledAlarms();
    console.log(`   📅 Scheduled alarms: ${scheduled.length}`);
    
    if (scheduled.length === 0) {
      console.log('   ⚠️  No alarms scheduled!');
    } else {
      scheduled.forEach((alarm, i) => {
        const fireDate = new Date(alarm.fireDateMs);
        const now = new Date();
        const isPast = fireDate < now;
        const timeUntil = Math.round((fireDate.getTime() - now.getTime()) / 1000 / 60);
        
        console.log(`\n   Alarm ${i + 1}:`);
        console.log(`      ID: ${alarm.id}`);
        console.log(`      Label: ${alarm.label || 'No label'}`);
        console.log(`      Fire date: ${fireDate.toLocaleString()}`);
        console.log(`      Status: ${isPast ? '❌ IN PAST (won\'t fire!)' : `✅ In ${timeUntil} minutes`}`);
      });
    }
  } catch (error) {
    console.log('   ❌ Error checking alarms:', error);
  }
  
  // 3. Check iOS-specific notification settings
  if (Platform.OS === 'ios') {
    console.log('\n📋 Step 3: iOS-Specific Checks');
    try {
      const { UNUserNotificationCenter } = require('react-native').NativeModules;
      console.log('   Notification center available:', !!UNUserNotificationCenter);
      
      // Check pending notifications
      const pendingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`   📬 Pending notifications: ${pendingNotifications.length}`);
      
      if (pendingNotifications.length === 0) {
        console.log('   ⚠️  No notifications in iOS notification center!');
        console.log('   💡 This means alarms were scheduled but iOS cleared them');
      } else {
        pendingNotifications.forEach((notif, i) => {
          console.log(`\n   Notification ${i + 1}:`);
          console.log(`      ID: ${notif.identifier}`);
          console.log(`      Title: ${notif.content.title}`);
          console.log(`      Trigger: ${notif.trigger ? JSON.stringify(notif.trigger) : 'No trigger'}`);
        });
      }
    } catch (error) {
      console.log('   ⚠️  Could not check iOS notifications:', error);
    }
  }
  
  // 4. Check app state
  console.log('\n📋 Step 4: App State Check');
  const { AppState } = require('react-native');
  console.log('   Current app state:', AppState.currentState);
  if (AppState.currentState === 'active') {
    console.log('   ✅ App is in foreground');
  } else {
    console.log('   ⚠️  App is not in foreground');
  }
  
  // 5. Check alarm listener
  console.log('\n📋 Step 5: Event Listener Status');
  console.log('   ℹ️  Check if you see "🔔 Alarm fired!" in logs when alarm triggers');
  console.log('   ℹ️  If not, the native event is not being received');
  
  console.log('\n==========================================');
  console.log('🎯 COMMON ISSUES & SOLUTIONS');
  console.log('==========================================\n');
  
  console.log('❌ Issue 1: Notifications Not Granted');
  console.log('   Solution: Call alarmScheduler.ensurePermissions() before scheduling\n');
  
  console.log('❌ Issue 2: Alarm Time is in the Past');
  console.log('   Solution: Check the fire date - it must be in the future\n');
  
  console.log('❌ Issue 3: App Force-Killed');
  console.log('   Solution: Keep app running in background (iOS limitation)\n');
  
  console.log('❌ Issue 4: Simulator Issues');
  console.log('   Solution: Try on a real device for reliable testing\n');
  
  console.log('❌ Issue 5: Notification Delegate Not Set');
  console.log('   Solution: Verify AlarmNotificationDelegate.shared.configure() is called\n');
  
  console.log('==========================================\n');
}

/**
 * Add a test alarm listener to verify events are firing
 */
export function addTestAlarmListener() {
  const { alarmScheduler } = require('./src/modules/alarm/AlarmScheduler');
  
  console.log('🔔 Test alarm listener added');
  
  const subscription = alarmScheduler.addAlarmFiredListener((event) => {
    console.log('🔥🔥🔥 ALARM FIRED! 🔥🔥🔥');
    console.log('Event:', JSON.stringify(event, null, 2));
  });
  
  return subscription;
}

