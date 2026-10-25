import { useCallback, useEffect, useState } from 'react';
import {
  getPopularMovies,
  TmdbServiceError,
  type TmdbMovie,
} from '../../services/tmdb';
import {
  CinematicImage,
  type FallbackTheme,
} from '../CinematicImage/CinematicImage';
import './EditorialPicks.css';

const FALLBACK_THEMES: FallbackTheme[] = ['edward', 'midnight', 'amelie'];
const DISPLAY_COUNT = 6;
const SKELETON_ITEMS = ['01', '02', '03'];

function formatRating(voteAverage: number): string | null {
  if (typeof voteAverage !== 'number' || Number.isNaN(voteAverage) || voteAverage <= 0) {
    return null;
  }
  return voteAverage.toFixed(1);
}

interface EditorialPicksProps {
  onSelectMovie: (movieId: number) => void;
}

export function EditorialPicks({ onSelectMovie }: EditorialPicksProps) {
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function fetchEditorialMovies() {
      setIsLoading(true);
      setErrorMessage(null);
      setEmptyMessage(null);

      try {
        const result = await getPopularMovies({
          page: 1,
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        if (result.isEmpty) {
          setMovies([]);
          setEmptyMessage(
            result.emptyMessage ?? 'Список популярных фильмов сейчас пуст.'
          );
        } else {
          setMovies(result.movies.slice(0, DISPLAY_COUNT));
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
            'Не удалось загрузить подборку фильмов из TMDB. Попробуйте обновить раздел.'
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void fetchEditorialMovies();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [reloadTrigger]);

  const handleRetry = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return (
    <section
      id="editorial-picks"
      className="editorial-picks-section"
      aria-labelledby="editorial-picks-heading"
    >
      <div className="section-editorial-header">
        <div className="section-index-row">
          <span className="editorial-index">002</span>
          <span className="editorial-bar-line" aria-hidden="true" />
          <span className="editorial-rubric">
            КУРАТОРСКАЯ ПОДБОРКА НОМЕРА // TMDB
          </span>
        </div>

        <div className="section-title-split">
          <h2 id="editorial-picks-heading" className="section-main-title">
            Выбор редакции
          </h2>
          <p className="section-subtitle-note">
            Актуальные картины из каталога TMDB, отобранные для медленного
            вечернего просмотра: постеры, год выхода и зрительская оценка.
          </p>
        </div>
      </div>

      {isLoading && (
        <div
          className="editorial-picks-grid is-loading"
          aria-busy="true"
          aria-label="Загрузка фильмов из TMDB"
        >
          {SKELETON_ITEMS.map((num, idx) => (
            <div
              key={num}
              className={`editorial-card editorial-card-skeleton editorial-slot-${
                (idx % 3) + 1
              }`}
            >
              <div className="editorial-card-top">
                <span className="editorial-card-number">№ {num}</span>
                <span className="skeleton-line skeleton-year" />
              </div>
              <div className="editorial-card-media aspect-portrait skeleton-media">
                <span className="skeleton-badge">ЗАГРУЗКА КАДРА…</span>
              </div>
              <div className="editorial-card-body">
                <span className="skeleton-line skeleton-title" />
                <span className="skeleton-line skeleton-meta" />
                <span className="skeleton-line skeleton-caption" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="editorial-status-box is-error" role="alert">
          <div className="editorial-status-header">
            <span className="editorial-status-code">
              ПРИМЕЧАНИЕ РЕДАКЦИИ // ОШИБКА СВЯЗИ С АРХИВОМ
            </span>
          </div>
          <p className="editorial-status-message">{errorMessage}</p>
          <button
            type="button"
            className="editorial-retry-button"
            onClick={handleRetry}
          >
            Повторить запрос к TMDB
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && emptyMessage && (
        <div className="editorial-status-box">
          <span className="editorial-status-code">АРХИВ TMDB // ПУСТО</span>
          <p className="editorial-status-message">{emptyMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && movies.length > 0 && (
        <div className="editorial-picks-grid">
          {movies.map((movie, index) => {
            const numberLabel = String(index + 1).padStart(2, '0');
            const rating = formatRating(movie.vote_average);
            const fallbackTheme =
              FALLBACK_THEMES[index % FALLBACK_THEMES.length];
            const slotIndex = (index % 3) + 1;
            const showOriginalTitle =
              Boolean(movie.original_title) &&
              movie.original_title !== movie.title;
            const overviewText =
              movie.overview.trim() || 'Описание пока недоступно';

            return (
              <article
                key={movie.id}
                className={`editorial-card editorial-slot-${slotIndex}`}
              >
                <div className="editorial-card-top">
                  <span className="editorial-card-number">
                    № {numberLabel}
                  </span>

                  <div className="editorial-card-top-meta">
                    {movie.compactReleaseDate && (
                      <span className="editorial-card-year">
                        {movie.compactReleaseDate}
                      </span>
                    )}
                    {rating && (
                      <span
                        className="editorial-card-rating"
                        title="Рейтинг зрителей TMDB"
                      >
                        ★ {rating}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={`#movie/${movie.id}`}
                  className="editorial-card-link"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      onSelectMovie(movie.id);
                    }
                  }}
                  aria-label={`Открыть страницу фильма «${movie.title}»`}
                >
                  <div className="editorial-card-media aspect-portrait">
                    <CinematicImage
                      src={movie.posterUrl ?? movie.backdropUrl}
                      alt={`Постер фильма «${movie.title}»`}
                      theme={fallbackTheme}
                      frameCode={rating ? `TMDB ★ ${rating}` : '35MM // TMDB'}
                      titleOverlay={movie.title}
                      yearOverlay={movie.releaseYear ?? undefined}
                    />
                  </div>

                  <div className="editorial-card-body">
                    <div className="editorial-card-heading-group">
                      <h3 className="editorial-card-title">{movie.title}</h3>

                      <p className="editorial-card-meta">
                        {showOriginalTitle && (
                          <span>{movie.original_title}</span>
                        )}
                        {showOriginalTitle &&
                          (movie.compactReleaseDate || rating) && (
                            <span className="meta-dot" aria-hidden="true">
                              ·
                            </span>
                          )}
                        {movie.compactReleaseDate && (
                          <span>{movie.compactReleaseDate}</span>
                        )}
                        {movie.compactReleaseDate && rating && (
                          <span className="meta-dot" aria-hidden="true">
                            ·
                          </span>
                        )}
                        {rating && <span>Оценка {rating}</span>}
                      </p>
                    </div>

                    <p
                      className={`editorial-card-caption ${
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
      )}
    </section>
  );
}
