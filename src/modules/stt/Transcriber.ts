import { STTMode } from '../../types';
import * as Speech from 'expo-speech';

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

export class Transcriber {
  private config: TranscriberConfig;
  private isTranscribing: boolean = false;

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
    this.isTranscribing = true;

    try {
      console.log('Starting speech-to-text transcription...');
      console.log('Mode:', this.config.mode);
      console.log('Language:', this.config.language);
      
      await this.simulateTranscription(onResult);
      
    } catch (error) {
      this.isTranscribing = false;
      onError(error as Error);
    }
  }

  async stop(): Promise<void> {
    this.isTranscribing = false;
    console.log('Transcription stopped');
  }

  private async simulateTranscription(
    onResult: (result: TranscriptionResult) => void
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onResult({
      transcript: 'I keep promises to myself',
      confidence: 0.92,
      isFinal: false,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onResult({
      transcript: 'I make progress even when it is hard',
      confidence: 0.89,
      isFinal: false,
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onResult({
      transcript: 'I keep promises to myself I make progress even when it is hard',
      confidence: 0.91,
      isFinal: true,
    });
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
}

export const transcriber = new Transcriber();
