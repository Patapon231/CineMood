import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FALLBACK_TMDB_GENRES,
  getCatalogMovies,
  getMovieGenres,
  TmdbServiceError,
  type TmdbGenre,
  type TmdbMovie,
  type TmdbSortBy,
} from '../../services/tmdb';
import {
  CinematicImage,
  type FallbackTheme,
} from '../CinematicImage/CinematicImage';
import './CatalogPage.css';

const FALLBACK_THEMES: FallbackTheme[] = ['edward', 'midnight', 'amelie'];
const SKELETON_COUNT = ['01', '02', '03', '04', '05', '06'];
const SEARCH_DEBOUNCE_MS = 400;
const CATALOG_STATE_STORAGE_KEY = 'cinemood_catalog_state_v1';

const SORT_OPTIONS: { value: TmdbSortBy; label: string }[] = [
  { value: 'popularity.desc', label: 'По популярности' },
  { value: 'vote_average.desc', label: 'По рейтингу' },
  { value: 'primary_release_date.desc', label: 'По дате выхода' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = Array.from(
  { length: CURRENT_YEAR - 1929 },
  (_, idx) => CURRENT_YEAR - idx
);

interface SavedCatalogState {
  query: string;
  genreId: number | null;
  year: number | null;
  sortBy: TmdbSortBy;
  page: number;
}

function loadSavedCatalogState(): SavedCatalogState {
  try {
    const raw = window.sessionStorage.getItem(CATALOG_STATE_STORAGE_KEY);
    if (!raw) {
      return {
        query: '',
        genreId: null,
        year: null,
        sortBy: 'popularity.desc',
        page: 1,
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedCatalogState>;
    const validSort: TmdbSortBy =
      parsed.sortBy === 'vote_average.desc' ||
      parsed.sortBy === 'primary_release_date.desc'
        ? parsed.sortBy
        : 'popularity.desc';

    return {
      query: typeof parsed.query === 'string' ? parsed.query : '',
      genreId: typeof parsed.genreId === 'number' ? parsed.genreId : null,
      year: typeof parsed.year === 'number' ? parsed.year : null,
      sortBy: validSort,
      page:
        typeof parsed.page === 'number' && parsed.page > 0
          ? Math.floor(parsed.page)
          : 1,
    };
  } catch {
    return {
      query: '',
      genreId: null,
      year: null,
      sortBy: 'popularity.desc',
      page: 1,
    };
  }
}

function formatRating(voteAverage: number): string | null {
  if (
    typeof voteAverage !== 'number' ||
    Number.isNaN(voteAverage) ||
    voteAverage <= 0
  ) {
    return null;
  }
  return voteAverage.toFixed(1);
}

interface CatalogPageProps {
  onSelectMovie: (movieId: number) => void;
}

export function CatalogPage({ onSelectMovie }: CatalogPageProps) {
  const initialState = useMemo(() => loadSavedCatalogState(), []);

  const [searchInput, setSearchInput] = useState<string>(initialState.query);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(
    initialState.query.trim()
  );
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(
    initialState.genreId
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(
    initialState.year
  );
  const [sortBy, setSortBy] = useState<TmdbSortBy>(initialState.sortBy);
  const [page, setPage] = useState<number>(initialState.page);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const [genres, setGenres] = useState<TmdbGenre[]>(FALLBACK_TMDB_GENRES);
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  // Сохраняем текущие фильтры каталога в sessionStorage для возврата со страницы фильма
  useEffect(() => {
    try {
      const stateToSave: SavedCatalogState = {
        query: debouncedQuery,
        genreId: selectedGenreId,
        year: selectedYear,
        sortBy,
        page,
      };
      window.sessionStorage.setItem(
        CATALOG_STATE_STORAGE_KEY,
        JSON.stringify(stateToSave)
      );
    } catch {
      // Игнорируем ограничения sessionStorage в приватном режиме
    }
  }, [debouncedQuery, selectedGenreId, selectedYear, sortBy, page]);

  // Задержка поискового запроса (debounce), чтобы не отправлять запрос на каждую букву
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedQuery) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [searchInput, debouncedQuery]);

  // Загрузка списка жанров TMDB один раз при открытии каталога
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadGenres() {
      try {
        const loaded = await getMovieGenres(controller.signal);
        if (isActive && loaded.length > 0) {
          setGenres(loaded);
        }
      } catch {
        // При ошибке остаётся базовый список жанров FALLBACK_TMDB_GENRES
      }
    }

    void loadGenres();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  // Основной запрос к каталогу при изменении поиска, фильтров, сортировки или страницы
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadCatalog() {
      setIsLoading(true);
      setErrorMessage(null);
      setEmptyMessage(null);

      try {
        const result = await getCatalogMovies({
          query: debouncedQuery,
          genreId: selectedGenreId,
          year: selectedYear,
          sortBy,
          page,
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        setMovies(result.movies);
        setTotalPages(Math.min(result.totalPages, 500));
        setTotalResults(result.totalResults);

        if (result.isEmpty) {
          setEmptyMessage(
            result.emptyMessage ??
              'По заданным критериям в архиве не найдено ни одной картины.'
          );
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof TmdbServiceError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(
            'Не удалось загрузить каталог фильмов. Проверьте подключение к сети и повторите попытку.'
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    debouncedQuery,
    selectedGenreId,
    selectedYear,
    sortBy,
    page,
    reloadToken,
  ]);

  const genreMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of genres) {
      map.set(g.id, g.name);
    }
    return map;
  }, [genres]);

  const handleGenreChange = (value: string) => {
    setSelectedGenreId(value ? Number(value) : null);
    setPage(1);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value ? Number(value) : null);
    setPage(1);
  };

  const handleSortChange = (value: TmdbSortBy) => {
    setSortBy(value);
    setPage(1);
  };

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedGenreId(null);
    setSelectedYear(null);
    setSortBy('popularity.desc');
    setPage(1);
  }, []);

  const handleRetry = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTyping = searchInput.trim() !== debouncedQuery;
  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    selectedGenreId !== null ||
    selectedYear !== null ||
    sortBy !== 'popularity.desc';

  return (
    <section
      id="catalog"
      className="catalog-page-section"
      aria-labelledby="catalog-page-heading"
    >
      {/* Редакционная шапка каталога */}
      <div className="catalog-editorial-header">
        <div className="section-index-row">
          <span className="editorial-index">002 // КАТАЛОГ</span>
          <span className="editorial-bar-line" aria-hidden="true" />
          <span className="editorial-rubric">
            АРХИВ МИРОВОГО И АВТОРСКОГО КИНЕМАТОГРАФА
          </span>
        </div>

        <div className="catalog-title-split">
          <h1 id="catalog-page-heading" className="catalog-main-title">
            Каталог картин
          </h1>
          <p className="catalog-subtitle-note">
            Ищите фильмы по русскому или оригинальному названию, обращайтесь к
            жанровым рубрикам и выбирайте эпоху выпуска.
          </p>
        </div>
      </div>

      {/* Панель поиска, фильтрации и сортировки */}
      <div
        className="catalog-controls-panel"
        role="search"
        aria-label="Фильтры каталога"
      >
        <div className="catalog-search-row">
          <label htmlFor="catalog-search-input" className="catalog-field-label">
            <span className="catalog-field-index">I.</span>
            <span>Поиск по русскому или оригинальному названию</span>
          </label>

          <div className="catalog-search-input-wrap">
            <input
              id="catalog-search-input"
              type="search"
              className="catalog-search-input"
              placeholder="Например: Амели, Amélie, Полночь в Париже, In the Mood for Love…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
            {searchInput && (
              <button
                type="button"
                className="catalog-search-clear"
                onClick={() => setSearchInput('')}
                aria-label="Очистить поисковый запрос"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        <div className="catalog-filters-row">
          <div className="catalog-filter-cell">
            <label
              htmlFor="catalog-genre-select"
              className="catalog-field-label"
            >
              <span className="catalog-field-index">II.</span>
              <span>Жанр</span>
            </label>
            <select
              id="catalog-genre-select"
              className="catalog-select"
              value={selectedGenreId ?? ''}
              onChange={(e) => handleGenreChange(e.target.value)}
            >
              <option value="">Все жанры</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div className="catalog-filter-cell">
            <label
              htmlFor="catalog-year-select"
              className="catalog-field-label"
            >
              <span className="catalog-field-index">III.</span>
              <span>Год выпуска</span>
            </label>
            <select
              id="catalog-year-select"
              className="catalog-select"
              value={selectedYear ?? ''}
              onChange={(e) => handleYearChange(e.target.value)}
            >
              <option value="">Любой год</option>
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="catalog-filter-cell">
            <label
              htmlFor="catalog-sort-select"
              className="catalog-field-label"
            >
              <span className="catalog-field-index">IV.</span>
              <span>Сортировка</span>
            </label>
            <select
              id="catalog-sort-select"
              className="catalog-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as TmdbSortBy)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Быстрые жанровые закладки редакции */}
        <div className="catalog-quick-genres" aria-label="Быстрый выбор жанра">
          <span className="catalog-quick-label">Рубрики:</span>
          <button
            type="button"
            className={`catalog-genre-pill ${
              selectedGenreId === null ? 'is-active' : ''
            }`}
            onClick={() => handleGenreChange('')}
          >
            Все
          </button>
          {genres.slice(0, 8).map((genre) => (
            <button
              key={genre.id}
              type="button"
              className={`catalog-genre-pill ${
                selectedGenreId === genre.id ? 'is-active' : ''
              }`}
              onClick={() =>
                handleGenreChange(
                  selectedGenreId === genre.id ? '' : String(genre.id)
                )
              }
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Информационная строка состояния выдачи */}
      <div className="catalog-summary-bar" aria-live="polite">
        <div className="catalog-summary-info">
          {isTyping ? (
            <span className="catalog-summary-status">
              Подготовка поискового запроса…
            </span>
          ) : isLoading ? (
            <span className="catalog-summary-status">
              Обращение к архиву TMDB…
            </span>
          ) : !errorMessage ? (
            <span className="catalog-summary-status">
              Найдено картин: <strong>{totalResults}</strong>
              {debouncedQuery ? ` по запросу «${debouncedQuery}»` : ''}
              {selectedGenreId && genreMap.get(selectedGenreId)
                ? ` · жанр: ${genreMap.get(selectedGenreId)}`
                : ''}
              {selectedYear ? ` · ${selectedYear} г.` : ''}
              {sortBy === 'vote_average.desc'
                ? ' · взвешенный рейтинг по загруженной выборке'
                : ''}
            </span>
          ) : (
            <span className="catalog-summary-status">
              Связь с архивом прервана
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="catalog-reset-link"
            onClick={handleResetFilters}
          >
            Сбросить параметры ×
          </button>
        )}
      </div>

      {/* Состояние загрузки */}
      {isLoading && (
        <div
          className="catalog-movies-grid is-loading"
          aria-busy="true"
          aria-label="Загрузка каталога фильмов"
        >
          {SKELETON_COUNT.map((num, idx) => (
            <div
              key={num}
              className={`catalog-card catalog-card-skeleton catalog-slot-${
                (idx % 3) + 1
              }`}
            >
              <div className="catalog-card-top">
                <span className="catalog-card-number">№ {num}</span>
                <span className="catalog-skeleton-line catalog-skeleton-year" />
              </div>
              <div className="catalog-card-media catalog-skeleton-media">
                <span className="catalog-skeleton-badge">ЗАГРУЗКА КАДРА…</span>
              </div>
              <div className="catalog-card-body">
                <span className="catalog-skeleton-line catalog-skeleton-title" />
                <span className="catalog-skeleton-line catalog-skeleton-meta" />
                <span className="catalog-skeleton-line catalog-skeleton-caption" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Состояние ошибки */}
      {!isLoading && errorMessage && (
        <div className="catalog-status-box is-error" role="alert">
          <span className="catalog-status-code">
            ПРИМЕЧАНИЕ РЕДАКЦИИ // ОШИБКА ЗАГРУЗКИ КАТАЛОГА
          </span>
          <p className="catalog-status-message">{errorMessage}</p>
          <div className="catalog-status-actions">
            <button
              type="button"
              className="catalog-action-button"
              onClick={handleRetry}
            >
              Повторить запрос
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="catalog-action-button is-secondary"
                onClick={handleResetFilters}
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
      )}

      {/* Пустая выдача */}
      {!isLoading && !errorMessage && emptyMessage && (
        <div className="catalog-status-box">
          <span className="catalog-status-code">
            АРХИВНАЯ СПРАВКА // НИЧЕГО НЕ НАЙДЕНО
          </span>
          <p className="catalog-status-message">{emptyMessage}</p>
          {hasActiveFilters && (
            <div className="catalog-status-actions">
              <button
                type="button"
                className="catalog-action-button"
                onClick={handleResetFilters}
              >
                Вернуться ко всему каталогу
              </button>
            </div>
          )}
        </div>
      )}

      {/* Сетка фильмов каталога */}
      {!isLoading && !errorMessage && movies.length > 0 && (
        <>
          <div className="catalog-movies-grid">
            {movies.map((movie, index) => {
              const itemNumber = (page - 1) * 20 + index + 1;
              const numberLabel = String(itemNumber).padStart(2, '0');
              const rating = formatRating(movie.vote_average);
              const fallbackTheme =
                FALLBACK_THEMES[index % FALLBACK_THEMES.length];
              const slotIndex = (index % 3) + 1;
              const showOriginalTitle =
                Boolean(movie.original_title) &&
                movie.original_title.trim().toLowerCase() !==
                  movie.title.trim().toLowerCase();

              const movieGenreNames = (movie.genre_ids ?? [])
                .map((id) => genreMap.get(id))
                .filter((name): name is string => Boolean(name))
                .slice(0, 3);

              const overviewText =
                movie.overview.trim() || 'Описание пока недоступно';

              return (
                <article
                  key={movie.id}
                  className={`catalog-card catalog-slot-${slotIndex}`}
                >
                  <div className="catalog-card-top">
                    <span className="catalog-card-number">
                      № {numberLabel}
                    </span>

                    <div className="catalog-card-top-meta">
                      {movie.compactReleaseDate ? (
                        <span className="catalog-card-year">
                          {movie.compactReleaseDate}
                        </span>
                      ) : (
                        <span className="catalog-card-year is-muted">—</span>
                      )}

                      {rating && (
                        <span
                          className="catalog-card-rating"
                          title="Рейтинг TMDB"
                        >
                          ★ {rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={`#movie/${movie.id}`}
                    className="catalog-card-link"
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        onSelectMovie(movie.id);
                      }
                    }}
                    aria-label={`Открыть страницу фильма «${movie.title}»`}
                  >
                    <div className="catalog-card-media">
                      <CinematicImage
                        src={movie.posterUrl ?? movie.backdropUrl}
                        alt={`Постер фильма «${movie.title}»`}
                        theme={fallbackTheme}
                        frameCode={rating ? `TMDB ★ ${rating}` : '35MM // АРХИВ'}
                        titleOverlay={movie.title}
                        yearOverlay={movie.releaseYear ?? undefined}
                      />
                    </div>

                    <div className="catalog-card-body">
                      <div className="catalog-card-heading-group">
                        <h2 className="catalog-card-title">{movie.title}</h2>

                        {showOriginalTitle && (
                          <p className="catalog-card-original-title">
                            {movie.original_title}
                          </p>
                        )}

                        <p className="catalog-card-meta">
                          {movie.compactReleaseDate && (
                            <span>{movie.compactReleaseDate}</span>
                          )}
                          {movie.compactReleaseDate &&
                            (rating || movieGenreNames.length > 0) && (
                              <span className="meta-dot" aria-hidden="true">
                                ·
                              </span>
                            )}
                          {rating && <span>Оценка {rating}</span>}
                          {rating && movieGenreNames.length > 0 && (
                            <span className="meta-dot" aria-hidden="true">
                              ·
                            </span>
                          )}
                          {movieGenreNames.length > 0 && (
                            <span>{movieGenreNames.join(', ')}</span>
                          )}
                        </p>
                      </div>

                      <p
                        className={`catalog-card-caption ${
                          !movie.overview.trim() ? 'is-empty' : ''
                        }`}
                      >
                        {overviewText}
                      </p>
                    </div>
                  </a>
                </article>
              );
            })}
          </div>

          
          {/* Редакционная пагинация */}
          {totalPages > 1 && (
            <nav
              className="catalog-pagination"
              aria-label="Навигация по страницам каталога"
            >
              <button
                type="button"
                className="catalog-page-btn"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Назад
              </button>

              <div className="catalog-pagination-center">
                <div className="catalog-page-numbers">
                  {Array.from(
                    new Set([
                      1,
                      ...(page > 3 ? [page - 2, page - 1] : []),
                      page,
                      ...(page < totalPages - 2
                        ? [page + 1, page + 2]
                        : []),
                      totalPages,
                    ])
                  )
                    .filter((number) => number >= 1 && number <= totalPages)
                    .sort((a, b) => a - b)
                    .map((number, index, numbers) => (
                      <span
                        className="catalog-page-number-wrap"
                        key={number}
                      >
                        {index > 0 &&
                          number - numbers[index - 1] > 1 && (
                            <span
                              className="catalog-page-ellipsis"
                              aria-hidden="true"
                            >
                              …
                            </span>
                          )}
                        <button
                          type="button"
                          className={`catalog-page-number ${
                            number === page ? 'is-active' : ''
                          }`}
                          aria-current={number === page ? 'page' : undefined}
                          aria-label={`Страница ${number}`}
                          onClick={() => handlePageChange(number)}
                        >
                          {number}
                        </button>
                      </span>
                    ))}
                </div>

                <form
                  className="catalog-page-jump"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const input = form.elements.namedItem(
                      'pageNumber'
                    ) as HTMLInputElement | null;
                    const requestedPage = Number(input?.value);

                    if (
                      Number.isInteger(requestedPage) &&
                      requestedPage >= 1 &&
                      requestedPage <= totalPages
                    ) {
                      handlePageChange(requestedPage);
                    } else if (input) {
                      input.setCustomValidity(
                        `Введите число от 1 до ${totalPages}`
                      );
                      input.reportValidity();
                    }
                  }}
                >
                  <label htmlFor="catalog-page-number">
                    Перейти к странице
                  </label>
                  <input
                    id="catalog-page-number"
                    name="pageNumber"
                    type="number"
                    min={1}
                    max={totalPages}
                    step={1}
                    placeholder={String(page)}
                    aria-label="Номер страницы"
                    onChange={(event) =>
                      event.currentTarget.setCustomValidity('')
                    }
                  />
                  <button type="submit" className="catalog-page-btn">
                    Перейти
                  </button>
                </form>
              </div>

              <button
                type="button"
                className="catalog-page-btn"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Вперёд →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
