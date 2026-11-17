// Bare "gunung"/"kebakaran" used to match place names (Gunung Sahari, Sinabung)
// and house fires, so only unambiguous natural-disaster terms are accepted.
const RULES: Array<[RegExp, string]> = [
  [/\bgempa\b|\btsunami\b/i, 'EARTHQUAKE'],
  [/\bbanjir\b/i, 'FLOOD'],
  [/\blongsor\b/i, 'LANDSLIDE'],
  [/\berupsi\b|\bletusan\b|\bvulkanik\b|gunung api|status (siaga|awas)/i, 'VOLCANO'],
  [/\bkarhutla\b|kebakaran (hutan|lahan)/i, 'WILDFIRE'],
  [/\bputing beliung\b|\bbadai tropis\b|\bgelombang tinggi\b|cuaca ekstrem/i, 'WEATHER'],
  [/\bkekeringan\b|\babrasi\b/i, 'OTHER'],
];

export function categoryFor(title: string, summary: string): string | null {
  const text = `${title} ${summary}`;
  for (const [pattern, category] of RULES) {
    if (pattern.test(text)) return category;
  }
  return null;
}
