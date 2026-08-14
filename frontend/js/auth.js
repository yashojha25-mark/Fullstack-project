/**
 * auth.js — Auth state management, guard helpers
 */
import api from './api.js';
import { showToast } from './products.js';

const AUTH_KEY = 'dd_user';

// Cache user state in memory to avoid excess API calls
let _currentUser = null;

function getCachedUser() {
  if (_currentUser) return _currentUser;
  const stored = sessionStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setCachedUser(user) {
  _currentUser = user;
  if (user) sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(AUTH_KEY);
}

async function fetchCurrentUser() {
  try {
    const res = await api.auth.me();
    setCachedUser(res.data);
    return res.data;
  } catch {
    setCachedUser(null);
    return null;
  }
}

async function requireAuth(redirectTo = '/frontend/login.html') {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (user && user.role !== 'admin') {
    showToast('Admin access required', 'error');
    window.location.href = '/frontend/index.html';
    return null;
  }
  return user;
}

async function logout() {
  try {
    await api.auth.logout();
  } catch (_) {}
  setCachedUser(null);
  window.location.href = '/frontend/login.html';
}

// Update nav based on auth state
async function updateNavAuth() {
  const user = await fetchCurrentUser();
  const loginLinks = document.querySelectorAll('[data-auth="guest"]');
  const userLinks = document.querySelectorAll('[data-auth="user"]');
  const adminLinks = document.querySelectorAll('[data-auth="admin"]');
  const userNameEls = document.querySelectorAll('[data-user-name]');

  loginLinks.forEach(el => el.classList.toggle('hidden', !!user));
  userLinks.forEach(el => el.classList.toggle('hidden', !user));
  adminLinks.forEach(el => el.classList.toggle('hidden', !user || user.role !== 'admin'));
  userNameEls.forEach(el => { if (user) el.textContent = user.name.split(' ')[0]; });
  return user;
}

export { getCachedUser, fetchCurrentUser, requireAuth, requireAdmin, logout, updateNavAuth, setCachedUser };
