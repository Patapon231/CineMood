import { NAV_ITEMS } from '../../data/editorialData';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

interface FooterProps {
  onSelectNav: (id: string) => void;
}

export function Footer({ onSelectNav }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <a
              href="#journal"
              className="site-footer-logo"
              onClick={() => onSelectNav('journal')}
            >
              cinemood<span className="site-logo-dot">.</span>
            </a>
            <p className="site-footer-tagline">
              Цифровой журнал о кино, который читают медленно. В скором времени —
              авторский каталог и ваша личная кинотека.
            </p>
          </div>

          <div className="site-footer-columns">
            <div className="site-footer-col">
              <span className="site-footer-col-title">ОГЛАВЛЕНИЕ</span>
              <ul className="site-footer-nav">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className="site-footer-link"
                      onClick={() => onSelectNav(item.id)}
                    >
                      <span className="site-footer-link-index">
                        {item.index}
                      </span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="site-footer-col">
              <span className="site-footer-col-title">КОЛОФОН</span>
              <p className="site-footer-colophon">
                Набрано гарнитурами Cormorant Garamond и Manrope на тёплой
                бумаге оттенка #F3EFE6. Выпуск 001.
              </p>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {CURRENT_YEAR} cinemood. Независимый киножурнал.</span>
          <span className="site-footer-imprint">
            ВЫПУСК 001 // НЕ ПРОСТО СМОТРЕТЬ. ЧУВСТВОВАТЬ.
          </span>
        </div>
      </div>
    </footer>
  );
}
