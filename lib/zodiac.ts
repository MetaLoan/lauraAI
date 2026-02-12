const SIGN_TO_GLYPH: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

// Legacy one-letter codes from older zodiac font mapping.
const LEGACY_CODE_TO_SIGN: Record<string, string> = {
  A: 'Aries',
  B: 'Taurus',
  C: 'Capricorn',
  D: 'Aquarius',
  E: 'Gemini',
  F: 'Pisces',
  G: 'Cancer',
  H: 'Leo',
  I: 'Virgo',
  J: 'Libra',
  K: 'Scorpio',
  L: 'Sagittarius',
};

function normalizeSignKey(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.length === 1) {
    return LEGACY_CODE_TO_SIGN[raw.toUpperCase()] ?? null;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function getZodiacGlyph(sign: string | undefined): string | null {
  if (!sign || typeof sign !== 'string') return null;
  const normalized = normalizeSignKey(sign);
  if (!normalized) return null;
  return SIGN_TO_GLYPH[normalized] ?? null;
}
