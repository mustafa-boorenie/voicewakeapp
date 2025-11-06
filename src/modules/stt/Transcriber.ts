import { STTMode } from '../../types';
import {
  addSpeechErrorListener,
  addSpeechResultListener,
  cancelSpeechRecognition,
  ensureSpeechPermissions,
  isSpeechRecognizerAvailable,
  startSpeechRecognition,
  stopSpeechRecognition,
  type SpeechErrorEvent,
  type SpeechResultEvent,
} from '../../native/speech';
import type { EmitterSubscription } from 'react-native';

export interface TranscriberConfig {
  mode: STTMode;
  language: string;
  continuous: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface TranscriptionStopResult {
  audio: Float32Array;
  sampleRate: number;
}

export class Transcriber {
  private config: TranscriberConfig;
  private isTranscribing: boolean = false;
  private resultSubscription?: EmitterSubscription;
  private errorSubscription?: EmitterSubscription;

  constructor(config?: Partial<TranscriberConfig>) {
    this.config = {
      mode: 'onDevice',
      language: 'en-US',
      continuous: false,
      ...config,
    };
  }

  async transcribeStream(
    onResult: (result: TranscriptionResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!isSpeechRecognizerAvailable()) {
      throw new Error('Speech recognition is not available on this platform');
    }

    const granted = await ensureSpeechPermissions();
    if (!granted) {
      throw new Error('Required speech recognition permissions not granted');
    }

    this.cleanupSubscriptions();

    this.resultSubscription = addSpeechResultListener((event: SpeechResultEvent) => {
      onResult({
        transcript: event.transcript,
        confidence: event.confidence,
        isFinal: event.isFinal,
      });
    });

    this.errorSubscription = addSpeechErrorListener((event: SpeechErrorEvent) => {
      if (!event?.message) {
        onError(new Error('Speech recognition error'));
        return;
      }
      onError(new Error(event.message));
    });

    this.isTranscribing = true;

    try {
      await startSpeechRecognition({ language: this.config.language });
    } catch (error) {
      this.isTranscribing = false;
      onError(error as Error);
    }
  }

  async stop(): Promise<TranscriptionStopResult | null> {
    this.isTranscribing = false;
    this.cleanupSubscriptions();

    if (!isSpeechRecognizerAvailable()) {
      return null;
    }

    const result = await stopSpeechRecognition();
    const audio = decodeBase64ToFloat32(result.audioBase64);
    return {
      audio,
      sampleRate: result.sampleRate,
    };
  }

  getAvailableLanguages(): string[] {
    return [
      'en-US',
      'es-ES',
      'fr-FR',
      'de-DE',
      'it-IT',
      'pt-BR',
      'zh-CN',
      'ja-JP',
      'ko-KR',
    ];
  }

  async cancel(): Promise<void> {
    this.isTranscribing = false;
    this.cleanupSubscriptions();
    await cancelSpeechRecognition();
  }

  private cleanupSubscriptions() {
    this.resultSubscription?.remove();
    this.errorSubscription?.remove();
    this.resultSubscription = undefined;
    this.errorSubscription = undefined;
  }
}

export const transcriber = new Transcriber();

function decodeBase64ToFloat32(base64: string): Float32Array {
  if (!base64) {
    return new Float32Array();
  }

  if (typeof globalThis.Buffer !== 'undefined') {
    const buffer = globalThis.Buffer.from(base64, 'base64');
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const floatCount = buffer.length / Float32Array.BYTES_PER_ELEMENT;
    return new Float32Array(arrayBuffer, 0, floatCount);
  }

  const binaryString = typeof globalThis.atob === 'function' ? globalThis.atob(base64) : '';
  if (!binaryString) {
    return new Float32Array();
  }

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const floatCount = arrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT;
  return new Float32Array(arrayBuffer, 0, floatCount);
}
