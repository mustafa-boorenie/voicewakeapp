import { distance } from 'fastest-levenshtein';
import { compareTwoStrings } from 'string-similarity';
import { tokenize, extractKeyPhrases } from './textNormalization';

export function jaccardSimilarity(set1: string[], set2: string[]): number {
  const s1 = new Set(set1);
  const s2 = new Set(set2);
  
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function levenshteinRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const dist = distance(str1, str2);
  return 1 - (dist / maxLen);
}

export function semanticSimilarity(str1: string, str2: string): number {
  return compareTwoStrings(str1.toLowerCase(), str2.toLowerCase());
}

export function computeOverallSimilarity(
  expected: string,
  actual: string
): number {
  const normalizedExpected = expected.toLowerCase().trim();
  const normalizedActual = actual.toLowerCase().trim();
  
  const tokenSimilarity = jaccardSimilarity(
    tokenize(normalizedExpected),
    tokenize(normalizedActual)
  );
  
  const charSimilarity = levenshteinRatio(
    normalizedExpected,
    normalizedActual
  );
  
  const semanticScore = semanticSimilarity(
    normalizedExpected,
    normalizedActual
  );
  
  const phraseSimilarity = jaccardSimilarity(
    extractKeyPhrases(normalizedExpected),
    extractKeyPhrases(normalizedActual)
  );
  
  return (
    tokenSimilarity * 0.3 +
    charSimilarity * 0.2 +
    semanticScore * 0.3 +
    phraseSimilarity * 0.2
  );
}
