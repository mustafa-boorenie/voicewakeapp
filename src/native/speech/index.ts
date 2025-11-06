import { EmitterSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type SpeechResultEvent = {
  transcript: string;
  isFinal: boolean;
  confidence: number;
};

export type SpeechErrorEvent = {
  message?: string;
};

type SpeechRecognizerNativeModule = {
  ensurePermissions(): Promise<boolean>;
  startRecognition(options?: { language?: string }): Promise<void>;
  stopRecognition(): Promise<{ audioBase64: string; sampleRate: number }>;
  cancelRecognition(): Promise<void>;
};

const SpeechRecognizer = NativeModules.SpeechRecognizer as SpeechRecognizerNativeModule | undefined;

const emitter = SpeechRecognizer
  ? new NativeEventEmitter(NativeModules.SpeechRecognizer)
  : undefined;

export function isSpeechRecognizerAvailable(): boolean {
  return Platform.OS === 'ios' && !!SpeechRecognizer;
}

export function addSpeechResultListener(
  listener: (event: SpeechResultEvent) => void
): EmitterSubscription {
  if (!emitter) {
    return { remove: () => undefined } as EmitterSubscription;
  }
  return emitter.addListener('SpeechRecognizer.onResult', listener);
}

export function addSpeechErrorListener(
  listener: (event: SpeechErrorEvent) => void
): EmitterSubscription {
  if (!emitter) {
    return { remove: () => undefined } as EmitterSubscription;
  }
  return emitter.addListener('SpeechRecognizer.onError', listener);
}

export async function ensureSpeechPermissions(): Promise<boolean> {
  if (!SpeechRecognizer) {
    return false;
  }
  return SpeechRecognizer.ensurePermissions();
}

export async function startSpeechRecognition(options?: { language?: string }): Promise<void> {
  if (!SpeechRecognizer) {
    throw new Error('Speech recognition is not available on this platform');
  }
  await SpeechRecognizer.startRecognition(options ?? {});
}

export async function stopSpeechRecognition(): Promise<{ audioBase64: string; sampleRate: number }> {
  if (!SpeechRecognizer) {
    throw new Error('Speech recognition is not available on this platform');
  }
  return SpeechRecognizer.stopRecognition();
}

export async function cancelSpeechRecognition(): Promise<void> {
  if (!SpeechRecognizer) {
    return;
  }
  await SpeechRecognizer.cancelRecognition();
}

export type { SpeechRecognizerNativeModule };



