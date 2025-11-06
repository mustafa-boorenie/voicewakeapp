/**
 * DIRECT PERMISSION REQUEST TEST
 * 
 * This script tests the iOS permission request in complete isolation.
 * Run this in the app console to test if the permission dialog appears.
 */

import { NativeModules } from 'react-native';

const AlarmScheduler = NativeModules.AlarmScheduler;

async function testDirectPermissionRequest() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('     DIRECT PERMISSION REQUEST TEST');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  if (!AlarmScheduler) {
    console.error('❌ AlarmScheduler native module not found!');
    return;
  }
  
  console.log('✅ AlarmScheduler module loaded');
  console.log('');
  
  // Step 1: Check current status
  console.log('📋 Step 1: Checking current permission status...');
  try {
    const status = await AlarmScheduler.getNotificationPermissionStatus();
    console.log(`   Current status: ${status}`);
    console.log('');
    
    if (status === 'notDetermined') {
      console.log('✨ Status is notDetermined - permission dialog SHOULD appear!');
      console.log('');
      
      // Step 2: Request permission directly
      console.log('🔔 Step 2: Calling direct permission request...');
      console.log('⏳ Waiting for iOS permission dialog...');
      console.log('');
      console.log('👆 LOOK AT YOUR DEVICE - the iOS dialog should appear NOW');
      console.log('');
      
      const granted = await AlarmScheduler.directRequestNotificationPermission();
      
      console.log('');
      console.log('📱 Result received!');
      if (granted) {
        console.log('✅ SUCCESS! User granted permissions');
      } else {
        console.log('❌ User denied permissions');
      }
      
    } else if (status === 'denied') {
      console.log('🚫 Status is DENIED');
      console.log('The iOS dialog will NOT appear (iOS security restriction)');
      console.log('');
      console.log('To fix:');
      console.log('1. Go to: Settings → VoiceWake → Notifications');
      console.log('2. Enable "Allow Notifications"');
      console.log('3. Return here and run this test again');
      console.log('');
      console.log('Or to reset completely:');
      console.log('1. Delete the app');
      console.log('2. Restart your device');
      console.log('3. Reinstall the app');
      console.log('4. Run this test again');
      
    } else if (status === 'authorized') {
      console.log('✅ Status is AUTHORIZED');
      console.log('Permissions are already granted - no dialog needed!');
      console.log('');
      console.log('To test the dialog again:');
      console.log('1. Delete the app');
      console.log('2. Restart your device');
      console.log('3. Reinstall the app');
      console.log('4. Run this test again');
      
    } else {
      console.log(`❓ Status is ${status}`);
      console.log('This is an unexpected status.');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR during test:');
    console.error(error);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('                    TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

// Instructions
console.log('');
console.log('🧪 DIRECT PERMISSION TEST LOADED');
console.log('');
console.log('To run the test, call:');
console.log('  testDirectPermissionRequest()');
console.log('');
console.log('This will:');
console.log('1. Check current permission status');
console.log('2. If notDetermined, request permissions (dialog appears)');
console.log('3. Report the result');
console.log('');

// Export for console use
global.testDirectPermissionRequest = testDirectPermissionRequest;

// Auto-run if desired (comment out to run manually)
testDirectPermissionRequest();

