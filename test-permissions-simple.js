/**
 * Simple Permission Test
 * 
 * Tests permission methods step-by-step to find where it's failing
 */

import { NativeModules } from 'react-native';

async function testPermissionsStepByStep() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('       STEP-BY-STEP PERMISSION TEST');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  const AlarmScheduler = NativeModules.AlarmScheduler;
  
  // Step 1: Check if module exists
  console.log('Step 1: Check if AlarmScheduler module exists');
  if (!AlarmScheduler) {
    console.error('❌ FAILED: AlarmScheduler module is undefined');
    console.error('The native module is not loading.');
    return;
  }
  console.log('✅ Module exists');
  console.log('');
  
  // Step 2: List available methods
  console.log('Step 2: List available methods');
  const methods = Object.keys(AlarmScheduler);
  console.log('Available methods:', methods.join(', '));
  console.log('');
  
  // Step 3: Check if permission methods exist
  console.log('Step 3: Check if permission methods exist');
  const hasGetStatus = typeof AlarmScheduler.getNotificationPermissionStatus === 'function';
  const hasEnsure = typeof AlarmScheduler.ensureNotificationPermission === 'function';
  const hasDirect = typeof AlarmScheduler.directRequestNotificationPermission === 'function';
  
  console.log('  getNotificationPermissionStatus:', hasGetStatus ? '✅' : '❌');
  console.log('  ensureNotificationPermission:', hasEnsure ? '✅' : '❌');
  console.log('  directRequestNotificationPermission:', hasDirect ? '✅' : '❌');
  console.log('');
  
  if (!hasGetStatus || !hasEnsure) {
    console.error('❌ FAILED: Required permission methods are missing');
    console.error('The module loaded but methods are not exposed.');
    return;
  }
  
  // Step 4: Try to get permission status (with timeout)
  console.log('Step 4: Try to get permission status');
  console.log('Calling getNotificationPermissionStatus()...');
  
  try {
    const statusPromise = AlarmScheduler.getNotificationPermissionStatus();
    console.log('Promise created, waiting for result...');
    
    // Add a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT after 5 seconds')), 5000);
    });
    
    const status = await Promise.race([statusPromise, timeoutPromise]);
    
    console.log('✅ Got status:', status);
    console.log('');
    
    // Step 5: Based on status, try to request permissions
    console.log('Step 5: Request permissions based on status');
    
    if (status === 'notDetermined') {
      console.log('Status is notDetermined - will request permissions');
      console.log('👆 WATCH YOUR DEVICE - dialog should appear...');
      console.log('');
      console.log('Calling ensureNotificationPermission()...');
      
      const ensurePromise = AlarmScheduler.ensureNotificationPermission();
      const ensureTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT after 10 seconds')), 10000);
      });
      
      const granted = await Promise.race([ensurePromise, ensureTimeout]);
      console.log('');
      console.log(granted ? '✅ GRANTED!' : '❌ DENIED');
      
    } else if (status === 'denied') {
      console.log('❌ Status is DENIED');
      console.log('You must enable notifications in Settings:');
      console.log('Settings → VoiceWake → Notifications → Allow Notifications');
      
    } else if (status === 'authorized') {
      console.log('✅ Status is AUTHORIZED');
      console.log('Permissions are already granted!');
      
    } else {
      console.log('⚠️ Unknown status:', status);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    
    if (error.message.includes('TIMEOUT')) {
      console.error('The native method is not responding.');
      console.error('Possible causes:');
      console.error('  1. Method is hanging in native code');
      console.error('  2. Callback is not being called');
      console.error('  3. Promise is not being resolved');
      console.error('');
      console.error('Check Xcode logs for native errors.');
    } else {
      console.error('Full error:', error);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('                   TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

// Export for console use
global.testPermissionsStepByStep = testPermissionsStepByStep;

console.log('');
console.log('🧪 Simple permission test loaded');
console.log('To run: testPermissionsStepByStep()');
console.log('');

// Auto-run
testPermissionsStepByStep();

