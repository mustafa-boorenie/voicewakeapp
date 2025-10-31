import { AudioFeatures } from '../../types';
import { antiCheatHeuristics } from '../anticheat/Heuristics';

export interface RecordingConfig {
  sampleRate: number;
  channels: number;
  enableFeatureExtraction: boolean;
}

export class AudioRecorder {
  private isRecording: boolean = false;
  private audioBuffer: Float32Array = new Float32Array(0);
  private config: RecordingConfig;

  constructor(config?: Partial<RecordingConfig>) {
    this.config = {
      sampleRate: 44100,
      channels: 1,
      enableFeatureExtraction: true,
      ...config,
    };
  }

  async start(): Promise<void> {
    this.isRecording = true;
    this.audioBuffer = new Float32Array(0);
    console.log('Audio recording started');
  }

  async stop(): Promise<Float32Array> {
    this.isRecording = false;
    console.log('Audio recording stopped');
    return this.audioBuffer;
  }

  getAudioFeatures(audioBuffer?: Float32Array): AudioFeatures {
    const buffer = audioBuffer || this.audioBuffer;
    
    if (buffer.length === 0) {
      return {
        rmsEnergy: -Infinity,
        spectralFlatness: 0,
        zeroCrossingRate: 0,
        hasHumanProsody: false,
      };
    }

    const rmsEnergy = antiCheatHeuristics.computeRMSEnergy(buffer);
    const zeroCrossingRate = antiCheatHeuristics.computeZeroCrossingRate(buffer);
    
    const magnitudeSpectrum = this.computeFFT(buffer);
    const spectralFlatness = antiCheatHeuristics.computeSpectralFlatness(magnitudeSpectrum);
    
    const hasHumanProsody = antiCheatHeuristics.detectHumanProsody(
      buffer,
      this.config.sampleRate
    );

    return {
      rmsEnergy,
      spectralFlatness,
      zeroCrossingRate,
      hasHumanProsody,
    };
  }

  private computeFFT(audioBuffer: Float32Array): Float32Array {
    const n = audioBuffer.length;
    const halfN = Math.floor(n / 2);
    const magnitudes = new Float32Array(halfN);
    
    for (let k = 0; k < halfN; k++) {
      let real = 0;
      let imag = 0;
      
      for (let t = 0; t < n; t++) {
        const angle = (-2 * Math.PI * k * t) / n;
        real += audioBuffer[t] * Math.cos(angle);
        imag += audioBuffer[t] * Math.sin(angle);
      }
      
      magnitudes[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return magnitudes;
  }

  simulateRecording(duration: number): Float32Array {
    const numSamples = Math.floor(this.config.sampleRate * duration);
    const buffer = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      buffer[i] = (Math.random() - 0.5) * 0.1;
      
      if (i % 4410 < 2205) {
        buffer[i] += Math.sin(2 * Math.PI * 200 * i / this.config.sampleRate) * 0.3;
      }
    }
    
    return buffer;
  }
}

export const audioRecorder = new AudioRecorder();
