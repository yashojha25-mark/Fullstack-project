/**
 * admin.js — Admin operations, dashboard rendering, CRUD tables, role & order handlers
 */
import api from './api.js';
import { requireAdmin, updateNavAuth } from './auth.js';
import { showToast, formatPrice } from './products.js';

document.addEventListener('DOMContentLoaded', async () => {
  await requireAdmin();
  await updateNavAuth();

  const path = window.location.pathname;

  if (path.includes('dashboard.html')) {
    await initDashboard();
  } else if (path.includes('products.html')) {
    await initProductsManagement();
  } else if (path.includes('orders.html')) {
    await initOrdersManagement();
  } else if (path.includes('users.html')) {
    await initUsersManagement();
  } else if (path.includes('feedback.html')) {
    await initFeedbackManagement();
  } else if (path.includes('messages.html')) {
    await initMessagesManagement();
  }
});

// ── Dashboard stats & charts ──
async function initDashboard() {
  try {
    const res = await api.admin.dashboard();
    const d = res.data;

    // Fill numbers
    document.getElementById('stat-products').textContent = d.totalProducts;
    document.getElementById('stat-users').textContent = d.totalUsers;
    document.getElementById('stat-orders').textContent = d.totalOrders;
    document.getElementById('stat-revenue').textContent = formatPrice(d.totalRevenue);

    document.getElementById('stat-pending').textContent = d.pendingOrders;
    document.getElementById('stat-delivered').textContent = d.deliveredOrders;

    // Render Low Stock list
    const lowStockContainer = document.getElementById('low-stock-container');
    if (lowStockContainer) {
      if (d.lowStockProducts.length === 0) {
        lowStockContainer.innerHTML = '<p style="color:var(--text-muted);">All products are sufficiently stocked.</p>';
      } else {
        lowStockContainer.innerHTML = d.lowStockProducts
          .map(
            (p) => `
          <div class="low-stock-item">
            <span class="low-stock-name">${p.name}</span>
            <span class="low-stock-count">${p.stock} left</span>
          </div>
        `
          )
          .join('');
      }
    }

    // Render simple Pure CSS Chart representation
    const chartContainer = document.getElementById('dashboard-chart');
    if (chartContainer) {
      const stats = [
        { label: 'Pending', count: d.pendingOrders, color: 'var(--accent)' },
        { label: 'Delivered', count: d.deliveredOrders, color: 'var(--teal)' },
        { label: 'Others', count: d.totalOrders - d.pendingOrders - d.deliveredOrders, color: 'var(--text-muted)' },
      ];

      const maxVal = Math.max(...stats.map((s) => s.count), 1);

      chartContainer.innerHTML = `
        <div class="chart-bar-wrap">
          ${stats
            .map((s) => {
              const widthPct = Math.max((s.count / maxVal) * 100, 5);
              return `
              <div class="chart-bar-item">
                <span class="chart-bar-label">${s.label}</span>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="width: ${widthPct}%; background: ${s.color};"></div>
                </div>
                <span class="chart-bar-value">${s.count} orders</span>
              </div>
            `;
            })
            .join('')}
        </div>
      `;
    }
  } catch (err) {
    showToast(err.message || 'Failed to load stats', 'error');
  }
}

// ── Products Management CRUD ──
async function initProductsManagement() {
  const tableBody = document.getElementById('admin-products-table-body');
  if (!tableBody) return;

  await loadProductsTable();

  // Setup form submit logic for Add/Edit product
  const productForm = document.getElementById('admin-product-form');
  productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const brand = document.getElementById('prod-brand').value.trim();
    const category = document.getElementById('prod-category').value;
    const price = Number(document.getElementById('prod-price').value);
    const discount = Number(document.getElementById('prod-discount').value || 0);
    const stock = Number(document.getElementById('prod-stock').value);
    const shortDescription = document.getElementById('prod-short-desc').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const colors = document.getElementById('prod-colors').value.split(',').map((c) => c.trim()).filter(Boolean);
    const isNew = document.getElementById('prod-new').checked;
    const isTrending = document.getElementById('prod-trending').checked;

    // Specifications key-value pairs parsing
    const specsText = document.getElementById('prod-specs').value.trim();
    const specifications = {};
    if (specsText) {
      specsText.split('\n').forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      });
    }

    // Standard high-quality default images if empty
    const imgUrl = document.getElementById('prod-image').value.trim();
    const images = imgUrl ? [imgUrl] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

    const productPayload = {
      name,
      brand,
      category,
      price,
      discount,
      stock,
      shortDescription,
      description,
      images,
      colors,
      specifications,
      isNew,
      isTrending,
    };

    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (productId) {
        // Edit existing product
        await api.products.update(productId, productPayload);
        showToast('Product updated successfully!', 'success');
      } else {
        // Create new product
        await api.products.create(productPayload);
        showToast('Product created successfully!', 'success');
      }
      closeProductModal();
      await loadProductsTable();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Setup Add Product trigger button
  document.getElementById('add-product-btn')?.addEventListener('click', () => {
    openProductModal();
  });

  // Setup cancel / close modal actions
  document.getElementById('cancel-product-btn')?.addEventListener('click', () => {
    closeProductModal();
  });
}

async function loadProductsTable() {
  const tableBody = document.getElementById('admin-products-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading products catalog...</td></tr>';

  try {
    const res = await api.products.getAll({ limit: 100 }); // fetch large amount for management
    const products = res.data;

    if (products.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No products in database. Click Add Product to create.</td></tr>';
      return;
    }

    tableBody.innerHTML = products
      .map((p) => {
        const finalPrice = p.price - (p.price * (p.discount || 0)) / 100;
        const badgeClass = p.stock > 5 ? 'admin-badge-active' : 'admin-badge-inactive';
        const badgeLabel = p.stock > 5 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock';

        return `
        <tr data-id="${p._id}">
          <td><img src="${p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${p.name}"></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.brand}</td>
          <td>${p.category}</td>
          <td>
            <strong>${formatPrice(finalPrice)}</strong>
            ${p.discount ? `<br><small style="color:var(--text-muted); text-decoration:line-through;">${formatPrice(p.price)}</small>` : ''}
          </td>
          <td>${p.stock}</td>
          <td>★ ${p.rating || 0}</td>
          <td><span class="admin-badge ${badgeClass}">${badgeLabel}</span></td>
          <td>
            <div class="admin-actions">
              <button class="btn btn-ghost btn-sm edit-prod-btn" data-id="${p._id}">Edit</button>
              <button class="btn btn-outline btn-sm delete-prod-btn" style="color:#e74c3c; border-color:#e74c3c;" data-id="${p._id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    // Setup action handlers
    tableBody.querySelectorAll('.edit-prod-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const detailRes = await api.products.getById(id);
          openProductModal(detailRes.data);
        } catch (err) {
          showToast(err.message || 'Failed to fetch details', 'error');
        }
      });
    });

    tableBody.querySelectorAll('.delete-prod-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this product? (This will mark it as inactive)')) return;

        try {
          await api.products.delete(id);
          showToast('Product deleted successfully', 'info');
          await loadProductsTable();
        } catch (err) {
          showToast(err.message || 'Failed to delete', 'error');
        }
      });
    });
  } catch (err) {
    showToast(err.message || 'Failed to load catalog', 'error');
  }
}

function openProductModal(product = null) {
  const modal = document.getElementById('admin-product-modal');
  const form = document.getElementById('admin-product-form');
  const title = document.getElementById('modal-title-text');

  if (!modal || !form || !title) return;

  form.reset();
  document.getElementById('prod-id').value = '';

  if (product) {
    title.textContent = 'Edit Product';
    document.getElementById('prod-id').value = product._id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-brand').value = product.brand;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-discount').value = product.discount || 0;
    document.getElementById('prod-stock').value = product.stock;
    document.getElementById('prod-short-desc').value = product.shortDescription || '';
    document.getElementById('prod-desc').value = product.description || '';
    document.getElementById('prod-image').value = product.images[0] || '';
    document.getElementById('prod-colors').value = (product.colors || []).join(', ');
    document.getElementById('prod-new').checked = !!product.isNew;
    document.getElementById('prod-trending').checked = !!product.isTrending;

    // Specifications serialize
    if (product.specifications) {
      const specList = [];
      const specMap = product.specifications instanceof Map ? product.specifications : new Map(Object.entries(product.specifications));
      for (const [key, value] of specMap.entries()) {
        specList.push(`${key}: ${value}`);
      }
      document.getElementById('prod-specs').value = specList.join('\n');
    }
  } else {
    title.textContent = 'Add Trending Product';
  }

  modal.classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('admin-product-modal')?.classList.add('hidden');
}

// ── Orders Management ──
async function initOrdersManagement() {
  const tableBody = document.getElementById('admin-orders-table-body');
  if (!tableBody) return;

  await loadOrdersTable();
}

async function loadOrdersTable() {
  const tableBody = document.getElementById('admin-orders-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading orders...</td></tr>';

  try {
    const res = await api.admin.getOrders();
    const orders = res.data;

    if (orders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders placed yet.</td></tr>';
      return;
    }

    tableBody.innerHTML = orders
      .map((o) => {
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN');
        const statusClass = `status-${o.orderStatus.toLowerCase().replace(/\s+/g, '-')}`;

        return `
        <tr data-id="${o._id}">
          <td><code>${o._id.substring(12)}</code></td>
          <td>
            <strong>${o.user?.name || 'Guest User'}</strong><br>
            <small style="color:var(--text-muted);">${o.user?.email || ''}</small>
          </td>
          <td>${dateStr}</td>
          <td><strong>${formatPrice(o.totalAmount)}</strong></td>
          <td><span class="order-status ${statusClass}">${o.orderStatus}</span></td>
          <td>${o.paymentMethod}</td>
          <td>
            <div class="admin-actions">
              <select class="order-status-select" data-id="${o._id}" style="padding: 6px; border-radius:4px; font-size:0.8rem; outline:none; border:1px solid var(--border);">
                <option value="Pending" ${o.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Confirmed" ${o.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="Processing" ${o.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Shipped" ${o.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Out for Delivery" ${o.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    // Setup Select listener
    tableBody.querySelectorAll('.order-status-select').forEach((select) => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = select.value;
        const note = `Status changed by admin to ${newStatus}`;

        try {
          await api.admin.updateOrderStatus(id, newStatus, note);
          showToast(`Order status updated to ${newStatus}`, 'success');
          await loadOrdersTable();
        } catch (err) {
          showToast(err.message || 'Failed to update order status', 'error');
        }
      });
    });
  } catch (err) {
    showToast(err.message || 'Failed to load orders', 'error');
  }
}

// ── Users Management ──
async function initUsersManagement() {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;

  await loadUsersTable();
}

async function loadUsersTable() {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading users...</td></tr>';

  try {
    const res = await api.admin.getUsers();
    const users = res.data;

    tableBody.innerHTML = users
      .map((u) => {
        const dateStr = new Date(u.createdAt).toLocaleDateString('en-IN');
        return `
        <tr data-id="${u._id}">
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td>${dateStr}</td>
          <td><span class="admin-badge ${u.role === 'admin' ? 'admin-badge-active' : 'admin-badge-inactive'}">${u.role.toUpperCase()}</span></td>
          <td>
            <select class="user-role-select" data-id="${u._id}" style="padding: 6px; border-radius:4px; font-size:0.8rem; outline:none; border:1px solid var(--border);">
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
        </tr>
      `;
      })
      .join('');

    tableBody.querySelectorAll('.user-role-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.getAttribute('data-id');
        const role = select.value;

        try {
          await api.admin.updateUserRole(id, role);
          showToast('User role updated successfully', 'success');
          await loadUsersTable();
        } catch (err) {
          showToast(err.message || 'Failed to change role', 'error');
        }
      });
    });
  } catch (err) {
    showToast(err.message || 'Failed to load users list', 'error');
  }
}

// ── Feedback Management ──
async function initFeedbackManagement() {
  const container = document.getElementById('admin-feedback-list');
  if (!container) return;

  container.innerHTML = '<p style="text-align:center;">Loading customer feedback...</p>';

  try {
    const res = await api.feedback.getAll();
    const list = res.data;

    if (list.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No feedback received yet.</p>';
      return;
    }

    container.innerHTML = list
      .map(
        (f) => `
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:20px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div>
            <strong>${f.name}</strong> (${f.email})<br>
            <small style="color:var(--text-muted);">${new Date(f.createdAt).toLocaleString('en-IN')}</small>
          </div>
          <span class="stars" style="font-size:1.1rem;">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
        </div>
        <p style="color:var(--text-secondary); line-height:1.6; font-size:0.92rem;">${f.message}</p>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message || 'Failed to fetch feedback', 'error');
  }
}

// ── Messages/Contacts Management ──
async function initMessagesManagement() {
  const container = document.getElementById('admin-messages-list');
  if (!container) return;

  container.innerHTML = '<p style="text-align:center;">Loading customer messages...</p>';

  try {
    const res = await api.contact.getAll();
    const list = res.data;

    if (list.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No messages received yet.</p>';
      return;
    }

    container.innerHTML = list
      .map(
        (m) => `
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:20px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div>
            <strong>${m.name}</strong> (${m.email})<br>
            <small style="color:var(--text-muted);">${new Date(m.createdAt).toLocaleString('en-IN')}</small>
          </div>
          <strong style="color:var(--accent); font-size:0.85rem; text-transform:uppercase;">Subject: ${m.subject}</strong>
        </div>
        <p style="color:var(--text-secondary); line-height:1.6; font-size:0.92rem;">${m.message}</p>
      </div>
    `
      )
      .join('');
  } catch (err) {
    showToast(err.message || 'Failed to fetch messages', 'error');
  }
}
export { initDashboard, initProductsManagement, initOrdersManagement, initUsersManagement, initFeedbackManagement, initMessagesManagement };
