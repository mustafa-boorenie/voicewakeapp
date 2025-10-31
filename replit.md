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
**Oct 31, 2025**: Initial project setup
- Created complete React Native app structure
- Implemented database schema with SQLite
- Built verification engine with multi-metric similarity scoring
- Developed anti-cheat heuristics (RMS, spectral flatness, prosody)
- Created MI onboarding flow (8 steps)
- Implemented alarm trigger screen with voice verification
- Added comprehensive README and native modules documentation

## Development Status
### ✅ Completed
- TypeScript type system
- SQLite database schema
- Verification engine (Jaccard, Levenshtein, semantic)
- Anti-cheat heuristics
- Audio feature extraction
- MI onboarding UI
- Home screen with streaks
- Alarm trigger screen
- React Navigation

### ⚠️ Needs Native Implementation
- iOS Speech Recognition (placeholder)
- Android Speech Recognition (placeholder)
- iOS Alarm Scheduling with critical alerts (placeholder)
- Android AlarmManager with foreground service (placeholder)
- Real audio recording (currently simulated)

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

## Next Steps
1. Implement iOS native modules (see NATIVE_MODULES.md)
2. Implement Android native modules (see NATIVE_MODULES.md)
3. Test on physical devices
4. Add weekly reflection prompts
5. Implement smart coach for stale goal detection
