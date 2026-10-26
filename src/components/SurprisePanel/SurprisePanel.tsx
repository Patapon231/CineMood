import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSurpriseMovie,
  TmdbServiceError,
  type TmdbMovie,
} from '../../services/tmdb';
import { CinematicImage } from '../CinematicImage/CinematicImage';
import './SurprisePanel.css';

const HISTORY_STORAGE_KEY = 'cinemood_surprise_history_v1';
const HISTORY_LIMIT = 20;

function readHistory(): number[] {
  try {
    const raw = window.sessionStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((id): id is number => Number.isSafeInteger(id) && id > 0)
      .slice(-HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeHistory(ids: number[]): void {
  try {
    window.sessionStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(ids.slice(-HISTORY_LIMIT))
    );
  } catch {
    // sessionStorage может быть недоступен (приватный режим) — история не критична
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

interface SurprisePanelProps {
  onSelectMovie: (movieId: number) => void;
}

export function SurprisePanel({ onSelectMovie }: SurprisePanelProps) {
  const [movie, setMovie] = useState<TmdbMovie | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [pickError, setPickError] = useState('');

  // Синхронная защита от параллельных запросов при быстрых повторных нажатиях
  const inFlightRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const handleSurpriseMe = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;

    const controller = new AbortController();
    controllerRef.current = controller;

    setIsPicking(true);
    setPickError('');

    try {
      const history = readHistory();
      const { movie: picked, historyWasReset } = await getSurpriseMovie({
        excludeIds: history,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      const baseHistory = historyWasReset ? [] : history;
      writeHistory([...baseHistory.filter((id) => id !== picked.id), picked.id]);
      setMovie(picked);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setPickError(
        err instanceof TmdbServiceError
          ? err.message
          : 'Не удалось подобрать фильм. Проверь соединение и попробуй снова.'
      );
    } finally {
      inFlightRef.current = false;
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      if (!controller.signal.aborted) {
        setIsPicking(false);
      }
    }
  }, []);

  const rating = movie ? formatRating(movie.vote_average) : null;
  const showOriginalTitle =
    movie !== null &&
    Boolean(movie.original_title) &&
    movie.original_title.trim().toLowerCase() !==
      movie.title.trim().toLowerCase();

  return (
    <section
      className="surprise-panel"
      aria-labelledby="surprise-panel-heading"
    >
      <div className="surprise-panel-head">
        <span className="surprise-panel-kicker">РУБРИКА // СЛУЧАЙНЫЙ СЕАНС</span>
        <h2 id="surprise-panel-heading" className="surprise-panel-title">
          Доверься <em>случаю</em>
        </h2>
        <p className="surprise-panel-note">
          Мы заглянем в разные эпохи архива TMDB — от немого кино до
          последних премьер — и вытащим одну картину. Недавние находки не
          повторяются.
        </p>
      </div>

      <button
        type="button"
        className={`surprise-button ${isPicking ? 'is-picking' : ''}`}
        onClick={handleSurpriseMe}
        disabled={isPicking}
        aria-busy={isPicking}
      >
        <span className="surprise-button-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="9.25" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="6.4" r="1.6" />
            <circle cx="12" cy="17.6" r="1.6" />
            <circle cx="6.4" cy="12" r="1.6" />
            <circle cx="17.6" cy="12" r="1.6" />
          </svg>
        </span>
        <span className="surprise-button-label">
          {isPicking ? 'Перематываем плёнку…' : 'Удиви меня'}
        </span>
        <span className="surprise-button-arrow" aria-hidden="true">
          →
        </span>
      </button>

      <div className="surprise-panel-live" aria-live="polite">
        {pickError && (
          <p className="surprise-error" role="alert">
            {pickError}
          </p>
        )}

        {movie && (
          <article key={movie.id} className="surprise-result">
            <div className="surprise-result-poster">
              <CinematicImage
                src={movie.posterUrl}
                alt={`Постер фильма «${movie.title}»`}
                theme="midnight"
                frameCode={rating ? `★ ${rating}` : 'АРХИВ'}
                titleOverlay={movie.title}
                yearOverlay={movie.releaseYear ?? undefined}
              />
            </div>

            <div className="surprise-result-info">
              <span className="surprise-result-label">
                ВЫБОР СЛУЧАЯ // ИЗ АРХИВА TMDB
              </span>
              <h3 className="surprise-result-title">{movie.title}</h3>
              {showOriginalTitle && (
                <p className="surprise-result-original">
                  {movie.original_title}
                </p>
              )}
              <p className="surprise-result-meta">
                {movie.releaseYear && <span>{movie.releaseYear}</span>}
                {movie.releaseYear && rating && (
                  <span className="meta-dot" aria-hidden="true">
                    ·
                  </span>
                )}
                {rating && <span>★ {rating} TMDB</span>}
              </p>

              <button
                type="button"
                className="surprise-result-details"
                onClick={() => onSelectMovie(movie.id)}
              >
                Подробнее о фильме ↗
              </button>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
