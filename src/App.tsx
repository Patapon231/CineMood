import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { EditorialPicks } from './components/EditorialPicks/EditorialPicks';
import { MoodSection } from './components/MoodSection/MoodSection';
import { CatalogPage } from './components/CatalogPage/CatalogPage';
import { MoviePage } from './components/MoviePage/MoviePage';
import { Footer } from './components/Footer/Footer';
import './App.css';

interface RouteState {
  view: 'home' | 'catalog' | 'movie';
  movieId: string | null;
  activeNav: string;
}

function resolveRouteFromLocation(): RouteState {
  const hash = window.location.hash.trim();
  const hashMovieMatch = /^#\/?movie\/([^/?#]+)$/i.exec(hash);
  if (hashMovieMatch) {
    return {
      view: 'movie',
      movieId: decodeURIComponent(hashMovieMatch[1]),
      activeNav: 'catalog',
    };
  }

  if (hash === '#catalog' || hash === '#/catalog') {
    return {
      view: 'catalog',
      movieId: null,
      activeNav: 'catalog',
    };
  }

  if (hash === '#moods') {
    return {
      view: 'home',
      movieId: null,
      activeNav: 'library',
    };
  }

  const pathname = window.location.pathname.trim();
  const pathMovieMatch = /^\/movie\/([^/?#]+)$/i.exec(pathname);
  if (pathMovieMatch && !hash) {
    return {
      view: 'movie',
      movieId: decodeURIComponent(pathMovieMatch[1]),
      activeNav: 'catalog',
    };
  }

  if (pathname === '/catalog' && !hash) {
    return {
      view: 'catalog',
      movieId: null,
      activeNav: 'catalog',
    };
  }

  return {
    view: 'home',
    movieId: null,
    activeNav: 'journal',
  };
}

function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    resolveRouteFromLocation()
  );

  useEffect(() => {
    const syncRoute = () => {
      setRoute(resolveRouteFromLocation());
    };

    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const handleSelectNav = useCallback(
    (id: string) => {
      const wasNotHome = route.view !== 'home';

      if (id === 'catalog') {
        window.location.hash = '#catalog';
        setRoute({ view: 'catalog', movieId: null, activeNav: 'catalog' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (id === 'library') {
        window.location.hash = '#moods';
        setRoute({ view: 'home', movieId: null, activeNav: 'library' });
        if (wasNotHome) {
          window.requestAnimationFrame(() => {
            const moodsEl = document.getElementById('moods');
            moodsEl?.scrollIntoView({ behavior: 'smooth' });
          });
        }
        return;
      }

      window.location.hash = '#journal';
      setRoute({ view: 'home', movieId: null, activeNav: 'journal' });
      if (wasNotHome) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [route.view]
  );

  const handleSelectMovie = useCallback((movieId: number) => {
    const idStr = String(movieId);
    window.location.hash = `#movie/${idStr}`;
    setRoute({ view: 'movie', movieId: idStr, activeNav: 'catalog' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToCatalog = useCallback(() => {
    window.location.hash = '#catalog';
    setRoute({ view: 'catalog', movieId: null, activeNav: 'catalog' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="editorial-page">
      <Header activeNav={route.activeNav} onSelectNav={handleSelectNav} />

      <main className="editorial-main">
        {route.view === 'movie' && route.movieId ? (
          <MoviePage
            movieId={route.movieId}
            onBackToCatalog={handleBackToCatalog}
          />
        ) : route.view === 'catalog' ? (
          <CatalogPage onSelectMovie={handleSelectMovie} />
        ) : (
          <>
            <Hero />
            <EditorialPicks onSelectMovie={handleSelectMovie} />
            <MoodSection />
          </>
        )}
      </main>

      <Footer onSelectNav={handleSelectNav} />
    </div>
  );
}

export default App;
