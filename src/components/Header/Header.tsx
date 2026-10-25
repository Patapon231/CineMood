
import { NAV_ITEMS } from '../../data/editorialData';
import { useTheme } from '../../hooks/useTheme';
import './Header.css';

interface HeaderProps {
  activeNav: string;
  onSelectNav: (id: string) => void;
}

export function Header({ activeNav, onSelectNav }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="site-header">
      <div className="site-header-top">
        <span className="site-header-meta">НЕЗАВИСИМОЕ ИЗДАНИЕ О КИНО</span>
        <span className="site-header-meta site-header-meta-center">
          ВЫПУСК № 01 — ОСЕНЬ / ЗИМА
        </span>
        <span className="site-header-meta site-header-meta-right">
          АРХИВ ЧУВСТВ И КАДРОВ
        </span>
      </div>

      <div className="site-header-main">
        <a
          href="#journal"
          className="site-logo"
          onClick={() => onSelectNav('journal')}
          aria-label="cinemood. — На главную"
        >
          cinemood<span className="site-logo-dot">.</span>
        </a>

        <nav className="site-nav" aria-label="Основная навигация">
          <ul className="site-nav-list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;

              return (
                <li key={item.id} className="site-nav-item">
                  <a
                    href={item.href}
                    className={`site-nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSelectNav(item.id)}
                  >
                    <span className="site-nav-index">{item.index}</span>
                    <span className="site-nav-label">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'
          }
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
        </button>
      </div>
    </header>
  );
}
