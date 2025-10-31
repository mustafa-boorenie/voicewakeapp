const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean',
  'sort of', 'kind of', 'basically', 'actually', 'literally'
];

const COMMON_ARTICLES = ['a', 'an', 'the'];

export function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ');
  
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });
  
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(token => token.length > 0 && !COMMON_ARTICLES.includes(token));
}

export function lemmatizeSimple(word: string): string {
  const rules: [RegExp, string][] = [
    [/ies$/, 'y'],
    [/ves$/, 'f'],
    [/oes$/, 'o'],
    [/ses$/, 's'],
    [/shes$/, 'sh'],
    [/ches$/, 'ch'],
    [/xes$/, 'x'],
    [/zes$/, 'z'],
    [/ied$/, 'y'],
    [/ing$/, ''],
    [/ed$/, ''],
    [/s$/, ''],
  ];
  
  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }
  
  return word;
}

export function extractKeyPhrases(text: string): string[] {
  const tokens = tokenize(text);
  return tokens.map(lemmatizeSimple);
}
