/**
 * Diagnostic Script for AlarmScheduler Module
 * Add this to your App.tsx temporarily to debug the module
 */

import { NativeModules, Platform } from 'react-native';

export function diagnoseAlarmModule() {
  console.log('==========================================');
  console.log('🔍 AlarmScheduler Module Diagnostics');
  console.log('==========================================');
  
  console.log('📱 Platform:', Platform.OS);
  console.log('📱 Platform Version:', Platform.Version);
  
  console.log('\n📦 Available Native Modules:');
  const moduleNames = Object.keys(NativeModules).sort();
  console.log(`   Total: ${moduleNames.length} modules`);
  moduleNames.forEach(name => {
    if (name.toLowerCase().includes('alarm') || name.toLowerCase().includes('scheduler')) {
      console.log(`   ✅ ${name}`);
    }
  });
  
  console.log('\n🎯 Checking AlarmScheduler specifically:');
  if (NativeModules.AlarmScheduler) {
    console.log('   ✅ AlarmScheduler module EXISTS');
    console.log('   📋 Available methods:');
    const methods = Object.keys(NativeModules.AlarmScheduler);
    methods.forEach(method => {
      console.log(`      - ${method}`);
    });
  } else {
    console.log('   ❌ AlarmScheduler module NOT FOUND');
    console.log('\n💡 Possible causes:');
    console.log('   1. Swift compilation error');
    console.log('   2. Missing in Compile Sources (Build Phases)');
    console.log('   3. Bridging header misconfigured');
    console.log('   4. Module not properly exported');
  }
  
  console.log('\n🔍 Other Alarm-related modules:');
  moduleNames.filter(n => 
    n.toLowerCase().includes('alarm') || 
    n.toLowerCase().includes('notification') ||
    n.toLowerCase().includes('scheduler')
  ).forEach(name => console.log(`   - ${name}`));
  
  console.log('==========================================\n');
}

