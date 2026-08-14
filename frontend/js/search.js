/**
 * search.js — Global search utility and suggestions
 */
import api from './api.js';

const searchInput = document.querySelector('[data-search-input]');
const searchSuggestions = document.querySelector('[data-search-suggestions]');

if (searchInput) {
  let debounceTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();

    if (!query) {
      if (searchSuggestions) searchSuggestions.innerHTML = '';
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await api.products.getAll({ search: query, limit: 5 });
        if (searchSuggestions && res.data) {
          renderSuggestions(res.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `/frontend/products.html?search=${encodeURIComponent(query)}`;
      }
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (searchSuggestions && !searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
      searchSuggestions.innerHTML = '';
    }
  });
}

function renderSuggestions(products) {
  if (!searchSuggestions) return;

  if (products.length === 0) {
    searchSuggestions.innerHTML = `<div class="suggestion-item no-results">No products found</div>`;
    return;
  }

  searchSuggestions.innerHTML = products
    .map(
      (p) => `
      <a href="/frontend/product-details.html?id=${p._id}" class="suggestion-item">
        <img src="${p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${p.name}">
        <div class="suggestion-info">
          <div class="suggestion-name">${p.name}</div>
          <div class="suggestion-price">₹${p.price.toLocaleString('en-IN')}</div>
        </div>
      </a>
    `
    )
    .join('');
}
