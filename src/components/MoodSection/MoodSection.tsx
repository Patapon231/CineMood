import { useState } from 'react';
import { MOOD_DIRECTIONS } from '../../data/editorialData';
import './MoodSection.css';

export function MoodSection() {
  const [selectedMoodId, setSelectedMoodId] = useState<string>(
    MOOD_DIRECTIONS[0].id
  );

  const activeMood =
    MOOD_DIRECTIONS.find((m) => m.id === selectedMoodId) ?? MOOD_DIRECTIONS[0];

  return (
    <section
      id="moods"
      className="mood-section"
      aria-labelledby="mood-section-heading"
    >
      <div className="section-editorial-header">
        <div className="section-index-row">
          <span className="editorial-index">003</span>
          <span className="editorial-bar-line" aria-hidden="true" />
          <span className="editorial-rubric">НАВИГАЦИЯ ПО ОЩУЩЕНИЯМ</span>
        </div>

        <div className="section-title-split">
          <h2 id="mood-section-heading" className="section-main-title">
            Кино по настроению
          </h2>
          <p className="section-subtitle-note">
            Четыре тематических маршрута по эмоциональной оптике кинематографа —
            прообраз нашего будущего каталога и личной кинотеки.
          </p>
        </div>
      </div>

      <div className="mood-editorial-layout">
        <div className="mood-list" role="list">
          {MOOD_DIRECTIONS.map((mood) => {
            const isSelected = mood.id === activeMood.id;
            return (
              <article
                key={mood.id}
                role="listitem"
                className={`mood-item ${isSelected ? 'is-selected' : ''}`}
                onMouseEnter={() => setSelectedMoodId(mood.id)}
                onClick={() => setSelectedMoodId(mood.id)}
              >
                <div className="mood-item-header">
                  <span className="mood-item-number">{mood.number}</span>
                  <span className="mood-item-accent-note">{mood.accentNote}</span>
                </div>

                <div className="mood-item-main">
                  <h3 className="mood-item-title">{mood.title}</h3>
                  <p className="mood-item-subtitle">{mood.subtitle}</p>
                </div>

                <p className="mood-item-description">{mood.description}</p>

                <div className="mood-item-footer">
                  <span className="mood-item-directors">{mood.filmsHint}</span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="mood-editorial-aside" aria-live="polite">
          <div className="mood-aside-inner">
            <span className="mood-aside-label">
              ФОКУС РУБРИКИ // {activeMood.number}
            </span>
            <h3 className="mood-aside-title">{activeMood.title}</h3>
            <p className="mood-aside-subtitle">{activeMood.subtitle}</p>
            <div className="mood-aside-divider" aria-hidden="true" />
            <p className="mood-aside-text">{activeMood.description}</p>
            <div className="mood-aside-meta">
              <span className="mood-aside-meta-key">Режиссёрские ориентиры</span>
              <span className="mood-aside-meta-val">{activeMood.filmsHint}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
