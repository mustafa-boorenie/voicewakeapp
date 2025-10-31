# Affirmation Alarm - Project Documentation

## Project Overview
A React Native mobile alarm app that requires users to speak personalized affirmations and goals aloud before dismissing. Built with motivational interviewing principles, anti-cheat mechanisms, and offline-first architecture.

## Technical Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Navigation**: React Navigation v6
- **Animations**: React Native Reanimated
- **State Management**: React hooks + local database

## Project Structure
```
src/
├── components/        # Reusable UI components
│   └── WaveformDisplay.tsx
├── constants/         # App copy and challenge words
├── db/               # SQLite schema and initialization
├── modules/          # Core business logic
│   ├── alarm/        # Alarm scheduling
│   ├── anticheat/    # Playback detection heuristics
│   ├── audio/        # Audio recording and analysis
│   ├── mi/           # Motivational interviewing
│   ├── stt/          # Speech-to-text
│   └── verify/       # Verification engine
├── navigation/       # React Navigation setup
├── screens/          # App screens
├── types/            # TypeScript definitions
└── utils/            # Helper functions
```

## Recent Changes
**Oct 31, 2025**: Complete MVP Implementation
- ✅ Created complete React Native app structure with TypeScript
- ✅ Implemented full database schema with SQLite (all tables, indexes, foreign keys)
- ✅ Built verification engine with multi-metric similarity scoring (Jaccard, Levenshtein, semantic)
- ✅ Developed anti-cheat heuristics (RMS, spectral flatness, prosody, playback detection)
- ✅ Created MI onboarding flow (8 steps with sliders, text inputs, line generation)
- ✅ Implemented alarm CRUD screens (create, edit, delete with full database integration)
- ✅ Built Goals & Affirmations management screen
- ✅ Created alarm trigger screen with complete voice verification flow
- ✅ Integrated anti-cheat execution (stop recording → extract features → analyze → verify)
- ✅ Implemented date-based streak tracking (increments once per day, resets on missed days)
- ✅ Added database persistence for AlarmRun records with transcripts and cheat flags
- ✅ Added comprehensive accessibility labels to all screens
- ✅ Created complete documentation (README.md, NATIVE_MODULES.md with Swift/Kotlin examples)
- ✅ Set up Metro bundler workflow running on port 5000

## Development Status
### ✅ Completed (100% MVP Feature Complete)
- TypeScript type system with comprehensive types
- SQLite database schema with full CRUD operations
- Verification engine (Jaccard, Levenshtein, semantic similarity)
- Anti-cheat heuristics (RMS energy, spectral flatness, prosody detection)
- Audio feature extraction (FFT, zero-crossing rate)
- MI onboarding UI (8-step progressive disclosure)
- Home screen with date-based streak tracking
- Alarm CRUD screens (create, edit, delete, enable/disable)
- Goals & Affirmations management screen
- Alarm trigger screen with voice verification flow
- React Navigation with all routes
- Database persistence for all user data
- AlarmRun records with transcripts and cheat flags
- Comprehensive accessibility labels
- Complete documentation (README.md, NATIVE_MODULES.md)

### ⚠️ Needs Native Implementation (Per Project Scope)
- iOS Speech Recognition (JavaScript interface ready, Swift code in NATIVE_MODULES.md)
- Android Speech Recognition (JavaScript interface ready, Kotlin code in NATIVE_MODULES.md)
- iOS Alarm Scheduling with critical alerts (JavaScript interface ready, Swift code in NATIVE_MODULES.md)
- Android AlarmManager with foreground service (JavaScript interface ready, Kotlin code in NATIVE_MODULES.md)
- Real audio recording (Feature extraction ready, native capture code in NATIVE_MODULES.md)

## Running the Project
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on web (demo/testing)
npm run web

# Run on iOS/Android (requires native modules)
npm run ios
npm run android
```

## Key Features
1. **Voice Verification**: Multi-metric similarity scoring ensures genuine recitation
2. **Anti-Cheat**: Detects playback through acoustic analysis
3. **Offline-First**: Works completely without network
4. **Accessibility**: Full VoiceOver/TalkBack support
5. **Motivational Interviewing**: Elicits authentic goals and values

## Architecture Decisions
- **Expo**: Simplifies cross-platform development
- **SQLite**: Offline-first data persistence
- **On-Device STT**: Privacy-first, no cloud requirement
- **Modular Design**: Easy to swap implementations

## User Preferences
None yet - first session

## Next Steps for Production Deployment
### Phase 1: Native Module Implementation (Required for Device Testing)
1. **iOS Native Modules** (requires Xcode):
   - Implement `RNSpeechRecognizer.swift` (code in NATIVE_MODULES.md)
   - Implement `RNAlarmScheduler.swift` (code in NATIVE_MODULES.md)
   - Implement audio recording bridge
   - Test with `npx react-native run-ios`

2. **Android Native Modules** (requires Android Studio):
   - Implement `SpeechRecognizerModule.kt` (code in NATIVE_MODULES.md)
   - Implement `AlarmSchedulerModule.kt` (code in NATIVE_MODULES.md)
   - Implement `AlarmReceiver.kt` and `AlarmService.kt`
   - Test with `npx react-native run-android`

### Phase 2: Device Testing & Permissions
3. Test on physical iOS devices (iOS 13+)
4. Test on physical Android devices (Android 12+)
5. Verify all permissions are properly requested
6. Test battery optimization bypass on various manufacturers
7. Test alarm triggering in Doze mode
8. Test STT accuracy with ambient noise

### Phase 3: Enhancements
9. Add weekly reflection prompts
10. Implement smart coach for stale goal detection
11. Add localization (ES, FR, DE)
12. Apple Health / Google Fit integration
13. Companion Watch app
