// Adapted from Ansolari; extraction details: docs/PROVENANCE.md.
const WEEKDAYS: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

const MONTHS: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

const FRENCH_DAYS: Record<string, number> = {
  premier: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  'dix sept': 17,
  'dix huit': 18,
  'dix neuf': 19,
  vingt: 20,
  'vingt et un': 21,
  'vingt deux': 22,
  'vingt trois': 23,
  'vingt quatre': 24,
  'vingt cinq': 25,
  'vingt six': 26,
  'vingt sept': 27,
  'vingt huit': 28,
  'vingt neuf': 29,
  trente: 30,
  'trente et un': 31,
};

export function resolvePreferredDate(value: string, now = new Date()): string {
  const isoDate = value.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
  if (isoDate) return isoDate;

  const normalized = normalizeFrench(value);
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (
    normalized.includes("aujourd'hui") ||
    normalized.includes('aujourd’hui')
  ) {
    return formatDate(date);
  }
  if (normalized.includes('demain')) {
    date.setDate(date.getDate() + 1);
    return formatDate(date);
  }
  const spokenDate = parseFrenchCalendarDate(normalized, date);
  if (spokenDate) return formatDate(spokenDate);
  const weekday = Object.entries(WEEKDAYS).find(([name]) =>
    normalized.includes(name),
  )?.[1];
  if (weekday === undefined)
    throw new Error('Date non reconnue, préciser un jour ou une date');
  date.setDate(date.getDate() + ((weekday - date.getDay() + 7) % 7 || 7));
  return formatDate(date);
}

function parseFrenchCalendarDate(
  normalized: string,
  today: Date,
): Date | undefined {
  let numericValue = normalized;
  for (const [words, day] of Object.entries(FRENCH_DAYS).sort(
    ([left], [right]) => right.length - left.length,
  )) {
    numericValue = numericValue.replace(
      new RegExp(`\\b${words.replaceAll(' ', '\\s+')}\\b`, 'g'),
      String(day),
    );
  }
  const match = numericValue.match(
    /\b(\d{1,2})(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)(?:\s+(\d{4}))?\b/,
  );
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = MONTHS[match[2]];
  const explicitYear = match[3] ? Number(match[3]) : undefined;
  let year = explicitYear ?? today.getFullYear();
  let result = new Date(year, month, day);
  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month ||
    result.getDate() !== day
  ) {
    throw new Error('Date invalide');
  }
  if (!explicitYear && result < today) {
    year += 1;
    result = new Date(year, month, day);
  }
  return result;
}

function normalizeFrench(value: string): string {
  return value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‐‑‒–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function zonedDateTime(
  date: string,
  time: string,
  timeZone: string,
): string {
  return `${date}T${time}:00${getTimeZoneOffset(date, timeZone)}`;
}

export function formatInstantInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return zonedDateTime(parts.slice(0, 10), parts.slice(11, 16), timeZone);
}

function formatDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getTimeZoneOffset(date: string, timeZone: string): string {
  const zoneName = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((part) => part.type === 'timeZoneName')?.value;
  return zoneName?.replace('UTC', '') || '+00:00';
}
