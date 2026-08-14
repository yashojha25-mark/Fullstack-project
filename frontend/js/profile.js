/**
 * profile.js — User profile details view and modifications
 */
import api from './api.js';
import { requireAuth, updateNavAuth } from './auth.js';
import { showToast, updateCartBadge } from './products.js';

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  await updateNavAuth();
  await updateCartBadge();

  await loadProfile();

  setupProfileListeners();
});

async function loadProfile() {
  const profileForm = document.getElementById('profile-form');
  if (!profileForm) return;

  try {
    const res = await api.user.getProfile();
    const user = res.data;

    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-phone').value = user.phone || '';
    
    if (user.address) {
      document.getElementById('profile-street').value = user.address.street || '';
      document.getElementById('profile-city').value = user.address.city || '';
      document.getElementById('profile-state').value = user.address.state || '';
      document.getElementById('profile-pincode').value = user.address.pincode || '';
    }
  } catch (err) {
    showToast(err.message || 'Failed to load profile details', 'error');
  }
}

function setupProfileListeners() {
  // Update Profile Form
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const street = document.getElementById('profile-street').value.trim();
    const city = document.getElementById('profile-city').value.trim();
    const state = document.getElementById('profile-state').value.trim();
    const pincode = document.getElementById('profile-pincode').value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
      await api.user.updateProfile({
        name,
        phone,
        address: { street, city, state, pincode },
      });
      showToast('Profile updated successfully!', 'success');
      await updateNavAuth();
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });

  // Change Password Form
  document.getElementById('change-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Changing...';

    try {
      await api.user.changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully!', 'success');
      document.getElementById('change-password-form').reset();
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Change Password';
    }
  });
}
