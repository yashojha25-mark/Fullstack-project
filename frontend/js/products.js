/**
 * products.js — Shared utilities: toast, product card rendering, star rating, recently viewed
 */
import api from './api.js';

// ── Toast notifications ────────────────────────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'info', duration = 3500) {
  const container = getToastContainer();
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Stars helper ────────────────────────────────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '★'.repeat(full);
  if (half) s += '½';
  s += '☆'.repeat(5 - full - (half ? 1 : 0));
  return s;
}

// ── Price formatter ─────────────────────────────────────────────────────────
function formatPrice(price) {
  return '₹' + Number(price).toLocaleString('en-IN');
}

function discountedPrice(price, discount) {
  if (!discount) return price;
  return Math.round(price * (1 - discount / 100));
}

// ── Product card HTML ────────────────────────────────────────────────────────
function productCardHTML(p, wishlistIds = new Set()) {
  const finalPrice = discountedPrice(p.price, p.discount);
  const isWishlisted = wishlistIds.has(p._id);
  const img = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
  return `
    <div class="product-card" data-id="${p._id}">
      <div class="product-card-img">
        <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'">
        <div class="product-card-badges">
          ${p.isNew ? '<span class="badge badge-new">New</span>' : ''}
          ${p.isTrending ? '<span class="badge badge-trending">🔥 Trending</span>' : ''}
          ${p.discount ? `<span class="badge badge-sale">${p.discount}% off</span>` : ''}
        </div>
        <button class="wishlist-btn${isWishlisted ? ' active' : ''}" data-product-id="${p._id}" title="Add to wishlist" aria-label="Toggle wishlist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>
      <div class="product-card-body">
        <p class="product-brand">${p.brand}</p>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating || 0)}</span>
          <span class="rating-count">(${p.reviewCount || 0})</span>
        </div>
        <div class="product-price">
          <span class="price-current">${formatPrice(finalPrice)}</span>
          ${p.discount ? `<span class="price-original">${formatPrice(p.price)}</span><span class="price-discount">${p.discount}% off</span>` : ''}
        </div>
        <div class="product-card-actions">
          <button class="btn btn-outline btn-sm add-to-cart-btn" data-product-id="${p._id}" ${p.stock < 1 ? 'disabled' : ''}>
            ${p.stock < 1 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <a href="product-details.html?id=${p._id}" class="btn btn-ghost btn-sm">View</a>
        </div>
      </div>
    </div>`;
}

// ── Skeleton cards ───────────────────────────────────────────────────────────
function skeletonCards(count = 8) {
  return Array.from({ length: count }, () => `
    <div class="product-card">
      <div class="skeleton" style="height:220px"></div>
      <div class="product-card-body">
        <div class="skeleton" style="height:12px;width:60%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:16px;width:90%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:12px;width:40%;margin-bottom:12px"></div>
        <div class="skeleton" style="height:36px;margin-bottom:0"></div>
      </div>
    </div>`).join('');
}

// ── Recently Viewed ─────────────────────────────────────────────────────────
const RV_KEY = 'dd_recently_viewed';
const RV_LIMIT = 8;

function addRecentlyViewed(productId) {
  let ids = getRecentlyViewedIds();
  ids = [productId, ...ids.filter(id => id !== productId)].slice(0, RV_LIMIT);
  localStorage.setItem(RV_KEY, JSON.stringify(ids));
}

function getRecentlyViewedIds() {
  try { return JSON.parse(localStorage.getItem(RV_KEY)) || []; }
  catch { return []; }
}

// ── Cart count badge ─────────────────────────────────────────────────────────
async function updateCartBadge() {
  try {
    const res = await api.cart.get();
    const count = res.data?.items?.length || 0;
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  } catch { /* not logged in */ }
}

// ── Wishlist toggle helper ───────────────────────────────────────────────────
async function toggleWishlist(productId, btn) {
  try {
    if (btn.classList.contains('active')) {
      await api.wishlist.remove(productId);
      btn.classList.remove('active');
      btn.querySelector('svg').setAttribute('fill', 'none');
      showToast('Removed from wishlist', 'info');
    } else {
      await api.wishlist.add(productId);
      btn.classList.add('active');
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
      showToast('Added to wishlist ❤️', 'success');
    }
  } catch (err) {
    if (err.status === 401) {
      showToast('Please log in to use wishlist', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
    } else if (err.status === 409) {
      showToast('Already in wishlist', 'info');
    } else {
      showToast(err.message || 'Error updating wishlist', 'error');
    }
  }
}

// ── Add to cart helper ───────────────────────────────────────────────────────
async function addToCartHelper(productId, btn) {
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Adding…';
  try {
    await api.cart.add({ productId, quantity: 1 });
    showToast('Added to cart 🛒', 'success');
    updateCartBadge();
    btn.textContent = '✓ Added';
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
  } catch (err) {
    if (err.status === 401) {
      showToast('Please log in to add to cart', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
    } else {
      showToast(err.message || 'Failed to add to cart', 'error');
    }
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

export {
  showToast, renderStars, formatPrice, discountedPrice,
  productCardHTML, skeletonCards,
  addRecentlyViewed, getRecentlyViewedIds,
  updateCartBadge, toggleWishlist, addToCartHelper
};
