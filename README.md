# Affirmation Alarm - Voice-Verified Morning Motivation App

A React Native mobile alarm app that requires users to speak their personalized affirmations and goals aloud before dismissing. Built with motivational interviewing principles, anti-cheat mechanisms, and offline-first architecture.

## 🎯 Core Features

- **Motivational Interviewing Onboarding**: 3-5 minute guided flow that elicits goals, values, and barriers
- **Voice Verification**: On-device speech-to-text with similarity scoring to verify spoken affirmations
- **Anti-Cheat System**: Detects playback, low energy, and microphone loop to ensure genuine recitation
- **Offline-First**: Works completely offline with on-device STT
- **Streak Tracking**: Daily completion tracking with best streak records
- **Accessibility**: VoiceOver/TalkBack support, Dynamic Type, haptic feedback

## 🏗️ Architecture

```
src/
├── components/        # Reusable UI components (WaveformDisplay)
├── constants/         # App copy, challenge words
├── db/               # SQLite schema and initialization
├── modules/          # Core business logic
│   ├── alarm/        # Alarm scheduling (native bridge placeholder)
│   ├── anticheat/    # Playback detection heuristics
│   ├── audio/        # Audio recording and feature extraction
│   ├── mi/           # Motivational Interviewing line generation
│   ├── stt/          # Speech-to-text (native bridge placeholder)
│   └── verify/       # Transcript verification engine
├── navigation/       # React Navigation setup
├── screens/          # App screens
│   ├── HomeScreen.tsx           # Main dashboard with streaks
│   ├── MIOnboardingScreen.tsx   # 8-step onboarding flow
│   └── AlarmTriggerScreen.tsx   # Full-screen alarm with voice gate
├── types/            # TypeScript type definitions
└── utils/            # Text normalization, similarity scoring
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode 14+ and CocoaPods
- For Android: Android Studio and JDK 17

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (experimental)
npm run web
```

### Running on Physical Devices

#### iOS
1. Install Expo Go from App Store
2. Run `npm start` and scan QR code
3. **Note**: On-device STT requires native modules (see Native Modules section)

#### Android
1. Install Expo Go from Play Store
2. Run `npm start` and scan QR code
3. **Note**: Exact alarm scheduling requires native modules

## 📱 Platform-Specific Requirements

### iOS Permissions (info.plist)

Already configured in `app.json`:
- `NSSpeechRecognitionUsageDescription`: For voice verification
- `NSMicrophoneUsageDescription`: For recording affirmations
- `UIBackgroundModes`: ["audio", "processing"] for alarm persistence
- `NSUserNotificationsUsageDescription`: For alarm notifications

### Android Permissions (AndroidManifest.xml)

Already configured in `app.json`:
- `RECORD_AUDIO`: For voice verification
- `SCHEDULE_EXACT_ALARM`: For precise alarm timing (Android 12+)
- `USE_EXACT_ALARM`: Alternative for exact alarms
- `WAKE_LOCK`: Keep device awake during alarm
- `VIBRATE`: Vibration feedback
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`: Prevent Doze mode interference
- `FOREGROUND_SERVICE`: Alarm UI while screen is off

### Battery Optimization Setup

**Android** (Show to users):
1. Open Settings → Apps → Affirmation Alarm
2. Battery → Unrestricted
3. Alarms & Reminders → Allow

**iOS**: No action needed (handled by critical alerts)

## 🧪 Current Implementation Status

### ✅ Fully Implemented
- Complete TypeScript type system
- SQLite database schema with migrations
- Verification engine (Jaccard, Levenshtein, semantic similarity)
- Anti-cheat heuristics (RMS energy, spectral flatness, prosody detection)
- Audio feature extraction (FFT, zero-crossing rate)
- MI onboarding flow (8 steps with sliders and text inputs)
- Goal/Affirmation line generation
- Challenge word system (daily rotation)
- Home screen with streaks
- Alarm trigger UI with waveform visualization
- React Navigation setup

### ⚠️ Native Module Placeholders

The following modules have **working JavaScript interfaces** but need **native iOS/Android implementations**:

#### 1. Speech-to-Text (`src/modules/stt/Transcriber.ts`)
**Current**: Simulated transcription for testing  
**Needed**: 
- iOS: `SFSpeechRecognizer` bridge
- Android: `SpeechRecognizer` API bridge

See: [Native Modules Documentation](#native-modules-implementation)

#### 2. Alarm Scheduling (`src/modules/alarm/AlarmScheduler.ts`)
**Current**: Uses Expo Notifications (local notifications only)  
**Needed**:
- iOS: `UNUserNotificationCenter` with critical alerts + background tasks
- Android: `AlarmManager.setExactAndAllowWhileIdle()` + foreground service

See: [Native Modules Documentation](#native-modules-implementation)

#### 3. Audio Recording (`src/modules/audio/Recorder.ts`)
**Current**: Simulated audio buffer generation  
**Needed**:
- iOS: `AVAudioEngine` + `AVAudioSession`
- Android: `AudioRecord` API

## 🔧 Native Modules Implementation

### iOS Native Module: Speech Recognition

Create `ios/AffirmationAlarm/SpeechRecognizer.swift`:

```swift
import Speech

@objc(SpeechRecognizer)
class SpeechRecognizer: NSObject {
  private var recognitionTask: SFSpeechRecognitionTask?
  private let audioEngine = AVAudioEngine()
  
  @objc
  func startRecognition(_ locale: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { status in
      guard status == .authorized else {
        rejecter("PERMISSION_DENIED", "Speech recognition not authorized", nil)
        return
      }
      
      let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
      let request = SFSpeechAudioBufferRecognitionRequest()
      
      let inputNode = self.audioEngine.inputNode
      let recordingFormat = inputNode.outputFormat(forBus: 0)
      
      inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
        request.append(buffer)
      }
      
      self.audioEngine.prepare()
      try? self.audioEngine.start()
      
      self.recognitionTask = recognizer?.recognitionTask(with: request) { result, error in
        if let result = result {
          // Send transcript back to React Native
          // self.sendEvent(withName: "onTranscript", body: ["transcript": result.bestTranscription.formattedString])
        }
      }
      
      resolver(true)
    }
  }
  
  @objc
  func stopRecognition(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionTask?.cancel()
    resolver(true)
  }
}
```

### Android Native Module: Speech Recognition

Create `android/app/src/main/java/com/affirmationalarm/SpeechRecognizerModule.kt`:

```kotlin
package com.affirmationalarm

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognizerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var speechRecognizer: SpeechRecognizer? = null
    
    override fun getName() = "SpeechRecognizer"
    
    @ReactMethod
    fun startRecognition(locale: String, promise: Promise) {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }
        
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { transcript ->
                    sendEvent("onTranscript", mapOf("transcript" to transcript, "isFinal" to true))
                }
            }
            
            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { transcript ->
                    sendEvent("onTranscript", mapOf("transcript" to transcript, "isFinal" to false))
                }
            }
            
            override fun onError(error: Int) {
                promise.reject("RECOGNITION_ERROR", "Error code: $error")
            }
            
            // Implement other required methods...
        })
        
        speechRecognizer?.startListening(intent)
        promise.resolve(true)
    }
    
    private fun sendEvent(eventName: String, params: Map<String, Any>) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, Arguments.makeNativeMap(params))
    }
}
```

### iOS Alarm Module

Create `ios/AffirmationAlarm/AlarmScheduler.swift`:

```swift
import UserNotifications

@objc(AlarmScheduler)
class AlarmScheduler: NSObject {
  @objc
  func scheduleAlarm(_ alarmId: String, time: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .criticalAlert]) { granted, error in
      guard granted else {
        rejecter("PERMISSION_DENIED", "Notification permission denied", nil)
        return
      }
      
      let content = UNMutableNotificationContent()
      content.title = "Affirmation Alarm"
      content.body = "Time to speak your affirmations!"
      content.sound = UNNotificationSound.defaultCritical
      content.interruptionLevel = .critical
      
      // Parse time and create trigger
      let components = time.split(separator: ":")
      var dateComponents = DateComponents()
      dateComponents.hour = Int(components[0])
      dateComponents.minute = Int(components[1])
      
      let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
      let request = UNNotificationRequest(identifier: alarmId, content: content, trigger: trigger)
      
      UNUserNotificationCenter.current().add(request) { error in
        if let error = error {
          rejecter("SCHEDULE_ERROR", error.localizedDescription, nil)
        } else {
          resolver(alarmId)
        }
      }
    }
  }
}
```

### Android Alarm Module

Create `android/app/src/main/java/com/affirmationalarm/AlarmSchedulerModule.kt`:

```kotlin
package com.affirmationalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.*
import java.util.Calendar

class AlarmSchedulerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "AlarmScheduler"
    
    @ReactMethod
    fun scheduleAlarm(alarmId: String, time: String, promise: Promise) {
        val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        val intent = Intent(reactApplicationContext, AlarmReceiver::class.java).apply {
            putExtra("ALARM_ID", alarmId)
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            reactApplicationContext,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val timeParts = time.split(":")
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, timeParts[0].toInt())
            set(Calendar.MINUTE, timeParts[1].toInt())
            set(Calendar.SECOND, 0)
        }
        
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            pendingIntent
        )
        
        promise.resolve(alarmId)
    }
}
```

## 🗄️ Database Schema

See `src/db/schema.ts` for complete schema. Key tables:

- **user_profiles**: User data and timezone
- **goals**: User goals with barriers and supports
- **affirmations**: Active affirmation lines
- **alarms**: Alarm configuration with verification settings
- **alarm_runs**: Completion history with transcripts and scores
- **streaks**: Current and best streak tracking
- **settings**: App-wide settings (STT mode, similarity threshold)

## 🎨 UI/UX Highlights

- **Wake-Safe Design**: High contrast, huge touch targets, always-on during alarm
- **Progressive Disclosure**: MI onboarding reveals questions gradually
- **Haptic Feedback**: Success/failure confirmation through vibration
- **Accessibility**: All interactive elements have labels, Dynamic Type support
- **Dark Mode**: Alarm screen uses dark background to reduce eye strain

## 🧮 Verification Algorithm

1. **Normalize Transcript**: Lowercase, remove filler words, strip punctuation
2. **Compute Similarity** for each required line:
   - **Jaccard** (30%): Token overlap between expected and actual
   - **Levenshtein** (20%): Character distance ratio
   - **Semantic** (30%): String similarity using `string-similarity` library
   - **Phrase** (20%): Lemmatized key phrase matching
3. **Threshold Check**: Each line must score ≥ 0.72 (configurable in settings)
4. **Challenge Word**: If enabled, must appear in transcript with ≥ 0.9 confidence
5. **Anti-Cheat**: Flag playback if RMS < -30dB or spectral flatness > 0.85

## 🔒 Privacy & Security

- **No Cloud by Default**: All transcription happens on-device
- **No Audio Storage**: Only text transcripts are saved
- **Data Export**: Users can export all data as JSON
- **GDPR Compliant**: Clear purpose statements, opt-in analytics
- **Microphone Usage**: Explicit consent during onboarding

## 📊 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests (when implemented)
npm test
```

### Manual Testing Checklist

- [ ] MI onboarding completes in <5 minutes
- [ ] Goals and affirmations generate correctly
- [ ] Alarm triggers at scheduled time
- [ ] Voice verification accepts genuine speech
- [ ] Voice verification rejects playback (anti-cheat)
- [ ] Streaks increment on successful completion
- [ ] App works completely offline
- [ ] VoiceOver/TalkBack reads all elements

## 🚧 Known Limitations

1. **Native Modules**: STT and alarm scheduling are placeholders
2. **Web Support**: Experimental (limited alarm and audio capabilities)
3. **Offline STT**: Requires device support (iOS 13+, Android 11+)
4. **Battery Optimization**: Users must manually disable on some Android devices

## 🔮 Roadmap

- [ ] Implement native iOS/Android modules
- [ ] Add weekly reflection prompts
- [ ] Smart coach to detect stale goals
- [ ] Apple Health / Google Fit integration
- [ ] Companion Watch app
- [ ] Siri/Assistant shortcuts
- [ ] Localization (ES, FR, DE)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a comprehensive MVP. Key areas for contribution:
- Native module implementation
- Advanced audio analysis
- ML-based semantic similarity
- Additional languages
- UI/UX improvements

## 📧 Support

For issues, questions, or feature requests, please open a GitHub issue.

---

Built with ❤️ using React Native, Expo, and motivational interviewing principles.
