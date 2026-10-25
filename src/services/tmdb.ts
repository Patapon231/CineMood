import {
  formatCompactReleaseDate,
  formatFullReleaseDate,
  formatRuntimeMinutes,
  parseTmdbReleaseDate,
} from '../utils/dateFormat';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const DEFAULT_LANGUAGE = 'ru-RU';

export type TmdbImageSize =
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'w1280'
  | 'original';

export type TmdbErrorCode =
  | 'MISSING_API_KEY'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'INVALID_RESPONSE';

export interface TmdbMovieRaw {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  adult?: boolean;
  original_language?: string;
  video?: boolean;
}

export interface TmdbMovie extends TmdbMovieRaw {
  releaseYear: string | null;
  compactReleaseDate: string | null;
  fullReleaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
}

export interface TmdbMovieDetails extends TmdbMovie {
  genres: TmdbGenre[];
  runtime: number | null;
  formattedRuntime: string | null;
  tagline: string;
  directors: string[];
  cast: TmdbCastMember[];
  countries: string[];
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMoviesResult {
  movies: TmdbMovie[];
  page: number;
  totalPages: number;
  totalResults: number;
  isEmpty: boolean;
  emptyMessage: string | null;
  /**
   * Указывает, что взвешенная сортировка по рейтингу (формула Байеса)
   * применена на клиенте к загруженной странице выборки, так как TMDB API v3
   * не поддерживает сортировку по взвешенной формуле на стороне сервера.
   */
  isSampleWeightedSort?: boolean;
}

export interface TmdbRequestOptions {
  page?: number;
  language?: string;
  signal?: AbortSignal;
}

export type TmdbSortBy =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc';

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCatalogParams extends TmdbRequestOptions {
  query?: string;
  genreId?: number | null;
  year?: number | null;
  sortBy?: TmdbSortBy;
}

export const FALLBACK_TMDB_GENRES: TmdbGenre[] = [
  { id: 18, name: 'Драма' },
  { id: 35, name: 'Комедия' },
  { id: 53, name: 'Триллер' },
  { id: 878, name: 'Фантастика' },
  { id: 10749, name: 'Мелодрама' },
  { id: 9648, name: 'Детектив' },
  { id: 80, name: 'Криминал' },
  { id: 12, name: 'Приключения' },
  { id: 14, name: 'Фэнтези' },
  { id: 27, name: 'Ужасы' },
  { id: 16, name: 'Мультфильм' },
  { id: 36, name: 'История' },
  { id: 99, name: 'Документальный' },
  { id: 10402, name: 'Музыка' },
  { id: 10751, name: 'Семейный' },
  { id: 28, name: 'Боевик' },
  { id: 37, name: 'Вестерн' },
  { id: 10752, name: 'Военный' },
];

let cachedGenres: TmdbGenre[] | null = null;

interface TmdbErrorPayload {
  status_code?: number;
  status_message?: string;
  success?: boolean;
}

export class TmdbServiceError extends Error {
  readonly code: TmdbErrorCode;
  readonly status?: number;

  constructor(message: string, code: TmdbErrorCode, status?: number) {
    super(message);
    this.name = 'TmdbServiceError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Формирует полный URL изображения TMDB (постера или фонового кадра).
 */
export function getTmdbImageUrl(
  path: string | null | undefined,
  size: TmdbImageSize = 'w500'
): string | null {
  if (!path) {
    return null;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`;
}

/**
 * Безопасно считывает ключ TMDB из переменных окружения Vite,
 * никогда не выводя его значение в консоль или текст ошибки.
 */
function getApiKey(): string {
  const rawKey = import.meta.env.VITE_TMDB_API_KEY;
  const trimmedKey = typeof rawKey === 'string' ? rawKey.trim() : '';

  if (!trimmedKey) {
    throw new TmdbServiceError(
      'Не найден ключ доступа TMDB API. Убедитесь, что переменная VITE_TMDB_API_KEY задана в файле .env.local и сервер разработки перезапущен.',
      'MISSING_API_KEY'
    );
  }

  return trimmedKey;
}

/**
 * Преобразует сырой объект фильма TMDB в удобный типизированный формат.
 */
function normalizeMovie(raw: TmdbMovieRaw): TmdbMovie {
  const releaseDate = raw.release_date?.trim() ?? '';
  const parsedDate = parseTmdbReleaseDate(releaseDate);
  const releaseYear = parsedDate ? String(parsedDate.year) : null;

  return {
    ...raw,
    title: raw.title || raw.original_title || 'Без названия',
    original_title: raw.original_title || raw.title || '',
    overview: raw.overview || '',
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    release_date: releaseDate,
    releaseYear,
    compactReleaseDate: formatCompactReleaseDate(releaseDate),
    fullReleaseDate: formatFullReleaseDate(releaseDate),
    posterUrl: getTmdbImageUrl(raw.poster_path, 'w500'),
    backdropUrl: getTmdbImageUrl(raw.backdrop_path, 'w1280'),
  };
}

/**
 * Выполняет типизированный GET-запрос к TMDB API v3 с обработкой ошибок сети и HTTP.
 */
async function requestTmdb<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal
): Promise<T> {
  const apiKey = getApiKey();
  const isBearerToken = apiKey.startsWith('eyJ');

  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;
  const url = new URL(`${TMDB_API_BASE_URL}${normalizedEndpoint}`);

  if (!isBearerToken) {
    url.searchParams.set('api_key', apiKey);
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (isBearerToken) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new TmdbServiceError(
      'Не удалось подключиться к серверу TMDB. Проверьте соединение с интернетом или доступность сервиса.',
      'NETWORK_ERROR'
    );
  }

  if (!response.ok) {
    let apiDetails = '';
    try {
      const errorBody = (await response.json()) as TmdbErrorPayload;
      if (errorBody?.status_message) {
        apiDetails = ` (${errorBody.status_message})`;
      }
    } catch {
      // Игнорируем ошибку парсинга тела при нестандартном ответе
    }

    if (response.status === 401 || response.status === 403) {
      throw new TmdbServiceError(
        `Ошибка авторизации TMDB API (${response.status}). Проверьте корректность ключа VITE_TMDB_API_KEY в .env.local.`,
        'UNAUTHORIZED',
        response.status
      );
    }

    if (response.status === 404) {
      throw new TmdbServiceError(
        `Запрашиваемый раздел TMDB API не найден (404)${apiDetails}.`,
        'NOT_FOUND',
        response.status
      );
    }

    if (response.status === 429) {
      throw new TmdbServiceError(
        'Превышен лимит запросов к TMDB API (429). Пожалуйста, подождите немного и повторите попытку.',
        'RATE_LIMIT',
        response.status
      );
    }

    throw new TmdbServiceError(
      `Ошибка при запросе к TMDB API (статус ${response.status})${apiDetails}.`,
      'API_ERROR',
      response.status
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TmdbServiceError(
      'Получен некорректный формат данных от TMDB API.',
      'INVALID_RESPONSE',
      response.status
    );
  }
}

/**
 * Поиск фильмов по названию через TMDB API v3 (/search/movie).
 */
export async function searchMovies(
  query: string,
  options: TmdbRequestOptions = {}
): Promise<TmdbMoviesResult> {
  const normalizedQuery = query.trim();
  const page = options.page && options.page > 0 ? Math.floor(options.page) : 1;
  const language = options.language ?? DEFAULT_LANGUAGE;

  if (!normalizedQuery) {
    return {
      movies: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      isEmpty: true,
      emptyMessage: 'Введите название фильма для начала поиска.',
    };
  }

  const data = await requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
    '/search/movie',
    {
      query: normalizedQuery,
      page,
      language,
      include_adult: false,
    },
    options.signal
  );

  const rawResults = Array.isArray(data.results) ? data.results : [];
  const movies = rawResults.map(normalizeMovie);
  const isEmpty = movies.length === 0;

  return {
    movies,
    page: data.page ?? page,
    totalPages: data.total_pages ?? 0,
    totalResults: data.total_results ?? movies.length,
    isEmpty,
    emptyMessage: isEmpty
      ? `По запросу «${normalizedQuery}» фильмы не найдены. Попробуйте изменить формулировку или ввести оригинальное название.`
      : null,
  };
}

/**
 * Получение списка популярных фильмов через TMDB API v3 (/movie/popular).
 */
export async function getPopularMovies(
  options: TmdbRequestOptions = {}
): Promise<TmdbMoviesResult> {
  const page = options.page && options.page > 0 ? Math.floor(options.page) : 1;
  const language = options.language ?? DEFAULT_LANGUAGE;

  const data = await requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
    '/movie/popular',
    {
      page,
      language,
    },
    options.signal
  );

  const rawResults = Array.isArray(data.results) ? data.results : [];
  const movies = rawResults.map(normalizeMovie);
  const isEmpty = movies.length === 0;

  return {
    movies,
    page: data.page ?? page,
    totalPages: data.total_pages ?? 0,
    totalResults: data.total_results ?? movies.length,
    isEmpty,
    emptyMessage: isEmpty
      ? 'Список популярных фильмов временно пуст. Попробуйте обновить страницу позже.'
      : null,
  };
}

/**
 * Получает список жанров фильмов из TMDB (/genre/movie/list) с кэшированием в памяти.
 */
export async function getMovieGenres(
  signal?: AbortSignal
): Promise<TmdbGenre[]> {
  if (cachedGenres && cachedGenres.length > 0) {
    return cachedGenres;
  }

  try {
    const data = await requestTmdb<{ genres?: TmdbGenre[] }>(
      '/genre/movie/list',
      { language: DEFAULT_LANGUAGE },
      signal
    );

    if (Array.isArray(data.genres) && data.genres.length > 0) {
      cachedGenres = data.genres.map((g) => ({
        id: g.id,
        name: g.name.charAt(0).toUpperCase() + g.name.slice(1),
      }));
      return cachedGenres;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    // В случае недоступности эндпоинта жанров используем стандартный справочник TMDB
  }

  return FALLBACK_TMDB_GENRES;
}

/**
 * Порог количества голосов (m) для формулы взвешенного рейтинга Байеса.
 * Значение m = 500 позволяет плавно сглаживать аномально высокие оценки
 * у малоизвестных фильмов с 1–50 голосами (притягивая их к среднему C),
 * но не исключает камерное и фестивальное кино из выборки жёстким отсечением.
 */
export const WEIGHTED_RATING_MIN_VOTES = 500;

/**
 * Базовый средний рейтинг (C) на случай, если в текущей выборке нет оценённых фильмов.
 */
const DEFAULT_MEAN_RATING = 6.8;

/**
 * Вычисляет средний рейтинг (C) по фильмам текущей выборки, у которых есть голоса.
 */
export function calculateSampleMeanRating(movies: TmdbMovie[]): number {
  const ratedMovies = movies.filter(
    (m) =>
      typeof m.vote_count === 'number' &&
      m.vote_count > 0 &&
      typeof m.vote_average === 'number' &&
      m.vote_average > 0
  );

  if (ratedMovies.length === 0) {
    return DEFAULT_MEAN_RATING;
  }

  const totalRating = ratedMovies.reduce((sum, m) => sum + m.vote_average, 0);
  return totalRating / ratedMovies.length;
}

/**
 * Вычисляет взвешенный рейтинг фильма по стандартной формуле Байеса:
 * W = (v / (v + m)) * R + (m / (v + m)) * C
 * Используется исключительно для порядка сортировки, не изменяя отображаемый vote_average.
 */
export function calculateWeightedRating(
  movie: TmdbMovie,
  meanRatingC: number,
  minVotesM: number = WEIGHTED_RATING_MIN_VOTES
): number {
  const v = Math.max(0, movie.vote_count ?? 0);
  const R = Math.max(0, movie.vote_average ?? 0);
  const m = Math.max(1, minVotesM);

  return (v / (v + m)) * R + (m / (v + m)) * meanRatingC;
}

function sortMoviesList(movies: TmdbMovie[], sortBy: TmdbSortBy): TmdbMovie[] {
  const copy = [...movies];

  if (sortBy === 'vote_average.desc') {
    const sampleMeanC = calculateSampleMeanRating(copy);
    const weightedScores = new Map<number, number>();

    for (const movie of copy) {
      weightedScores.set(
        movie.id,
        calculateWeightedRating(movie, sampleMeanC, WEIGHTED_RATING_MIN_VOTES)
      );
    }

    copy.sort((a, b) => {
      const scoreA = weightedScores.get(a.id) ?? 0;
      const scoreB = weightedScores.get(b.id) ?? 0;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      if ((b.vote_count ?? 0) !== (a.vote_count ?? 0)) {
        return (b.vote_count ?? 0) - (a.vote_count ?? 0);
      }
      return b.popularity - a.popularity;
    });

    return copy;
  }

  copy.sort((a, b) => {
    if (sortBy === 'primary_release_date.desc') {
      const dateA = a.release_date || '';
      const dateB = b.release_date || '';
      if (dateB !== dateA) {
        return dateB.localeCompare(dateA);
      }
      return b.popularity - a.popularity;
    }
    return b.popularity - a.popularity;
  });
  return copy;
}

/**
 * Возвращает текущую дату в формате YYYY-MM-DD без жёстко заданного года,
 * чтобы отсечение ещё не вышедших фильмов автоматически работало в будущем.
 */
export function getCurrentDateIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Проверяет, что у фильма указана дата выхода и она не находится в будущем
 * относительно переданной текущей даты YYYY-MM-DD.
 */
function isReleasedMovie(movie: TmdbMovie, todayIso: string): boolean {
  const releaseDate = movie.release_date?.trim();
  if (!releaseDate) {
    return false;
  }
  return releaseDate <= todayIso;
}

/**
 * Удаляет дубликаты фильмов по их уникальному идентификатору TMDB.
 */
function deduplicateMovies(movies: TmdbMovie[]): TmdbMovie[] {
  const seen = new Set<number>();
  const result: TmdbMovie[] = [];
  for (const movie of movies) {
    if (!seen.has(movie.id)) {
      seen.add(movie.id);
      result.push(movie);
    }
  }
  return result;
}

/**
 * Универсальное получение фильмов для страницы каталога:
 * использует /discover/movie для фильтрации и сортировки по каталогу
 * или /search/movie при наличии поискового запроса (по русскому и оригинальному названию).
 *
 * Важно об ограничении пагинации TMDB API v3:
 * TMDB не поддерживает сортировку по формуле взвешенного рейтинга W на стороне сервера.
 * Поэтому при sortBy === 'vote_average.desc' формируется расширенная многостраничная
 * выборка уже вышедших картин разных лет и ранжируется по формуле Байеса W.
 */
export async function getCatalogMovies(
  params: TmdbCatalogParams = {}
): Promise<TmdbMoviesResult> {
  const normalizedQuery = params.query?.trim() ?? '';
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const language = params.language ?? DEFAULT_LANGUAGE;
  const sortBy: TmdbSortBy = params.sortBy ?? 'popularity.desc';
  const genreId = params.genreId ?? null;
  const year = params.year ?? null;
  const isWeightedSort = sortBy === 'vote_average.desc';
  const todayIso = getCurrentDateIso();

  if (normalizedQuery) {
    const data = await requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
      '/search/movie',
      {
        query: normalizedQuery,
        page,
        language,
        primary_release_year: year ?? undefined,
        include_adult: false,
      },
      params.signal
    );

    const rawResults = Array.isArray(data.results) ? data.results : [];
    let movies = rawResults.map(normalizeMovie);

    if (year === null) {
      movies = movies.filter((m) => isReleasedMovie(m, todayIso));
    }

    if (genreId !== null) {
      movies = movies.filter((m) => m.genre_ids?.includes(genreId));
    }

    movies = sortMoviesList(movies, sortBy);
    const isEmpty = movies.length === 0;

    return {
      movies,
      page: data.page ?? page,
      totalPages: data.total_pages ?? 0,
      totalResults:
        genreId !== null ? movies.length : (data.total_results ?? movies.length),
      isEmpty,
      emptyMessage: isEmpty
        ? `По запросу «${normalizedQuery}» с выбранными параметрами фильмы не найдены.`
        : null,
      isSampleWeightedSort: isWeightedSort,
    };
  }

  if (isWeightedSort) {
    const ratedPageA = Math.min((page - 1) * 2 + 1, 500);
    const ratedPageB = Math.min((page - 1) * 2 + 2, 500);
    const minVotesForRatedPool =
      year !== null ? 25 : genreId !== null ? 60 : 150;
    const releaseDateLte = year === null ? todayIso : undefined;

    const [ratedResA, ratedResB, acclaimedRes] = await Promise.all([
      requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
        '/discover/movie',
        {
          page: ratedPageA,
          language,
          sort_by: 'vote_average.desc',
          with_genres: genreId ?? undefined,
          primary_release_year: year ?? undefined,
          'primary_release_date.lte': releaseDateLte,
          'vote_count.gte': minVotesForRatedPool,
          include_adult: false,
        },
        params.signal
      ),
      ratedPageB !== ratedPageA
        ? requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
            '/discover/movie',
            {
              page: ratedPageB,
              language,
              sort_by: 'vote_average.desc',
              with_genres: genreId ?? undefined,
              primary_release_year: year ?? undefined,
              'primary_release_date.lte': releaseDateLte,
              'vote_count.gte': minVotesForRatedPool,
              include_adult: false,
            },
            params.signal
          )
        : Promise.resolve(null),
      requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
        '/discover/movie',
        {
          page,
          language,
          sort_by: 'vote_count.desc',
          with_genres: genreId ?? undefined,
          primary_release_year: year ?? undefined,
          'primary_release_date.lte': releaseDateLte,
          include_adult: false,
        },
        params.signal
      ),
    ]);

    const combinedRaw: TmdbMovieRaw[] = [
      ...(Array.isArray(ratedResA.results) ? ratedResA.results : []),
      ...(ratedResB && Array.isArray(ratedResB.results)
        ? ratedResB.results
        : []),
      ...(Array.isArray(acclaimedRes.results) ? acclaimedRes.results : []),
    ];

    let pool = deduplicateMovies(combinedRaw.map(normalizeMovie));

    if (year === null) {
      pool = pool.filter((m) => isReleasedMovie(m, todayIso));
    }

    const sortedPool = sortMoviesList(pool, 'vote_average.desc');
    const movies = sortedPool.slice(0, 20);
    const isEmpty = movies.length === 0;
    const totalPages = Math.max(
      1,
      Math.min(
        500,
        Math.floor(
          Math.max(ratedResA.total_pages ?? 1, acclaimedRes.total_pages ?? 1) /
            2
        )
      )
    );
    const totalResults = Math.max(
      ratedResA.total_results ?? 0,
      acclaimedRes.total_results ?? 0,
      movies.length
    );

    return {
      movies,
      page,
      totalPages: isEmpty ? 0 : totalPages,
      totalResults: isEmpty ? 0 : totalResults,
      isEmpty,
      emptyMessage: isEmpty
        ? 'По выбранным фильтрам жанра и года в архиве TMDB картин не найдено.'
        : null,
      isSampleWeightedSort: true,
    };
  }

  const data = await requestTmdb<TmdbPaginatedResponse<TmdbMovieRaw>>(
    '/discover/movie',
    {
      page,
      language,
      sort_by: sortBy,
      with_genres: genreId ?? undefined,
      primary_release_year: year ?? undefined,
      'primary_release_date.lte': year === null ? todayIso : undefined,
      'vote_count.gte':
        year === null
          ? sortBy === 'popularity.desc'
            ? 20
            : 5
          : undefined,
      include_adult: false,
    },
    params.signal
  );

  const rawResults = Array.isArray(data.results) ? data.results : [];
  let movies = rawResults.map(normalizeMovie);

  if (year === null) {
    movies = movies.filter((m) => isReleasedMovie(m, todayIso));
  }

  movies = sortMoviesList(movies, sortBy);
  const isEmpty = movies.length === 0;

  return {
    movies,
    page: data.page ?? page,
    totalPages: data.total_pages ?? 0,
    totalResults: data.total_results ?? movies.length,
    isEmpty,
    emptyMessage: isEmpty
      ? 'По выбранным фильтрам жанра и года в архиве TMDB картин не найдено.'
      : null,
    isSampleWeightedSort: false,
  };
}

interface TmdbCrewRaw {
  id: number;
  name?: string;
  job?: string;
}

interface TmdbCastRaw {
  id: number;
  name?: string;
  character?: string;
}

interface TmdbMovieDetailsRaw extends TmdbMovieRaw {
  genres?: TmdbGenre[];
  runtime?: number | null;
  tagline?: string | null;
  production_countries?: { iso_3166_1?: string; name?: string }[];
  credits?: {
    cast?: TmdbCastRaw[];
    crew?: TmdbCrewRaw[];
  };
}

const cachedMovieDetails = new Map<string, TmdbMovieDetails>();

/**
 * Получает полную карточку отдельного фильма по его ID в TMDB (/movie/{id})
 * вместе с данными о режиссёре и актёрском составе (append_to_response=credits).
 * Кэширует полученные результаты в рамках сессии, чтобы избежать повторных запросов.
 */
export async function getMovieDetails(
  movieId: number | string,
  options: { language?: string; signal?: AbortSignal } = {}
): Promise<TmdbMovieDetails> {
  const rawIdStr = String(movieId).trim();
  const numericId = Number(rawIdStr);

  if (
    !rawIdStr ||
    !/^\d+$/.test(rawIdStr) ||
    !Number.isSafeInteger(numericId) ||
    numericId <= 0
  ) {
    throw new TmdbServiceError(
      'Фильм с указанным идентификатором не найден в архиве.',
      'NOT_FOUND',
      404
    );
  }

  const language = options.language ?? DEFAULT_LANGUAGE;
  const cacheKey = `${numericId}:${language}`;
  const cached = cachedMovieDetails.get(cacheKey);
  if (cached) {
    return cached;
  }

  const raw = await requestTmdb<TmdbMovieDetailsRaw>(
    `/movie/${numericId}`,
    {
      language,
      append_to_response: 'credits',
    },
    options.signal
  );

  const base = normalizeMovie(raw);

  const genres: TmdbGenre[] = Array.isArray(raw.genres)
    ? raw.genres
        .filter((g) => g && typeof g.name === 'string' && g.name.trim() !== '')
        .map((g) => ({
          id: g.id,
          name: g.name.charAt(0).toUpperCase() + g.name.slice(1),
        }))
    : [];

  const runtime =
    typeof raw.runtime === 'number' &&
    Number.isFinite(raw.runtime) &&
    raw.runtime > 0
      ? Math.round(raw.runtime)
      : null;

  const directorsSet = new Set<string>();
  if (Array.isArray(raw.credits?.crew)) {
    for (const member of raw.credits.crew) {
      if (
        member?.job === 'Director' &&
        typeof member.name === 'string' &&
        member.name.trim()
      ) {
        directorsSet.add(member.name.trim());
      }
    }
  }

  const cast: TmdbCastMember[] = [];
  const seenCastIds = new Set<number>();
  if (Array.isArray(raw.credits?.cast)) {
    for (const actor of raw.credits.cast) {
      const actorName = actor?.name?.trim() ?? '';
      if (actor && actorName && !seenCastIds.has(actor.id)) {
        seenCastIds.add(actor.id);
        cast.push({
          id: actor.id,
          name: actorName,
          character: actor.character?.trim() ?? '',
        });
        if (cast.length >= 10) {
          break;
        }
      }
    }
  }

  const countries: string[] = Array.isArray(raw.production_countries)
    ? raw.production_countries
        .map((c) => c?.name?.trim() ?? '')
        .filter((name) => Boolean(name))
    : [];

  const details: TmdbMovieDetails = {
    ...base,
    posterUrl: getTmdbImageUrl(raw.poster_path, 'w780') ?? base.posterUrl,
    genres,
    runtime,
    formattedRuntime: formatRuntimeMinutes(runtime),
    tagline: typeof raw.tagline === 'string' ? raw.tagline.trim() : '',
    directors: Array.from(directorsSet),
    cast,
    countries,
  };

  cachedMovieDetails.set(cacheKey, details);
  return details;
}
