/**
 * cart.js — Shopping cart management & checkout steps flow
 */
import api from './api.js';
import { requireAuth, updateNavAuth } from './auth.js';
import { showToast, formatPrice, updateCartBadge } from './products.js';

let cartData = null;
let currentCheckoutStep = 1; // 1: Cart, 2: Address, 3: Summary, 4: Payment

const addressData = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  await updateNavAuth();
  await updateCartBadge();

  // Load and render cart
  await loadCart();

  setupCartListeners();
  setupCheckoutListeners();
});

async function loadCart() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary-container');

  if (!container || !summaryContainer) return;

  container.innerHTML = `<div class="skeleton" style="height:150px; margin-bottom:16px;"></div><div class="skeleton" style="height:150px;"></div>`;

  try {
    const res = await api.cart.get();
    cartData = res.data;
    renderCart(container, summaryContainer);
  } catch (err) {
    showToast(err.message || 'Error loading cart', 'error');
  }
}

function renderCart(itemsContainer, summaryContainer) {
  if (!cartData || !cartData.items || cartData.items.length === 0) {
    // Show empty state
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🛒</span>
        <h3>Your shopping cart is empty</h3>
        <p>Explore what's new and discover great products today!</p>
        <a href="products.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    summaryContainer.classList.add('hidden');
    document.getElementById('checkout-flow-container')?.classList.add('hidden');
    return;
  }

  // Active checkout flow UI
  document.getElementById('checkout-flow-container')?.classList.remove('hidden');
  summaryContainer.classList.remove('hidden');

  // Render items
  itemsContainer.innerHTML = cartData.items
    .map((item) => {
      const p = item.product;
      const img = p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
      const maxStock = p.stock;

      return `
      <div class="cart-item" data-id="${item._id}" data-product-id="${p._id}">
        <img class="cart-item-img" src="${img}" alt="${p.name}">
        <div class="cart-item-info">
          <div class="cart-item-brand">${p.brand}</div>
          <div class="cart-item-name">${p.name}</div>
          ${item.color ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">Color: ${item.color}</div>` : ''}
          <div style="font-weight:700; color:var(--text-primary); margin-bottom: 8px;">
            ${formatPrice(item.price)}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="qty-control">
              <button class="qty-btn dec-qty">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn inc-qty" ${item.quantity >= maxStock ? 'disabled' : ''}>+</button>
            </div>
            <button class="btn btn-ghost btn-sm remove-item" style="border:none; color:#e74c3c;">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  // Render Summary
  const isFreeShipping = cartData.subtotal > 999;
  summaryContainer.innerHTML = `
    <h3 style="font-weight:700; margin-bottom:16px;">Order Summary</h3>
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${formatPrice(cartData.subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>Shipping</span>
      <span>${cartData.shipping === 0 ? '<span class="free-shipping-badge">FREE</span>' : formatPrice(cartData.shipping)}</span>
    </div>
    ${
      !isFreeShipping
        ? `
      <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">
        Add <strong>${formatPrice(1000 - cartData.subtotal)}</strong> more for FREE shipping!
      </p>
    `
        : ''
    }
    <div class="summary-row total">
      <span>Total Amount</span>
      <span>${formatPrice(cartData.total)}</span>
    </div>
    <button class="btn btn-primary btn-lg" id="checkout-next-btn" style="width:100%; margin-top:20px; justify-content:center;">
      Proceed to Checkout
    </button>
  `;
}

function setupCartListeners() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    const itemEl = e.target.closest('.cart-item');
    if (!itemEl) return;

    const productId = itemEl.getAttribute('data-product-id');

    // ── Increment / Decrement Qty ──
    if (e.target.classList.contains('inc-qty') || e.target.classList.contains('dec-qty')) {
      const valEl = itemEl.querySelector('.qty-val');
      let currentVal = parseInt(valEl.textContent);
      const isInc = e.target.classList.contains('inc-qty');

      const newVal = isInc ? currentVal + 1 : currentVal - 1;
      if (newVal < 1) return;

      try {
        const res = await api.cart.update(productId, newVal);
        cartData = res.data;
        renderCart(container, document.getElementById('cart-summary-container'));
        await updateCartBadge();
      } catch (err) {
        showToast(err.message || 'Error updating quantity', 'error');
      }
    }

    // ── Remove Item ──
    if (e.target.classList.contains('remove-item')) {
      try {
        const res = await api.cart.remove(productId);
        cartData = res.data;
        renderCart(container, document.getElementById('cart-summary-container'));
        showToast('Item removed from cart', 'info');
        await updateCartBadge();
      } catch (err) {
        showToast(err.message || 'Error removing item', 'error');
      }
    }
  });
}

function setupCheckoutListeners() {
  const summaryContainer = document.getElementById('cart-summary-container');
  if (!summaryContainer) return;

  summaryContainer.addEventListener('click', (e) => {
    if (e.target.id === 'checkout-next-btn') {
      advanceCheckoutStep();
    }
  });

  // Handle back buttons
  document.getElementById('checkout-back-btn')?.addEventListener('click', () => {
    regressCheckoutStep();
  });

  // Handle Address form submit
  document.getElementById('address-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    addressData.fullName = document.getElementById('addr-name').value.trim();
    addressData.phone = document.getElementById('addr-phone').value.trim();
    addressData.address = document.getElementById('addr-street').value.trim();
    addressData.city = document.getElementById('addr-city').value.trim();
    addressData.state = document.getElementById('addr-state').value.trim();
    addressData.pincode = document.getElementById('addr-pincode').value.trim();

    currentCheckoutStep = 3;
    updateCheckoutStepUI();
  });

  // Handle Place Order
  document.getElementById('place-order-btn')?.addEventListener('click', async () => {
    const paymentMethod = document.querySelector('[name="payment-method"]:checked')?.value || 'COD';
    const notes = document.getElementById('order-notes')?.value.trim() || '';

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.textContent = 'Processing Order...';

    try {
      const orderRes = await api.orders.create({
        shippingAddress: addressData,
        paymentMethod,
        notes,
      });

      // Clear local UI cart representation
      cartData = null;
      updateCartBadge();

      // Show success state
      renderOrderSuccess(orderRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
      btn.disabled = false;
      btn.textContent = 'Confirm & Place Order';
    }
  });
}

function advanceCheckoutStep() {
  if (currentCheckoutStep === 1) {
    currentCheckoutStep = 2; // Move to address form
  } else if (currentCheckoutStep === 2) {
    // Address submitted via form submit handler
    return;
  } else if (currentCheckoutStep === 3) {
    currentCheckoutStep = 4; // Move to payment method
  }
  updateCheckoutStepUI();
}

function regressCheckoutStep() {
  if (currentCheckoutStep > 1) {
    currentCheckoutStep--;
    updateCheckoutStepUI();
  }
}

function updateCheckoutStepUI() {
  const steps = [
    { num: 1, id: 'step-cart-view' },
    { num: 2, id: 'step-address-view' },
    { num: 3, id: 'step-summary-view' },
    { num: 4, id: 'step-payment-view' },
  ];

  steps.forEach((s) => {
    const viewEl = document.getElementById(s.id);
    const indicatorEl = document.getElementById(`step-${s.num}-indicator`);

    if (s.num === currentCheckoutStep) {
      viewEl?.classList.remove('hidden');
      indicatorEl?.classList.add('active');
      indicatorEl?.classList.remove('done');
    } else {
      viewEl?.classList.add('hidden');
      if (s.num < currentCheckoutStep) {
        indicatorEl?.classList.add('done');
        indicatorEl?.classList.remove('active');
      } else {
        indicatorEl?.classList.remove('active', 'done');
      }
    }
  });

  // Update back button visibility
  const backBtn = document.getElementById('checkout-back-btn');
  if (backBtn) {
    backBtn.classList.toggle('hidden', currentCheckoutStep === 1);
  }

  // Update central summary display
  const summaryContainer = document.getElementById('cart-summary-container');
  if (summaryContainer) {
    // Hide default summary next button on steps other than step 1
    const nextBtn = document.getElementById('checkout-next-btn');
    if (nextBtn) {
      nextBtn.classList.toggle('hidden', currentCheckoutStep !== 1);
    }
  }

  // If in step 3 (Order Summary confirmation step)
  if (currentCheckoutStep === 3) {
    renderConfirmOrderSummary();
  }
}

function renderConfirmOrderSummary() {
  const addressConf = document.getElementById('address-confirmation-details');
  const itemsConf = document.getElementById('items-confirmation-details');

  if (addressConf) {
    addressConf.innerHTML = `
      <strong>${addressData.fullName}</strong><br>
      ${addressData.address}<br>
      ${addressData.city}, ${addressData.state} - ${addressData.pincode}<br>
      Phone: ${addressData.phone}
    `;
  }

  if (itemsConf && cartData) {
    itemsConf.innerHTML = cartData.items
      .map(
        (item) => `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.88rem; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border);">
        <div>
          <strong>${item.product.name}</strong> 
          <span style="color:var(--text-muted);">x ${item.quantity}</span>
          ${item.color ? `<br><small style="color:var(--text-muted);">Color: ${item.color}</small>` : ''}
        </div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
    `
      )
      .join('');
  }
}

function renderOrderSuccess(order) {
  const container = document.getElementById('cart-page-content');
  if (!container) return;

  // Hide steps
  document.getElementById('checkout-flow-container')?.classList.add('hidden');

  container.innerHTML = `
    <div class="order-success">
      <div class="order-success-icon">🎉</div>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you for shopping with DIGItal Duniya. Your order has been registered.</p>
      <div class="order-id">Order ID: ${order._id}</div>
      <p style="margin-top:20px; color:var(--text-secondary);">
        Payment Method: <strong>${order.paymentMethod}</strong> | Status: <strong>${order.orderStatus}</strong>
      </p>
      <div style="margin-top:32px; display:flex; gap:16px; justify-content:center;">
        <a href="orders.html" class="btn btn-primary">Track Order</a>
        <a href="products.html" class="btn btn-outline">Continue Shopping</a>
      </div>
    </div>
  `;
}
