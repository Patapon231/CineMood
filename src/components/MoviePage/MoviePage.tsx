import { useCallback, useEffect, useState } from 'react';
import {
  getMovieDetails,
  TmdbServiceError,
  type TmdbMovieDetails,
} from '../../services/tmdb';
import {
  CinematicImage,
  type FallbackTheme,
} from '../CinematicImage/CinematicImage';
import './MoviePage.css';

const FALLBACK_THEMES: FallbackTheme[] = ['edward', 'midnight', 'amelie'];

interface MoviePageProps {
  movieId: string;
  onBackToCatalog: () => void;
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

export function MoviePage({ movieId, onBackToCatalog }: MoviePageProps) {
  const [movie, setMovie] = useState<TmdbMovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    isNotFound: boolean;
  } | null>(null);
  const [reloadCount, setReloadCount] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadMovie() {
      setIsLoading(true);
      setErrorInfo(null);

      try {
        const data = await getMovieDetails(movieId, {
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        setMovie(data);
      } catch (err) {
        if (!isActive) {
          return;
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof TmdbServiceError) {
          setMovie(null);
          setErrorInfo({
            message: err.message,
            isNotFound: err.code === 'NOT_FOUND' || err.status === 404,
          });
        } else {
          setMovie(null);
          setErrorInfo({
            message:
              'Не удалось загрузить страницу фильма. Проверьте подключение к интернету и повторите попытку.',
            isNotFound: false,
          });
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadMovie();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [movieId, reloadCount]);

  const handleRetry = useCallback(() => {
    setReloadCount((prev) => prev + 1);
  }, []);

  const numericId = Number(movieId) || 0;
  const fallbackTheme =
    FALLBACK_THEMES[Math.abs(numericId) % FALLBACK_THEMES.length];

  return (
    <article className="movie-page-section" aria-live="polite">
      {/* Верхняя навигационная полоса возврата в каталог */}
      <div className="movie-page-topbar">
        <a
          href="#catalog"
          className="movie-back-button"
          onClick={(e) => {
            e.preventDefault();
            onBackToCatalog();
          }}
        >
          <span className="movie-back-arrow" aria-hidden="true">
            ←
          </span>
          <span>Вернуться в каталог</span>
        </a>

        <span className="editorial-bar-line" aria-hidden="true" />

        <span className="editorial-rubric">
          АРХИВНОЕ ДОСЬЕ // TMDB #{movieId}
        </span>
      </div>

      {/* Состояние загрузки */}
      {isLoading && (
        <div
          className="movie-page-grid is-loading"
          aria-busy="true"
          aria-label="Загрузка данных о фильме"
        >
          <div className="movie-poster-column">
            <div className="movie-poster-frame movie-skeleton-box">
              <span className="movie-skeleton-badge">ЗАГРУЗКА ПОСТЕРА…</span>
            </div>
          </div>

          <div className="movie-content-column">
            <div className="movie-skeleton-line movie-skeleton-kicker" />
            <div className="movie-skeleton-line movie-skeleton-heading" />
            <div className="movie-skeleton-line movie-skeleton-subheading" />
            <div className="movie-skeleton-specs" />
            <div className="movie-skeleton-paragraph" />
          </div>
        </div>
      )}

      {/* Состояние ошибки или отсутствующего фильма */}
      {!isLoading && errorInfo && (
        <div className="movie-status-box is-error" role="alert">
          <span className="movie-status-code">
            {errorInfo.isNotFound
              ? 'АРХИВНАЯ СПРАВКА // ФИЛЬМ НЕ НАЙДЕН (404)'
              : 'ПРИМЕЧАНИЕ РЕДАКЦИИ // ОШИБКА ЗАПРОСА К TMDB'}
          </span>
          <h1 className="movie-status-title">
            {errorInfo.isNotFound
              ? 'Запрашиваемая картина отсутствует в архиве'
              : 'Не удалось получить данные о картине'}
          </h1>
          <p className="movie-status-message">{errorInfo.message}</p>

          <div className="movie-status-actions">
            {!errorInfo.isNotFound && (
              <button
                type="button"
                className="movie-action-btn"
                onClick={handleRetry}
              >
                Повторить запрос
              </button>
            )}
            <a
              href="#catalog"
              className="movie-action-btn is-secondary"
              onClick={(e) => {
                e.preventDefault();
                onBackToCatalog();
              }}
            >
              ← Вернуться в каталог
            </a>
          </div>
        </div>
      )}

      {/* Основное содержимое страницы фильма */}
      {!isLoading && !errorInfo && movie && (
        <div className="movie-page-grid">
          <aside className="movie-poster-column">
            <div className="movie-poster-frame">
              <CinematicImage
                src={movie.posterUrl ?? movie.backdropUrl}
                alt={`Постер фильма «${movie.title}»`}
                theme={fallbackTheme}
                frameCode={
                  formatRating(movie.vote_average)
                    ? `TMDB ★ ${formatRating(movie.vote_average)}`
                    : '35MM // АРХИВ'
                }
                titleOverlay={movie.title}
                yearOverlay={movie.releaseYear ?? undefined}
              />
            </div>

            <div className="movie-poster-caption">
              <span className="movie-poster-caption-code">
                КАТАЛОЖНЫЙ НОМЕР #{movie.id}
              </span>
              {movie.compactReleaseDate && (
                <span>Премьера: {movie.compactReleaseDate}</span>
              )}
            </div>
          </aside>

          <div className="movie-content-column">
            <header className="movie-header-block">
              <div className="movie-header-meta-row">
                {movie.releaseYear && (
                  <span className="movie-header-year">{movie.releaseYear}</span>
                )}

                {formatRating(movie.vote_average) && (
                  <span
                    className="movie-header-rating"
                    title="Настоящий пользовательский рейтинг TMDB"
                  >
                    ★ {formatRating(movie.vote_average)}
                    {movie.vote_count > 0 && (
                      <span className="movie-header-votes">
                        ({movie.vote_count.toLocaleString('ru-RU')} оценок)
                      </span>
                    )}
                  </span>
                )}

                {movie.formattedRuntime && (
                  <span className="movie-header-runtime">
                    {movie.formattedRuntime}
                  </span>
                )}
              </div>

              <h1 className="movie-page-title">{movie.title}</h1>

              {movie.original_title &&
                movie.original_title.trim().toLowerCase() !==
                  movie.title.trim().toLowerCase() && (
                  <p className="movie-page-original-title">
                    {movie.original_title}
                  </p>
                )}

              {movie.tagline && (
                <blockquote className="movie-page-tagline">
                  «{movie.tagline}»
                </blockquote>
              )}
            </header>

            {/* Жанровые метки */}
            {movie.genres.length > 0 && (
              <div className="movie-genres-row" aria-label="Жанры фильма">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="movie-genre-tag">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Паспорт картины (технические и выходные данные) */}
            <dl className="movie-specs-grid">
              {movie.releaseYear && (
                <div className="movie-spec-item">
                  <dt className="movie-spec-label">Год выпуска</dt>
                  <dd className="movie-spec-value">{movie.releaseYear}</dd>
                </div>
              )}

              {movie.fullReleaseDate && (
                <div className="movie-spec-item">
                  <dt className="movie-spec-label">Дата выхода</dt>
                  <dd className="movie-spec-value">{movie.fullReleaseDate}</dd>
                </div>
              )}

              {movie.formattedRuntime && (
                <div className="movie-spec-item">
                  <dt className="movie-spec-label">Длительность</dt>
                  <dd className="movie-spec-value">{movie.formattedRuntime}</dd>
                </div>
              )}

              {formatRating(movie.vote_average) && (
                <div className="movie-spec-item">
                  <dt className="movie-spec-label">Рейтинг TMDB</dt>
                  <dd className="movie-spec-value">
                    {formatRating(movie.vote_average)} из 10
                  </dd>
                </div>
              )}

              {movie.directors.length > 0 && (
                <div className="movie-spec-item">
                  <dt className="movie-spec-label">
                    {movie.directors.length > 1 ? 'Режиссёры' : 'Режиссёр'}
                  </dt>
                  <dd className="movie-spec-value">
                    {movie.directors.join(', ')}
                  </dd>
                </div>
              )}

              {movie.countries.length > 0 && (
                <div className="movie-spec-item">
                  <dt className="movie-spec-label">Производство</dt>
                  <dd className="movie-spec-value">
                    {movie.countries.join(', ')}
                  </dd>
                </div>
              )}
            </dl>

            {/* Полное описание фильма без сокращений */}
            <section
              className="movie-synopsis-section"
              aria-labelledby="movie-synopsis-heading"
            >
              <h2 id="movie-synopsis-heading" className="movie-section-label">
                I. АННОТАЦИЯ И СЮЖЕТ
              </h2>
              <p
                className={`movie-synopsis-text ${
                  !movie.overview.trim() ? 'is-empty' : ''
                }`}
              >
                {movie.overview.trim() || 'Описание пока недоступно'}
              </p>
            </section>

            {/* Актёрский состав (показывается только при наличии данных в TMDB) */}
            {movie.cast.length > 0 && (
              <section
                className="movie-cast-section"
                aria-labelledby="movie-cast-heading"
              >
                <h2 id="movie-cast-heading" className="movie-section-label">
                  II. В РОЛЯХ
                </h2>
                <ul className="movie-cast-list">
                  {movie.cast.map((actor) => (
                    <li key={actor.id} className="movie-cast-item">
                      <span className="movie-cast-name">{actor.name}</span>
                      {actor.character && (
                        <span className="movie-cast-role">
                          {actor.character}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
