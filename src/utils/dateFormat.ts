const MONTHS_SHORT_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

const MONTHS_GENITIVE_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const;

const MONTHS_NOMINATIVE_RU = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
] as const;

interface ParsedReleaseDate {
  year: number;
  month: number | null;
  day: number | null;
}

/**
 * Разбирает строку даты TMDB формата YYYY-MM-DD (или YYYY-MM / YYYY)
 * напрямую по компонентам без использования local timezone в new Date(string),
 * что полностью исключает смещение дня из-за часового пояса и Invalid Date.
 */
export function parseTmdbReleaseDate(
  rawDate: string | null | undefined
): ParsedReleaseDate | null {
  if (typeof rawDate !== 'string') {
    return null;
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  if (!Number.isInteger(year) || year < 1880 || year > 2100) {
    return null;
  }

  if (!match[2]) {
    return { year, month: null, day: null };
  }

  const month = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { year, month: null, day: null };
  }

  if (!match[3]) {
    return { year, month, day: null };
  }

  const day = Number(match[3]);
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return { year, month, day: null };
  }

  // Проверка календарной корректности дня месяца в UTC
  const utcCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    utcCheck.getUTCFullYear() !== year ||
    utcCheck.getUTCMonth() !== month - 1 ||
    utcCheck.getUTCDate() !== day
  ) {
    return { year, month, day: null };
  }

  return { year, month, day };
}

/**
 * Компактный формат даты для карточек, например «7 ноя 2014».
 * Если известен только месяц и год — «ноя 2014», если только год — «2014».
 */
export function formatCompactReleaseDate(
  rawDate: string | null | undefined
): string | null {
  const parsed = parseTmdbReleaseDate(rawDate);
  if (!parsed) {
    return null;
  }

  const { year, month, day } = parsed;
  if (month !== null && day !== null) {
    return `${day} ${MONTHS_SHORT_RU[month - 1]} ${year}`;
  }
  if (month !== null) {
    return `${MONTHS_SHORT_RU[month - 1]} ${year}`;
  }
  return String(year);
}

/**
 * Полный формат даты для страницы фильма, например «7 ноября 2014 года».
 * Если известен только месяц и год — «ноябрь 2014 года», если только год — «2014 год».
 */
export function formatFullReleaseDate(
  rawDate: string | null | undefined
): string | null {
  const parsed = parseTmdbReleaseDate(rawDate);
  if (!parsed) {
    return null;
  }

  const { year, month, day } = parsed;
  if (month !== null && day !== null) {
    return `${day} ${MONTHS_GENITIVE_RU[month - 1]} ${year} года`;
  }
  if (month !== null) {
    return `${MONTHS_NOMINATIVE_RU[month - 1]} ${year} года`;
  }
  return `${year} год`;
}

/**
 * Форматирует длительность фильма из минут в читаемую строку, например «169 мин. (2 ч 49 мин)».
 */
export function formatRuntimeMinutes(
  runtime: number | null | undefined
): string | null {
  if (
    typeof runtime !== 'number' ||
    !Number.isFinite(runtime) ||
    runtime <= 0
  ) {
    return null;
  }

  const totalMinutes = Math.round(runtime);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${totalMinutes} мин.`;
  }
  if (minutes === 0) {
    return `${totalMinutes} мин. (${hours} ч)`;
  }
  return `${totalMinutes} мин. (${hours} ч ${minutes} мин)`;
}
