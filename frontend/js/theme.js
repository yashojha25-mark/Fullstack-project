/**
 * theme.js — Dark/Light mode toggle
 */

const THEME_KEY = 'dd_theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  // Update toggle icons if they exist
  document.querySelectorAll('[data-theme-icon]').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
    el.setAttribute('title', theme === 'dark' ? 'Light mode' : 'Dark mode');
  });
}

function toggleTheme() {
  const current = getTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Apply on load
(function initTheme() {
  applyTheme(getTheme());
})();

export { getTheme, applyTheme, toggleTheme };
