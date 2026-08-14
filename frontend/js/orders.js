/**
 * orders.js — User order history tracking and detail views
 */
import api from './api.js';
import { requireAuth, updateNavAuth } from './auth.js';
import { showToast, formatPrice, updateCartBadge } from './products.js';

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  await updateNavAuth();
  await updateCartBadge();

  await loadOrders();
});

async function loadOrders() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  container.innerHTML = `<div class="skeleton" style="height:120px; margin-bottom:16px;"></div><div class="skeleton" style="height:120px;"></div>`;

  try {
    const res = await api.orders.getAll();
    renderOrders(res.data, container);
  } catch (err) {
    showToast(err.message || 'Failed to fetch orders', 'error');
  }
}

function renderOrders(orders, container) {
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📦</span>
        <h3>No orders yet</h3>
        <p>You haven't placed any orders yet. Discover our catalog to buy products.</p>
        <a href="products.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const isCancellable = ['Pending', 'Confirmed'].includes(order.orderStatus);
      const statusClass = `status-${order.orderStatus.toLowerCase().replace(/\s+/g, '-')}`;

      return `
      <div class="cart-item" style="flex-direction:column; gap:12px; align-items:stretch;" data-order-id="${order._id}">
        <!-- Order header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div>
            <span style="font-size:0.8rem; color:var(--text-muted);">ORDER PLACED</span><br>
            <strong>${dateStr}</strong>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--text-muted);">TOTAL AMOUNT</span><br>
            <strong class="text-accent">${formatPrice(order.totalAmount)}</strong>
          </div>
          <div>
            <span style="font-size:0.8rem; color:var(--text-muted);">STATUS</span><br>
            <span class="order-status ${statusClass}">${order.orderStatus}</span>
          </div>
        </div>

        <!-- Order items -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${order.items
            .map(
              (item) => `
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; border-radius:var(--radius-sm);">
              <div style="flex:1;">
                <div style="font-weight:600; font-size:0.9rem;">${item.name}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">
                  Qty: ${item.quantity} | Price: ${formatPrice(item.price)} ${item.color ? `| Color: ${item.color}` : ''}
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Order Actions -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:10px; margin-top:6px; flex-wrap:wrap; gap:8px;">
          <div style="font-size:0.8rem; color:var(--text-muted);">
            Payment: <strong>${order.paymentMethod}</strong> (${order.paymentStatus})
          </div>
          <div style="display:flex; gap:8px;">
            ${
              isCancellable
                ? `
              <button class="btn btn-outline btn-sm cancel-order-btn" style="border-color:#e74c3c; color:#e74c3c;" data-order-id="${order._id}">
                Cancel Order
              </button>
            `
                : ''
            }
            <button class="btn btn-ghost btn-sm view-details-btn" data-order-id="${order._id}">
              Details
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  setupOrderActions(container);
}

function setupOrderActions(container) {
  // Cancel Order
  container.querySelectorAll('.cancel-order-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const orderId = btn.getAttribute('data-order-id');
      if (!confirm('Are you sure you want to cancel this order?')) return;

      btn.disabled = true;
      btn.textContent = 'Cancelling...';
      try {
        await api.orders.cancel(orderId);
        showToast('Order cancelled successfully', 'info');
        await loadOrders();
      } catch (err) {
        showToast(err.message || 'Failed to cancel order', 'error');
        btn.disabled = false;
        btn.textContent = 'Cancel Order';
      }
    });
  });

  // View Details
  container.querySelectorAll('.view-details-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const orderId = btn.getAttribute('data-order-id');
      try {
        const res = await api.orders.getById(orderId);
        renderOrderDetailsModal(res.data);
      } catch (err) {
        showToast(err.message || 'Failed to load order details', 'error');
      }
    });
  });
}

function renderOrderDetailsModal(order) {
  // Create modal markup dynamically
  const modalWrap = document.createElement('div');
  modalWrap.className = 'modal-overlay';
  modalWrap.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Order Details</h3>
        <button class="btn btn-icon close-modal-btn" style="font-size:1.5rem;">&times;</button>
      </div>
      <div>
        <div style="margin-bottom:16px;">
          <strong style="font-size:0.85rem; color:var(--text-muted);">ORDER ID:</strong><br>
          <code>${order._id}</code>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div>
            <strong style="font-size:0.85rem; color:var(--text-muted);">SHIPPING ADDRESS:</strong><br>
            <p style="font-size:0.88rem; margin-top:4px; line-height:1.5;">
              <strong>${order.shippingAddress.fullName}</strong><br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>
          <div>
            <strong style="font-size:0.85rem; color:var(--text-muted);">BILLING DETAILS:</strong><br>
            <table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:4px;">
              <tr>
                <td style="padding:4px 0;">Subtotal</td>
                <td style="text-align:right;">${formatPrice(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;">Shipping</td>
                <td style="text-align:right;">${order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}</td>
              </tr>
              <tr style="font-weight:700; border-top:1px solid var(--border);">
                <td style="padding:6px 0;">Total Paid</td>
                <td style="text-align:right; color:var(--accent);">${formatPrice(order.totalAmount)}</td>
              </tr>
            </table>
          </div>
        </div>

        <strong style="font-size:0.85rem; color:var(--text-muted);">STATUS HISTORY:</strong>
        <div style="margin-top:8px; border-left:2px solid var(--border); padding-left:14px; display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          ${order.statusHistory
            .map(
              (hist) => `
            <div style="position:relative;">
              <div style="position:absolute; left:-20px; top:4px; width:10px; height:10px; border-radius:50%; background:var(--accent);"></div>
              <strong style="font-size:0.88rem; display:block;">${hist.status}</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">${new Date(hist.updatedAt).toLocaleString('en-IN')}</span>
              ${hist.note ? `<p style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">${hist.note}</p>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalWrap);

  const closeModal = () => modalWrap.remove();
  modalWrap.querySelector('.close-modal-btn').addEventListener('click', closeModal);
  modalWrap.addEventListener('click', (e) => {
    if (e.target === modalWrap) closeModal();
  });
}
