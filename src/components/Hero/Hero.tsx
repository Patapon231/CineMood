import { HERO_DATA } from '../../data/editorialData';
import { CinematicImage } from '../CinematicImage/CinematicImage';
import './Hero.css';

export function Hero() {
  return (
    <section id="journal" className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-editorial-bar">
        <span className="editorial-index">{HERO_DATA.sectionIndex}</span>
        <span className="editorial-bar-line" aria-hidden="true" />
        <span className="editorial-rubric">{HERO_DATA.rubric}</span>
      </div>

      <div className="hero-grid">
        <div className="hero-text-column">
          <h1 id="hero-heading" className="hero-title">
            <span className="hero-title-main">{HERO_DATA.titleFirstLine}</span>
            <em className="hero-title-accent">{HERO_DATA.titleAccentLine}</em>
          </h1>

          <div className="hero-lead-wrapper">
            <p className="hero-description">{HERO_DATA.description}</p>
            <p className="hero-editorial-note">{HERO_DATA.editorialNote}</p>

            <a href="#editorial-picks" className="hero-scroll-link">
              <span className="hero-scroll-link-text">К материалам выпуска</span>
              <span className="hero-scroll-link-arrow" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
        </div>

        <figure className="hero-visual-column">
          <div className="hero-image-container">
            <CinematicImage
              src={HERO_DATA.imageUrl}
              alt={HERO_DATA.imageAlt}
              theme="hero"
              frameCode={HERO_DATA.frameCode}
              titleOverlay="Свет в тёмном зале"
              yearOverlay="Выпуск 01"
            />
          </div>
          <figcaption className="hero-figcaption">
            <span className="hero-figcaption-mark">I.</span>
            <span>{HERO_DATA.imageCaption}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
