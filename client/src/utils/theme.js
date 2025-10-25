export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const applyTheme = (theme) => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Store preference
  localStorage.setItem('theme', theme);
};

export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = getSystemTheme();
  const theme = savedTheme || systemTheme;
  
  applyTheme(theme);
  return theme;
};

// Listen for system theme changes
export const watchSystemTheme = (callback) => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        callback(newTheme);
      }
    });
  }
};