/**
 * api.js — Centralized API request layer
 * All fetch calls go through apiRequest()
 */

const BASE_URL = 'http://localhost:5000/api';

/**
 * Core API request function
 * @param {string} endpoint - API path (e.g. '/products')
 * @param {object} options - fetch options
 * @returns {Promise<object>}
 */
async function apiRequest(endpoint, options = {}) {
  const config = {
    credentials: 'include', // send cookies
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────
const api = {
  auth: {
    register: (body) => apiRequest('/auth/register', { method: 'POST', body }),
    login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    me: () => apiRequest('/auth/me'),
  },

  // ── Products ──────────────────────────────────────
  products: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/products${qs ? '?' + qs : ''}`);
    },
    getById: (id) => apiRequest(`/products/${id}`),
    getFeatured: () => apiRequest('/products/featured'),
    getMeta: () => apiRequest('/products/meta'),
    getRelated: (id) => apiRequest(`/products/${id}/related`),
    create: (body) => apiRequest('/products', { method: 'POST', body }),
    update: (id, body) => apiRequest(`/products/${id}`, { method: 'PUT', body }),
    delete: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  },

  // ── Cart ──────────────────────────────────────────
  cart: {
    get: () => apiRequest('/cart'),
    add: (body) => apiRequest('/cart', { method: 'POST', body }),
    update: (productId, quantity) => apiRequest(`/cart/${productId}`, { method: 'PUT', body: { quantity } }),
    remove: (productId) => apiRequest(`/cart/${productId}`, { method: 'DELETE' }),
    clear: () => apiRequest('/cart/clear', { method: 'DELETE' }),
  },

  // ── Wishlist ──────────────────────────────────────
  wishlist: {
    get: () => apiRequest('/wishlist'),
    add: (productId) => apiRequest('/wishlist', { method: 'POST', body: { productId } }),
    remove: (productId) => apiRequest(`/wishlist/${productId}`, { method: 'DELETE' }),
  },

  // ── Orders ────────────────────────────────────────
  orders: {
    create: (body) => apiRequest('/orders', { method: 'POST', body }),
    getAll: () => apiRequest('/orders'),
    getById: (id) => apiRequest(`/orders/${id}`),
    cancel: (id) => apiRequest(`/orders/${id}/cancel`, { method: 'PUT' }),
  },

  // ── Reviews ───────────────────────────────────────
  reviews: {
    getByProduct: (productId) => apiRequest(`/products/${productId}/reviews`),
    add: (productId, body) => apiRequest(`/products/${productId}/reviews`, { method: 'POST', body }),
    update: (reviewId, body) => apiRequest(`/reviews/${reviewId}`, { method: 'PUT', body }),
    delete: (reviewId) => apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' }),
  },

  // ── User ──────────────────────────────────────────
  user: {
    getProfile: () => apiRequest('/users/profile'),
    updateProfile: (body) => apiRequest('/users/profile', { method: 'PUT', body }),
    changePassword: (body) => apiRequest('/users/change-password', { method: 'PUT', body }),
  },

  // ── Admin ─────────────────────────────────────────
  admin: {
    dashboard: () => apiRequest('/admin/dashboard'),
    getUsers: () => apiRequest('/admin/users'),
    updateUserRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
    getOrders: () => apiRequest('/admin/orders'),
    updateOrderStatus: (id, status, note) => apiRequest(`/admin/orders/${id}/status`, { method: 'PUT', body: { status, note } }),
    getReviews: () => apiRequest('/admin/reviews'),
  },

  // ── Feedback & Contact ────────────────────────────
  feedback: {
    submit: (body) => apiRequest('/feedback', { method: 'POST', body }),
    getAll: () => apiRequest('/feedback'),
  },
  contact: {
    submit: (body) => apiRequest('/contact', { method: 'POST', body }),
    getAll: () => apiRequest('/contact'),
  },

  // ── Payments ──────────────────────────────────────
  payments: {
    initiate: (body) => apiRequest('/payments/initiate', { method: 'POST', body }),
  },
};

export default api;
export { apiRequest, BASE_URL };
