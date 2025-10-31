import { VerificationInput, VerificationResult, CheatFlags } from '../../types';
import { normalizeText } from '../../utils/textNormalization';
import { computeOverallSimilarity } from '../../utils/similarity';

export class Verifier {
  verify(input: VerificationInput): VerificationResult {
    const normalizedTranscript = normalizeText(input.transcript);
    
    const affirmationScores = input.affirmations.map(affirmation =>
      computeOverallSimilarity(affirmation, normalizedTranscript)
    );
    
    const goalScores = input.goals.map(goal =>
      computeOverallSimilarity(goal, normalizedTranscript)
    );
    
    let challengeScore: number | undefined;
    if (input.challengeWord) {
      const challengeWordNormalized = normalizeText(input.challengeWord);
      challengeScore = normalizedTranscript.includes(challengeWordNormalized) ? 1.0 : 0.0;
    }
    
    const affirmationsPassed = affirmationScores.every(
      score => score >= input.thresholds.minSimilarity
    );
    const goalsPassed = goalScores.every(
      score => score >= input.thresholds.minSimilarity
    );
    const challengePassed = input.challengeWord ? (challengeScore ?? 0) >= 0.9 : true;
    
    const overallScore = (
      (affirmationScores.reduce((a, b) => a + b, 0) / Math.max(affirmationScores.length, 1)) * 0.4 +
      (goalScores.reduce((a, b) => a + b, 0) / Math.max(goalScores.length, 1)) * 0.4 +
      (challengeScore ?? 1.0) * 0.2
    );
    
    const passed = affirmationsPassed && goalsPassed && challengePassed;
    
    const cheatFlags: CheatFlags = {
      playback: false,
      lowEnergy: false,
      micLoop: false,
    };
    
    let details = '';
    if (!affirmationsPassed) {
      const failedAffirmations = affirmationScores
        .map((score, i) => ({ score, text: input.affirmations[i] }))
        .filter(a => a.score < input.thresholds.minSimilarity);
      details += `Missing or unclear affirmations: ${failedAffirmations.map(a => a.text).join(', ')}. `;
    }
    if (!goalsPassed) {
      const failedGoals = goalScores
        .map((score, i) => ({ score, text: input.goals[i] }))
        .filter(g => g.score < input.thresholds.minSimilarity);
      details += `Missing or unclear goals: ${failedGoals.map(g => g.text).join(', ')}. `;
    }
    if (!challengePassed) {
      details += `Challenge word '${input.challengeWord}' not detected. `;
    }
    
    return {
      passed,
      scores: {
        affirmations: affirmationScores,
        goals: goalScores,
        challenge: challengeScore,
        overall: overallScore,
      },
      flags: cheatFlags,
      details: details.trim() || 'Verification successful.',
    };
  }
}

export const verifier = new Verifier();
