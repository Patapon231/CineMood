
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cinemood-theme';

function getInitialTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  } catch {
    // Если localStorage недоступен, используем светлую тему.
  }

  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Тема останется активной до перезагрузки страницы.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light',
    );
  };

  return { theme, toggleTheme };
}
