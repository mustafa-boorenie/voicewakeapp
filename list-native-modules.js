/**
 * List All Native Modules
 * 
 * This script shows all available native modules
 * to diagnose why AlarmScheduler isn't loading.
 */

import { NativeModules } from 'react-native';

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('          ALL AVAILABLE NATIVE MODULES');
console.log('═══════════════════════════════════════════════════════');
console.log('');

const modules = Object.keys(NativeModules).sort();

console.log(`Found ${modules.length} native modules:\n`);

modules.forEach((name, index) => {
  const module = NativeModules[name];
  const type = typeof module;
  console.log(`${index + 1}. ${name} (${type})`);
  
  if (name === 'AlarmScheduler' || name === 'SpeechRecognizer') {
    console.log(`   ⭐ IMPORTANT MODULE FOUND!`);
    if (module && typeof module === 'object') {
      const methods = Object.keys(module);
      console.log(`   Methods: ${methods.join(', ')}`);
    }
  }
});

console.log('');
console.log('───────────────────────────────────────────────────────');
console.log('');

// Check specifically for our modules
console.log('🔍 Checking for our specific modules:');
console.log('');

const alarm = NativeModules.AlarmScheduler;
const speech = NativeModules.SpeechRecognizer;

if (alarm) {
  console.log('✅ AlarmScheduler: FOUND');
  console.log('   Type:', typeof alarm);
  console.log('   Methods:', Object.keys(alarm).join(', '));
} else {
  console.log('❌ AlarmScheduler: NOT FOUND');
  console.log('   This means the module is not being linked/compiled properly');
}

console.log('');

if (speech) {
  console.log('✅ SpeechRecognizer: FOUND');
  console.log('   Type:', typeof speech);
  console.log('   Methods:', Object.keys(speech).join(', '));
} else {
  console.log('❌ SpeechRecognizer: NOT FOUND');
}

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('');

// Export for manual use
global.listNativeModules = () => {
  console.log('Native Modules:', Object.keys(NativeModules).sort().join(', '));
};

