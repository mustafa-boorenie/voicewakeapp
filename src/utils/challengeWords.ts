import { CHALLENGE_WORDS } from '../constants/copy';

export function getDailyChallengeWord(date: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  
  const index = dayOfYear % CHALLENGE_WORDS.length;
  return CHALLENGE_WORDS[index];
}

export function getRandomChallengeWord(): string {
  const index = Math.floor(Math.random() * CHALLENGE_WORDS.length);
  return CHALLENGE_WORDS[index];
}

export function getChallengeWords(count: number, date?: Date): string[] {
  const words: string[] = [];
  const usedIndices = new Set<number>();
  
  words.push(getDailyChallengeWord(date));
  usedIndices.add(CHALLENGE_WORDS.indexOf(words[0]));
  
  while (words.length < count && usedIndices.size < CHALLENGE_WORDS.length) {
    const index = Math.floor(Math.random() * CHALLENGE_WORDS.length);
    if (!usedIndices.has(index)) {
      words.push(CHALLENGE_WORDS[index]);
      usedIndices.add(index);
    }
  }
  
  return words;
}
