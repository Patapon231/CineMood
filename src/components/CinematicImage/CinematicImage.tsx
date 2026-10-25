import { useState } from 'react';
import './CinematicImage.css';

export type FallbackTheme = 'hero' | 'edward' | 'midnight' | 'amelie';

interface CinematicImageProps {
  src?: string | null;
  alt: string;
  theme: FallbackTheme;
  frameCode?: string;
  titleOverlay?: string;
  yearOverlay?: string;
  className?: string;
}

export function CinematicImage({
  src,
  alt,
  theme,
  frameCode = '35MM ARCHIVE',
  titleOverlay,
  yearOverlay,
  className = '',
}: CinematicImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const showFallback = hasError || !src;

  return (
    <div
      className={`cinematic-image-frame theme-${theme} ${
        showFallback ? 'is-fallback' : ''
      } ${isLoaded ? 'is-loaded' : ''} ${className}`}
    >
      {!showFallback && (
        <img
          src={src}
          alt={alt}
          loading={theme === 'hero' ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className="cinematic-image-element"
        />
      )}

      {/* Запасной художественный кинокадр на случай ошибки загрузки или до появления изображения */}
      <div className="cinematic-fallback" aria-hidden={!showFallback}>
        <svg
          className="cinematic-fallback-svg"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label={alt}
        >
          <defs>
            <radialGradient id={`glow-${theme}`} cx="50%" cy="42%" r="65%">
              {theme === 'hero' && (
                <>
                  <stop offset="0%" stopColor="#D6B88D" stopOpacity="0.48" />
                  <stop offset="55%" stopColor="#6D3B32" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#1B1917" stopOpacity="0.96" />
                </>
              )}
              {theme === 'edward' && (
                <>
                  <stop offset="0%" stopColor="#C9D3DC" stopOpacity="0.4" />
                  <stop offset="55%" stopColor="#3B4754" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#181B20" stopOpacity="0.96" />
                </>
              )}
              {theme === 'midnight' && (
                <>
                  <stop offset="0%" stopColor="#E3B778" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#8A5229" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1E1915" stopOpacity="0.96" />
                </>
              )}
              {theme === 'amelie' && (
                <>
                  <stop offset="0%" stopColor="#C9644A" stopOpacity="0.42" />
                  <stop offset="55%" stopColor="#2E4E3F" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#17231D" stopOpacity="0.96" />
                </>
              )}
            </radialGradient>
          </defs>

          <rect width="800" height="600" fill="#1C1A18" />
          <rect width="800" height="600" fill={`url(#glow-${theme})`} />

          {/* Художественная геометрия кадра в зависимости от темы */}
          {theme === 'hero' && (
            <g stroke="#F3EFE6" strokeOpacity="0.22" fill="none">
              <polygon
                points="0,80 800,210 800,470 0,520"
                fill="#F3EFE6"
                fillOpacity="0.05"
              />
              <circle cx="420" cy="270" r="145" strokeWidth="1" />
              <circle cx="420" cy="270" r="95" strokeWidth="0.75" strokeDasharray="4 6" />
              <line x1="80" y1="270" x2="720" y2="270" strokeWidth="0.6" />
              <line x1="420" y1="60" x2="420" y2="500" strokeWidth="0.6" />
            </g>
          )}

          {theme === 'edward' && (
            <g stroke="#E6E9EC" strokeOpacity="0.26" fill="none">
              <line x1="180" y1="70" x2="590" y2="510" strokeWidth="1.2" />
              <line x1="620" y1="90" x2="210" y2="520" strokeWidth="1.2" />
              <line x1="400" y1="45" x2="400" y2="555" strokeWidth="0.7" />
              <circle cx="400" cy="285" r="115" strokeWidth="0.9" />
              <circle cx="290" cy="160" r="3" fill="#F3EFE6" fillOpacity="0.45" />
              <circle cx="510" cy="195" r="2.5" fill="#F3EFE6" fillOpacity="0.4" />
              <circle cx="340" cy="400" r="2" fill="#F3EFE6" fillOpacity="0.35" />
              <circle cx="480" cy="360" r="3" fill="#F3EFE6" fillOpacity="0.4" />
            </g>
          )}

          {theme === 'midnight' && (
            <g stroke="#F3DFC1" strokeOpacity="0.25" fill="none">
              <path d="M120,520 Q400,140 680,520" strokeWidth="1.2" />
              <circle cx="400" cy="220" r="44" fill="#E8BE7C" fillOpacity="0.18" />
              <circle cx="240" cy="300" r="18" fill="#E8BE7C" fillOpacity="0.14" />
              <circle cx="560" cy="300" r="18" fill="#E8BE7C" fillOpacity="0.14" />
              <line x1="100" y1="450" x2="700" y2="450" strokeWidth="0.8" />
            </g>
          )}

          {theme === 'amelie' && (
            <g stroke="#F3EFE6" strokeOpacity="0.24" fill="none">
              <circle cx="400" cy="290" r="135" strokeWidth="1.1" />
              <circle
                cx="400"
                cy="290"
                r="76"
                fill="#A83E35"
                fillOpacity="0.28"
                strokeWidth="0.8"
              />
              <path d="M140,380 C280,290 520,290 660,380" strokeWidth="0.9" />
            </g>
          )}

          {/* Тонкая редакционная рамка внутри кадра */}
          <rect
            x="28"
            y="28"
            width="744"
            height="544"
            stroke="#F3EFE6"
            strokeOpacity="0.18"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        <div className="cinematic-fallback-caption">
          <span className="cinematic-fallback-code">{frameCode}</span>
          {titleOverlay && (
            <span className="cinematic-fallback-title">
              {titleOverlay} {yearOverlay ? `(${yearOverlay})` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="cinematic-grain-overlay" aria-hidden="true" />
      <div className="cinematic-frame-badge" aria-hidden="true">
        {frameCode}
      </div>
    </div>
  );
}
