/**
 * language.js — i18n dictionary for EN / HI
 */
import { translations } from './translations.js';


const LANG_KEY = 'dd_lang';

function getLang() {
  return localStorage.getItem(LANG_KEY) || 'en';
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
}

function t(key) {
  const lang = getLang();
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

function applyLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = (translations[lang] && translations[lang][key]) || translations.en[key];
    if (val) {
      if (el.tagName === 'INPUT') el.placeholder = val;
      else el.textContent = val;
    }
  });
  // Update lang selector
  document.querySelectorAll('[data-lang-select]').forEach(el => { el.value = lang; });
}

// Apply on load
(function initLang() { applyLang(getLang()); })();

export { t, getLang, setLang, applyLang, translations };
