# Native Modules Implementation Guide

This document provides detailed implementation instructions for the iOS and Android native modules required for production deployment.

## Overview

The React Native app currently uses placeholder implementations for:
1. **Speech-to-Text (STT)**: On-device voice recognition
2. **Alarm Scheduling**: Exact alarm timing with background execution
3. **Audio Recording**: Real-time audio capture with feature extraction

## Module 1: Speech-to-Text

### iOS Implementation

**Location**: `ios/AffirmationAlarm/RNSpeechRecognizer.swift`

#### Requirements
- iOS 13+ (for on-device recognition)
- Privacy: `NSSpeechRecognitionUsageDescription` in Info.plist
- Framework: `Speech.framework`

#### Implementation Steps

1. **Create Swift Module**:
```swift
import Speech

@objc(RNSpeechRecognizer)
class RNSpeechRecognizer: RCTEventEmitter {
  private var recognitionTask: SFSpeechRecognitionTask?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private let audioEngine = AVAudioEngine()
  private var speechRecognizer: SFSpeechRecognizer?
  
  override func supportedEvents() -> [String]! {
    return ["onTranscriptUpdate", "onTranscriptFinal", "onError"]
  }
  
  @objc
  func startRecognition(_ locale: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Request authorization
    SFSpeechRecognizer.requestAuthorization { status in
      guard status == .authorized else {
        rejecter("AUTH_DENIED", "Speech recognition not authorized", nil)
        return
      }
      
      self.startRecognitionTask(locale: locale, resolver: resolver, rejecter: rejecter)
    }
  }
  
  private func startRecognitionTask(locale: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Configure audio session
    let audioSession = AVAudioSession.sharedInstance()
    try? audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
    try? audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    
    // Create speech recognizer
    speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
    
    // Check if on-device recognition is available
    if #available(iOS 13.0, *), speechRecognizer?.supportsOnDeviceRecognition == true {
      recognitionRequest?.requiresOnDeviceRecognition = true
    }
    
    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    guard let recognitionRequest = recognitionRequest else {
      rejecter("INIT_ERROR", "Unable to create recognition request", nil)
      return
    }
    
    recognitionRequest.shouldReportPartialResults = true
    
    let inputNode = audioEngine.inputNode
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
      recognitionRequest.append(buffer)
    }
    
    audioEngine.prepare()
    do {
      try audioEngine.start()
    } catch {
      rejecter("ENGINE_ERROR", "Audio engine failed to start", error)
      return
    }
    
    recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
      if let result = result {
        let transcript = result.bestTranscription.formattedString
        let isFinal = result.isFinal
        let confidence = result.bestTranscription.segments.last?.confidence ?? 0.0
        
        self?.sendEvent(withName: isFinal ? "onTranscriptFinal" : "onTranscriptUpdate", 
                       body: ["transcript": transcript, "confidence": confidence])
        
        if isFinal {
          self?.stopRecognition()
        }
      }
      
      if let error = error {
        self?.sendEvent(withName: "onError", body: ["error": error.localizedDescription])
        self?.stopRecognition()
      }
    }
    
    resolver(true)
  }
  
  @objc
  func stopRecognition(_ resolver: RCTPromiseResolveBlock? = nil, rejecter: RCTPromiseRejectBlock? = nil) {
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    
    recognitionTask = nil
    recognitionRequest = nil
    
    resolver?(true)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
```

2. **Create Objective-C Bridge Header** (`RNSpeechRecognizer.m`):
```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNSpeechRecognizer, RCTEventEmitter)

RCT_EXTERN_METHOD(startRecognition:(NSString *)locale
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopRecognition:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

3. **Update JavaScript Interface** (`src/modules/stt/Transcriber.ts`):
```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';

const { RNSpeechRecognizer } = NativeModules;
const speechEmitter = new NativeEventEmitter(RNSpeechRecognizer);

export class Transcriber {
  async transcribeStream(onResult, onError) {
    speechEmitter.addListener('onTranscriptUpdate', (data) => {
      onResult({ transcript: data.transcript, confidence: data.confidence, isFinal: false });
    });
    
    speechEmitter.addListener('onTranscriptFinal', (data) => {
      onResult({ transcript: data.transcript, confidence: data.confidence, isFinal: true });
    });
    
    speechEmitter.addListener('onError', (data) => {
      onError(new Error(data.error));
    });
    
    await RNSpeechRecognizer.startRecognition(this.config.language);
  }
  
  async stop() {
    await RNSpeechRecognizer.stopRecognition();
  }
}
```

### Android Implementation

**Location**: `android/app/src/main/java/com/affirmationalarm/SpeechRecognizerModule.kt`

```kotlin
package com.affirmationalarm

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognizerModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), RecognitionListener {
    
    private var speechRecognizer: SpeechRecognizer? = null
    private var promise: Promise? = null
    
    override fun getName() = "RNSpeechRecognizer"
    
    @ReactMethod
    fun startRecognition(locale: String, promise: Promise) {
        this.promise = promise
        
        if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
            promise.reject("NOT_AVAILABLE", "Speech recognition not available")
            return
        }
        
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext).apply {
            setRecognitionListener(this@SpeechRecognizerModule)
        }
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
        }
        
        speechRecognizer?.startListening(intent)
        promise.resolve(true)
    }
    
    @ReactMethod
    fun stopRecognition(promise: Promise) {
        speechRecognizer?.stopListening()
        speechRecognizer?.destroy()
        speechRecognizer = null
        promise.resolve(true)
    }
    
    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val confidence = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
        
        matches?.firstOrNull()?.let { transcript ->
            sendEvent("onTranscriptFinal", mapOf(
                "transcript" to transcript,
                "confidence" to (confidence?.firstOrNull() ?: 0.0)
            ))
        }
    }
    
    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        matches?.firstOrNull()?.let { transcript ->
            sendEvent("onTranscriptUpdate", mapOf(
                "transcript" to transcript,
                "confidence" to 0.5
            ))
        }
    }
    
    override fun onError(error: Int) {
        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No match found"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout"
            else -> "Unknown error"
        }
        
        sendEvent("onError", mapOf("error" to errorMessage))
    }
    
    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
    
    private fun sendEvent(eventName: String, params: Map<String, Any>) {
        val eventParams = Arguments.createMap().apply {
            params.forEach { (key, value) ->
                when (value) {
                    is String -> putString(key, value)
                    is Double -> putDouble(key, value)
                    is Float -> putDouble(key, value.toDouble())
                    is Int -> putInt(key, value)
                    is Boolean -> putBoolean(key, value)
                }
            }
        }
        
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, eventParams)
    }
}
```

**Register Module** in `MainApplication.kt`:
```kotlin
override fun getPackages(): List<ReactPackage> {
    return PackageList(this).packages.apply {
        add(object : ReactPackage {
            override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
                return listOf(SpeechRecognizerModule(reactContext))
            }
            
            override fun createViewManagers(reactContext: ReactApplicationContext) = emptyList<ViewManager<*, *>>()
        })
    }
}
```

## Module 2: Alarm Scheduling

### iOS Implementation

**Requirements**:
- `UserNotifications.framework`
- Background Modes: Audio, Background fetch
- Critical alerts entitlement (requires Apple approval)

**AlarmScheduler.swift**:
```swift
import UserNotifications

@objc(RNAlarmScheduler)
class RNAlarmScheduler: NSObject {
  
  @objc
  func scheduleAlarm(_ alarmId: String, time: String, repeating: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge, .criticalAlert]) { granted, error in
      guard granted else {
        rejecter("PERMISSION_DENIED", "Notification permission not granted", nil)
        return
      }
      
      let content = UNMutableNotificationContent()
      content.title = "Affirmation Alarm"
      content.body = "Time to speak your affirmations and goals!"
      content.sound = UNNotificationSound.defaultCritical
      content.interruptionLevel = .critical
      content.userInfo = ["alarmId": alarmId]
      
      let timeParts = time.split(separator: ":")
      var dateComponents = DateComponents()
      dateComponents.hour = Int(timeParts[0])
      dateComponents.minute = Int(timeParts[1])
      
      let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: repeating)
      let request = UNNotificationRequest(identifier: alarmId, content: content, trigger: trigger)
      
      UNUserNotificationCenter.current().add(request) { error in
        if let error = error {
          rejecter("SCHEDULE_ERROR", error.localizedDescription, error)
        } else {
          resolver(alarmId)
        }
      }
    }
  }
  
  @objc
  func cancelAlarm(_ alarmId: String, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [alarmId])
    resolver(true)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
```

### Android Implementation

**AlarmSchedulerModule.kt**:
```kotlin
package com.affirmationalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import java.util.Calendar

class AlarmSchedulerModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "RNAlarmScheduler"
    
    @ReactMethod
    fun scheduleAlarm(alarmId: String, time: String, repeating: Boolean, promise: Promise) {
        val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        // Check for exact alarm permission (Android 12+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            promise.reject("PERMISSION_DENIED", "Exact alarm permission not granted")
            return
        }
        
        val intent = Intent(reactContext, AlarmReceiver::class.java).apply {
            action = "com.affirmationalarm.ALARM_TRIGGER"
            putExtra("ALARM_ID", alarmId)
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val timeParts = time.split(":")
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, timeParts[0].toInt())
            set(Calendar.MINUTE, timeParts[1].toInt())
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_MONTH, 1)
            }
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
        
        promise.resolve(alarmId)
    }
    
    @ReactMethod
    fun cancelAlarm(alarmId: String, promise: Promise) {
        val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(reactContext, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.cancel(pendingIntent)
        promise.resolve(true)
    }
}
```

**AlarmReceiver.kt**:
```kotlin
package com.affirmationalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("ALARM_ID") ?: return
        
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("ALARM_ID", alarmId)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
```

## Testing Native Modules

### iOS Testing
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Android Testing
```bash
npx react-native run-android
```

### Permission Testing

**iOS**: Test with Do Not Disturb enabled  
**Android**: Test with Doze mode, battery saver, and different manufacturers (Samsung, Xiaomi)

## Deployment Checklist

- [ ] Request iOS critical alerts entitlement from Apple
- [ ] Test on iOS 13+ devices
- [ ] Test on Android 12+ devices
- [ ] Verify permissions are requested correctly
- [ ] Test background alarm triggering
- [ ] Test STT accuracy with noise
- [ ] Verify anti-cheat detects playback
- [ ] Test battery optimization bypass
- [ ] Test Doze mode handling

## Support Resources

- [iOS Speech Framework](https://developer.apple.com/documentation/speech)
- [Android SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [iOS User Notifications](https://developer.apple.com/documentation/usernotifications)
- [Android AlarmManager](https://developer.android.com/reference/android/app/AlarmManager)
