/**
 * wishlist.js — Wishlist display and cart transition controller
 */
import api from './api.js';
import { requireAuth, updateNavAuth } from './auth.js';
import { showToast, formatPrice, renderStars, updateCartBadge } from './products.js';

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  await updateNavAuth();
  await updateCartBadge();

  await loadWishlist();
});

async function loadWishlist() {
  const container = document.getElementById('wishlist-grid-container');
  if (!container) return;

  container.innerHTML = `<div class="skeleton" style="height:250px;"></div><div class="skeleton" style="height:250px;"></div>`;

  try {
    const res = await api.wishlist.get();
    const products = res.data?.products || [];
    renderWishlist(products, container);
  } catch (err) {
    showToast(err.message || 'Failed to load wishlist', 'error');
  }
}

function renderWishlist(products, container) {
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <span class="empty-state-icon">❤️</span>
        <h3>Your wishlist is empty</h3>
        <p>Explore products you love and save them here.</p>
        <a href="products.html" class="btn btn-primary">Discover Products</a>
      </div>
    `;
    return;
  }

  container.innerHTML = products
    .map((p) => {
      const img = p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
      const isOutOfStock = p.stock < 1;

      return `
      <div class="product-card" data-product-id="${p._id}">
        <div class="product-card-img">
          <img src="${img}" alt="${p.name}">
          <button class="wishlist-btn active remove-wishlist" data-product-id="${p._id}" title="Remove from wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
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
            <span class="price-current">${formatPrice(p.price - (p.price * (p.discount || 0)) / 100)}</span>
            ${p.discount ? `<span class="price-original">${formatPrice(p.price)}</span>` : ''}
          </div>
          <div style="display:flex; gap:8px; margin-top:12px;">
            <button class="btn btn-primary btn-sm move-to-cart-btn" data-product-id="${p._id}" ${isOutOfStock ? 'disabled' : ''} style="flex:1; justify-content:center;">
              ${isOutOfStock ? 'Out of Stock' : 'Move to Cart'}
            </button>
            <a href="product-details.html?id=${p._id}" class="btn btn-ghost btn-sm">View</a>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  setupWishlistActions(container);
}

function setupWishlistActions(container) {
  // Remove from wishlist
  container.querySelectorAll('.remove-wishlist').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const productId = btn.getAttribute('data-product-id');
      try {
        await api.wishlist.remove(productId);
        showToast('Removed from wishlist', 'info');
        await loadWishlist();
      } catch (err) {
        showToast(err.message || 'Failed to remove', 'error');
      }
    });
  });

  // Move to cart
  container.querySelectorAll('.move-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const productId = btn.getAttribute('data-product-id');
      btn.disabled = true;
      btn.textContent = 'Moving...';
      try {
        // Add to cart
        await api.cart.add({ productId, quantity: 1 });
        // Remove from wishlist
        await api.wishlist.remove(productId);
        showToast('Moved to cart 🛒', 'success');
        await updateCartBadge();
        await loadWishlist();
      } catch (err) {
        showToast(err.message || 'Failed to move to cart', 'error');
        btn.disabled = false;
        btn.textContent = 'Move to Cart';
      }
    });
  });
}
