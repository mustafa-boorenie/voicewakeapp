import { AudioFeatures, CheatFlags } from '../../types';

export class AntiCheatHeuristics {
  private previousTranscripts: Map<string, string[]> = new Map();
  private readonly ENERGY_THRESHOLD = -30.0;
  private readonly FLATNESS_THRESHOLD = 0.85;
  private readonly MIN_PROSODY_VARIANCE = 0.1;

  analyzeAudioFeatures(features: AudioFeatures): CheatFlags {
    const flags: CheatFlags = {
      playback: false,
      lowEnergy: false,
      micLoop: false,
    };

    if (features.rmsEnergy < this.ENERGY_THRESHOLD) {
      flags.lowEnergy = true;
    }

    if (features.spectralFlatness > this.FLATNESS_THRESHOLD) {
      flags.playback = true;
    }

    if (features.zeroCrossingRate > 0.3 && features.zeroCrossingRate < 0.4) {
      flags.micLoop = true;
    }

    if (!features.hasHumanProsody) {
      flags.playback = true;
    }

    return flags;
  }

  checkDuplicateTranscript(userId: string, transcript: string): boolean {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const userHistory = this.previousTranscripts.get(userId) || [];
    
    const isDuplicate = userHistory.some(
      prev => prev === normalizedTranscript
    );
    
    if (isDuplicate) {
      return true;
    }
    
    userHistory.push(normalizedTranscript);
    if (userHistory.length > 7) {
      userHistory.shift();
    }
    this.previousTranscripts.set(userId, userHistory);
    
    return false;
  }

  computeRMSEnergy(audioBuffer: Float32Array): number {
    const sumSquares = audioBuffer.reduce((sum, sample) => sum + sample * sample, 0);
    const rms = Math.sqrt(sumSquares / audioBuffer.length);
    return 20 * Math.log10(rms + 1e-10);
  }

  computeSpectralFlatness(magnitudeSpectrum: Float32Array): number {
    const geometricMean = this.geometricMean(magnitudeSpectrum);
    const arithmeticMean = this.arithmeticMean(magnitudeSpectrum);
    
    if (arithmeticMean === 0) return 0;
    return geometricMean / arithmeticMean;
  }

  computeZeroCrossingRate(audioBuffer: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < audioBuffer.length; i++) {
      if ((audioBuffer[i] >= 0 && audioBuffer[i - 1] < 0) ||
          (audioBuffer[i] < 0 && audioBuffer[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (audioBuffer.length - 1);
  }

  detectHumanProsody(audioBuffer: Float32Array, sampleRate: number): boolean {
    const frameSize = Math.floor(sampleRate * 0.02);
    const numFrames = Math.floor(audioBuffer.length / frameSize);
    
    if (numFrames < 5) return false;
    
    const frameEnergies: number[] = [];
    for (let i = 0; i < numFrames; i++) {
      const frameStart = i * frameSize;
      const frameEnd = Math.min(frameStart + frameSize, audioBuffer.length);
      const frame = audioBuffer.slice(frameStart, frameEnd);
      frameEnergies.push(this.computeRMSEnergy(frame));
    }
    
    const energyVariance = this.variance(frameEnergies);
    const hasGaps = frameEnergies.some((energy, i) => {
      if (i === 0) return false;
      return Math.abs(energy - frameEnergies[i - 1]) > 10;
    });
    
    return energyVariance > this.MIN_PROSODY_VARIANCE && hasGaps;
  }

  private geometricMean(values: Float32Array): number {
    const logSum = values.reduce((sum, val) => sum + Math.log(val + 1e-10), 0);
    return Math.exp(logSum / values.length);
  }

  private arithmeticMean(values: Float32Array): number {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  private variance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
}

export const antiCheatHeuristics = new AntiCheatHeuristics();
