/**
 * Map astro sign names to MF Zodiac Dings font glyphs.
 * Verified against font chart: A=Aries, B=Taurus, C=Capricorn, D=Aquarius,
 * E=Gemini, F=Pisces, G=Cancer, H=Leo, I=Virgo, J=Libra, K=Scorpio, L=Sagittarius.
 */
const SIGN_TO_GLYPH: Record<string, string> = {
  Aries: 'A',
  Taurus: 'B',
  Capricorn: 'C',
  Aquarius: 'D',
  Gemini: 'E',
  Pisces: 'F',
  Cancer: 'G',
  Leo: 'H',
  Virgo: 'I',
  Libra: 'J',
  Scorpio: 'K',
  Sagittarius: 'L',
};

export function getZodiacGlyph(sign: string | undefined): string | null {
  if (!sign || typeof sign !== 'string') return null;
  const key = sign.trim();
  return SIGN_TO_GLYPH[key] ?? SIGN_TO_GLYPH[key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()] ?? null;
}
