export interface UserProfile {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  text: string;
  why: string;
  barriers: string[];
  supports: string[];
  lastEditedAt: string;
}

export interface Affirmation {
  id: string;
  userId: string;
  text: string;
  active: boolean;
  lastEditedAt: string;
}

export interface Alarm {
  id: string;
  label: string;
  timeLocal: string;
  daysOfWeek: number[];
  volume: number;
  toneUri: string;
  vibrate: boolean;
  maxSnoozes: number;
  snoozeLengthMin: number;
  requireAffirmations: boolean;
  requireGoals: boolean;
  randomChallenge: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface SimilarityScores {
  affirmations: number;
  goals: number;
  challenge: number;
}

export interface CheatFlags {
  playback: boolean;
  lowEnergy: boolean;
  micLoop: boolean;
}

export interface AlarmRun {
  id: string;
  alarmId: string;
  firedAt: string;
  dismissedAt: string | null;
  snoozesUsed: number;
  success: boolean;
  transcriptJson: string;
  similarityScores: SimilarityScores;
  cheatFlags: CheatFlags;
}

export interface Streaks {
  id: string;
  userId: string;
  current: number;
  best: number;
  updatedAt: string;
}

export type STTMode = 'onDevice' | 'cloudFallback';

export interface Settings {
  id: string;
  sttMode: STTMode;
  challengeWordCount: number;
  minSimilarity: number;
  ambientThresholdDb: number;
}

export interface VerificationInput {
  transcript: string;
  goals: string[];
  affirmations: string[];
  challengeWord?: string;
  thresholds: {
    minSimilarity: number;
  };
}

export interface VerificationResult {
  passed: boolean;
  scores: {
    affirmations: number[];
    goals: number[];
    challenge?: number;
    overall: number;
  };
  flags: CheatFlags;
  details: string;
}

export interface AudioFeatures {
  rmsEnergy: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  hasHumanProsody: boolean;
}

export interface MIOnboardingData {
  meaningfulChange: string;
  importanceScore: number;
  confidenceScore: number;
  perfectFuture: string;
  barriers: string[];
  supports: string[];
  goalLines: string[];
  affirmationLines: string[];
}
