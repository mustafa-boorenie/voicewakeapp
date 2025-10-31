export const COPY = {
  WAKE_PROMPTS: {
    GREETING: "Good morning. Say your affirmations now.",
    GOALS: "Now say your goals.",
    WITH_CHALLENGE: (word: string) => `Now say your goals. Include the word '${word}'.`,
    ENCOURAGER: "Nice—last one, keep going.",
    SUCCESS: "Done. You kept your promise today.",
    RETRY: "Almost there. Let's try that again.",
    FAIL: "Having trouble? We can adjust your lines or the sensitivity.",
  },
  
  MI_ONBOARDING: {
    WELCOME: "Welcome! Let's discover what you truly want to achieve.",
    MEANINGFUL_CHANGE: "What's one meaningful change you want this month?",
    IMPORTANCE_SCALE: "How important is this to you, on a scale of 0 to 10?",
    IMPORTANCE_FOLLOWUP: (score: number) => `You said ${score}. Why not lower? What makes this important?`,
    CONFIDENCE_SCALE: "How confident are you that you can achieve this, 0 to 10?",
    CONFIDENCE_FOLLOWUP: "What would move you up one point on confidence?",
    PERFECT_FUTURE: "If things went perfectly in 90 days, what's different in your life?",
    BARRIERS: "What gets in the way of making this change?",
    SUPPORTS: "Who or what helps you when you're trying to improve?",
    SUMMARY: "Here's what I heard. Does this capture your goals?",
    GENERATE_LINES: "I've created your personal Goal Lines and Affirmation Lines. Feel free to edit them.",
    PRIVACY: "We'll need microphone access each morning to verify you've spoken these aloud. Your audio is never stored—only the text transcript for verification.",
  },
  
  PERMISSIONS: {
    MICROPHONE_TITLE: "Microphone Access Required",
    MICROPHONE_MESSAGE: "This app needs microphone access to verify your spoken affirmations each morning. Audio is processed on-device and never stored.",
    NOTIFICATIONS_TITLE: "Notification Permission",
    NOTIFICATIONS_MESSAGE: "Allow notifications to receive your morning alarms.",
    EXACT_ALARMS_TITLE: "Exact Alarm Permission",
    EXACT_ALARMS_MESSAGE: "This app needs permission to schedule exact alarms to wake you at your chosen time.",
    BATTERY_TITLE: "Battery Optimization",
    BATTERY_MESSAGE: "Please disable battery optimization for this app to ensure alarms work reliably.",
  },
  
  ERRORS: {
    MIC_DENIED: "Microphone access is required. Please enable it in Settings to continue.",
    STT_FAILED: "Speech recognition failed. Please try again.",
    PLAYBACK_DETECTED: "Playback detected. Please speak the words yourself.",
    LOW_ENERGY: "Unable to detect clear speech. Please speak louder.",
    CHALLENGE_MISSING: "Challenge word not detected. Please include it.",
  },
};

export const CHALLENGE_WORDS = [
  'sunrise', 'gratitude', 'strength', 'courage', 'clarity',
  'focus', 'energy', 'balance', 'purpose', 'growth',
  'kindness', 'wisdom', 'patience', 'determination', 'peace',
  'joy', 'hope', 'resilience', 'confidence', 'commitment',
];
