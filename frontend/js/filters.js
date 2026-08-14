/**
 * filters.js — Filter options and event handlers for products page
 */

export function getSelectedFilters() {
  const categories = Array.from(document.querySelectorAll('[data-filter="category"]:checked')).map(el => el.value);
  const brands = Array.from(document.querySelectorAll('[data-filter="brand"]:checked')).map(el => el.value);
  const colors = Array.from(document.querySelectorAll('[data-filter="color"]:checked')).map(el => el.value);
  
  const minPrice = document.querySelector('[data-filter="min-price"]')?.value || '';
  const maxPrice = document.querySelector('[data-filter="max-price"]')?.value || '';
  
  const rating = document.querySelector('[data-filter="rating"]:checked')?.value || '';
  
  const isNew = document.querySelector('[data-filter="new"]:checked') ? 'true' : '';
  const isTrending = document.querySelector('[data-filter="trending"]:checked') ? 'true' : '';
  
  const sort = document.querySelector('[data-sort-select]')?.value || 'newest';

  const params = {};
  if (categories.length) params.category = categories[0]; // backend filter is single category for now
  if (brands.length) params.brand = brands[0];
  if (colors.length) params.color = colors[0];
  if (minPrice) params.minPrice = minPrice;
  if (maxPrice) params.maxPrice = maxPrice;
  if (rating) params.rating = rating;
  if (isNew) params.isNew = isNew;
  if (isTrending) params.isTrending = isTrending;
  if (sort) params.sort = sort;

  return params;
}

export function populateFilterOptions(meta) {
  const brandContainer = document.querySelector('[data-brand-filters]');
  const colorContainer = document.querySelector('[data-color-filters]');

  if (brandContainer && meta.brands) {
    brandContainer.innerHTML = meta.brands
      .map(
        (b) => `
      <label class="filter-option">
        <input type="checkbox" data-filter="brand" value="${b}">
        <label>${b}</label>
      </label>
    `
      )
      .join('');
  }

  if (colorContainer && meta.colors) {
    colorContainer.innerHTML = meta.colors
      .map(
        (c) => `
      <label class="filter-option">
        <input type="checkbox" data-filter="color" value="${c}">
        <label>${c}</label>
      </label>
    `
      )
      .join('');
  }
}
