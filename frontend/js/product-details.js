/**
 * product-details.js — Product details page logic
 */
import api from './api.js';
import {
  showToast,
  renderStars,
  formatPrice,
  discountedPrice,
  productCardHTML,
  addRecentlyViewed,
  updateCartBadge,
  toggleWishlist,
} from './products.js';
import { updateNavAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await updateNavAuth();
  await updateCartBadge();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = 'products.html';
    return;
  }

  // Record recently viewed
  addRecentlyViewed(productId);

  const detailContainer = document.getElementById('product-detail-container');
  const relatedContainer = document.getElementById('related-products-container');
  const reviewsContainer = document.getElementById('reviews-container');

  try {
    // 1. Fetch Product details
    const res = await api.products.getById(productId);
    const product = res.data;
    renderProductDetails(product, detailContainer);

    // 2. Fetch Related products
    const relatedRes = await api.products.getRelated(productId);
    renderRelatedProducts(relatedRes.data, relatedContainer);

    // 3. Fetch Reviews
    const reviewsRes = await api.reviews.getByProduct(productId);
    renderReviews(reviewsRes.data, reviewsContainer);

    // Setup review submit form if logged in
    setupReviewForm(productId);

  } catch (err) {
    showToast(err.message || 'Error loading product details', 'error');
    if (detailContainer) {
      detailContainer.innerHTML = `<div class="empty-state">
        <h3>Product not found</h3>
        <p>The product you are looking for does not exist or has been disabled.</p>
        <a href="products.html" class="btn btn-primary">Back to Catalog</a>
      </div>`;
    }
  }
});

function renderProductDetails(p, container) {
  if (!container) return;

  const finalPrice = discountedPrice(p.price, p.discount);
  const images = p.images && p.images.length ? p.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

  // Convert specifications Map/Object to HTML rows
  let specsHtml = '';
  if (p.specifications) {
    const specsMap = p.specifications instanceof Map ? p.specifications : new Map(Object.entries(p.specifications));
    for (const [key, value] of specsMap.entries()) {
      specsHtml += `
        <tr>
          <td style="padding: 8px 12px; font-weight:600; border-bottom:1px solid var(--border);">${key}</td>
          <td style="padding: 8px 12px; border-bottom:1px solid var(--border);">${value}</td>
        </tr>`;
    }
  }

  const isOutOfStock = p.stock < 1;

  container.innerHTML = `
    <div class="product-detail-layout">
      <!-- Gallery -->
      <div class="product-gallery">
        <img id="main-product-image" class="gallery-main" src="${images[0]}" alt="${p.name}">
        <div class="gallery-thumbs">
          ${images.map((img, i) => `
            <img class="gallery-thumb ${i === 0 ? 'active' : ''}" src="${img}" alt="Thumbnail" data-index="${i}">
          `).join('')}
        </div>
      </div>

      <!-- Specs & Details -->
      <div>
        <span class="badge ${p.isNew ? 'badge-new' : p.isTrending ? 'badge-trending' : 'hidden'}">
          ${p.isNew ? 'New' : 'Trending'}
        </span>
        <h1 class="section-title" style="margin-top: 12px; margin-bottom: 8px;">${p.name}</h1>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom: 16px;">
          Brand: <strong style="color:var(--text-primary)">${p.brand}</strong> | Category: <strong style="color:var(--text-primary)">${p.category}</strong>
        </p>

        <div class="product-rating" style="margin-bottom: 20px;">
          <span class="stars" style="font-size:1.1rem">${renderStars(p.rating || 0)}</span>
          <strong style="font-size:1.1rem; color:var(--text-primary); margin-left: 6px;">${p.rating || 0}</strong>
          <span class="rating-count" style="font-size: 0.9rem; margin-left: 4px;">(${p.reviewCount || 0} reviews)</span>
        </div>

        <div class="product-price" style="margin-bottom: 24px;">
          <span class="price-current" style="font-size: 2rem;">${formatPrice(finalPrice)}</span>
          ${p.discount ? `
            <span class="price-original" style="font-size: 1.2rem;">${formatPrice(p.price)}</span>
            <span class="badge badge-sale" style="font-size: 0.85rem;">${p.discount}% Off</span>
          ` : ''}
        </div>

        <p style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.7;">
          ${p.description}
        </p>

        <!-- Stock state -->
        <p style="margin-bottom: 20px;">
          Availability: 
          <span style="font-weight:700; color: ${isOutOfStock ? '#e74c3c' : 'var(--teal)'};">
            ${isOutOfStock ? 'Out of Stock' : `In Stock (${p.stock} units available)`}
          </span>
        </p>

        <!-- Colors Selection -->
        ${p.colors && p.colors.length ? `
          <div style="margin-bottom: 24px;">
            <p class="form-label">Available Colors</p>
            <div class="color-options">
              ${p.colors.map((color, i) => `
                <button class="color-btn ${i === 0 ? 'active' : ''}" style="background-color: ${color.toLowerCase()};" data-color="${color}" title="${color}"></button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Quantity selector -->
        ${!isOutOfStock ? `
          <div style="margin-bottom: 28px;">
            <p class="form-label">Quantity</p>
            <div class="qty-control" style="margin-top:0; width: fit-content;">
              <button class="qty-btn" id="qty-dec">-</button>
              <span class="qty-val" id="qty-val">1</span>
              <button class="qty-btn" id="qty-inc">+</button>
            </div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="product-detail-actions">
          <button class="btn btn-primary btn-lg" id="add-to-cart-detail" ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button class="btn btn-teal btn-lg" id="buy-now-detail" ${isOutOfStock ? 'disabled' : ''}>Buy Now</button>
          <button class="btn btn-outline btn-lg" id="wishlist-detail" style="flex:0; min-width: 60px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        </div>

        <!-- Specifications Table -->
        ${specsHtml ? `
          <div style="margin-top: 40px;">
            <h3 style="font-size:1.15rem; font-weight:700; margin-bottom: 16px;">Specifications</h3>
            <table style="width:100%; border-collapse:collapse; background: var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden;">
              ${specsHtml}
            </table>
          </div>
        ` : ''}
      </div>
    </div>`;

  // Gallery interactions
  const mainImg = container.querySelector('#main-product-image');
  container.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      container.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      mainImg.src = e.target.src;
    });
  });

  // Color selection
  let selectedColor = p.colors && p.colors.length ? p.colors[0] : '';
  container.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedColor = e.target.getAttribute('data-color');
    });
  });

  // Qty control
  const qtyVal = container.querySelector('#qty-val');
  const qtyDec = container.querySelector('#qty-dec');
  const qtyInc = container.querySelector('#qty-inc');

  if (qtyVal) {
    qtyDec.addEventListener('click', () => {
      let current = parseInt(qtyVal.textContent);
      if (current > 1) qtyVal.textContent = current - 1;
    });
    qtyInc.addEventListener('click', () => {
      let current = parseInt(qtyVal.textContent);
      if (current < p.stock) qtyVal.textContent = current + 1;
      else showToast('Cannot exceed available stock', 'info');
    });
  }

  // Wishlist Action
  const wishlistBtn = container.querySelector('#wishlist-detail');
  wishlistBtn.addEventListener('click', async () => {
    await toggleWishlist(p._id, wishlistBtn);
  });

  // Add to Cart Action
  const addToCartBtn = container.querySelector('#add-to-cart-detail');
  addToCartBtn.addEventListener('click', async () => {
    const qty = qtyVal ? parseInt(qtyVal.textContent) : 1;
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = 'Adding...';
    try {
      await api.cart.add({ productId: p._id, quantity: qty, color: selectedColor });
      showToast('Added to cart successfully 🛒', 'success');
      updateCartBadge();
    } catch (err) {
      if (err.status === 401) {
        showToast('Please log in to add to cart', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
      } else {
        showToast(err.message || 'Failed to add to cart', 'error');
      }
    } finally {
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = 'Add to Cart';
    }
  });

  // Buy Now Action
  const buyNowBtn = container.querySelector('#buy-now-detail');
  buyNowBtn.addEventListener('click', async () => {
    const qty = qtyVal ? parseInt(qtyVal.textContent) : 1;
    buyNowBtn.disabled = true;
    try {
      await api.cart.add({ productId: p._id, quantity: qty, color: selectedColor });
      updateCartBadge();
      window.location.href = 'cart.html';
    } catch (err) {
      if (err.status === 401) {
        showToast('Please log in to checkout', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
      } else {
        showToast(err.message || 'Failed to checkout', 'error');
      }
      buyNowBtn.disabled = false;
    }
  });
}

function renderRelatedProducts(products, container) {
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">No related products found.</p>`;
    return;
  }

  container.innerHTML = products.map(p => productCardHTML(p)).join('');
}

function renderReviews(reviews, container) {
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">No reviews yet. Be the first to review this product!</p>`;
    return;
  }

  container.innerHTML = reviews
    .map(
      (r) => `
    <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-weight:600; color:var(--text-primary);">${r.user?.name || 'Anonymous User'}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
      </div>
      <div class="product-rating" style="margin-bottom:8px;">
        <span class="stars">${renderStars(r.rating)}</span>
      </div>
      <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.6;">${r.comment}</p>
    </div>
  `
    )
    .join('');
}

function setupReviewForm(productId) {
  const reviewForm = document.getElementById('add-review-form');
  if (!reviewForm) return;

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ratingVal = document.getElementById('review-rating')?.value;
    const commentVal = document.getElementById('review-comment')?.value.trim();

    if (!ratingVal || !commentVal) {
      showToast('Please fill in both rating and review comment', 'error');
      return;
    }

    try {
      await api.reviews.add(productId, { rating: Number(ratingVal), comment: commentVal });
      showToast('Review submitted successfully!', 'success');
      
      // Reload reviews
      const reviewsRes = await api.reviews.getByProduct(productId);
      renderReviews(reviewsRes.data, document.getElementById('reviews-container'));

      // Clear form
      reviewForm.reset();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    }
  });
}
