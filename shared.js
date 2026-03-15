/* ============================================================
   AhiaGlobal — Shared JS
   Cart · Auth · Toast · Navigation helper
   ============================================================ */

/* ---------- Cart State ---------- */
let cart = JSON.parse(localStorage.getItem('ag_cart') || '[]');
// cart item: { id, name, price, qty, img }

function saveCart() {
  localStorage.setItem('ag_cart', JSON.stringify(cart));
}

function cartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
}

function addItem(id, name, price, img = '') {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price: typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')), qty: 1, img });
  }
  saveCart();
  updateAllCartBadges();
  showToast('success', 'Added to Cart', `${name} added to your cart.`);
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateAllCartBadges();
}

function updateAllCartBadges() {
  const count = cartCount();
  const total = '$' + cartTotal();
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    el.textContent = count;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 300);
  });
  document.querySelectorAll('.cart-total-label').forEach(el => el.textContent = total);
  // also sync mob drawer badge
  const mob = document.getElementById('mob-cart-badge');
  if (mob) mob.textContent = count;
}

/* ---------- Auth State ---------- */
let currentUser = JSON.parse(localStorage.getItem('ag_user') || 'null');

function isLoggedIn() { return !!currentUser; }

function doLogin(email, name) {
  currentUser = { email, name: name || email.split('@')[0] };
  localStorage.setItem('ag_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeAuth();
  showToast('success', 'Welcome back!', `Signed in as ${currentUser.name}`);
}

function doSignup(email, firstName, lastName) {
  const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
  currentUser = { email, name };
  localStorage.setItem('ag_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeAuth();
  showToast('success', 'Account created!', `Welcome to AhiaGlobal, ${name}!`);
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('ag_user');
  updateAuthUI();
  closeMobileMenu && closeMobileMenu();
  showToast('info', 'Signed out', 'You have been signed out successfully.');
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  // Desktop header auth button
  const btn = document.getElementById('header-auth-btn');
  const label = document.getElementById('header-auth-label');
  if (btn && label) {
    if (loggedIn) {
      label.textContent = currentUser.name.split(' ')[0];
    } else {
      label.textContent = 'Sign In';
    }
  }
  // Mobile drawer
  const mobGuest = document.getElementById('mob-guest');
  const mobLoggedIn = document.getElementById('mob-loggedin');
  const mobName = document.getElementById('mob-name');
  const mobAvatar = document.getElementById('mob-avatar');
  const mobLogoutBtn = document.getElementById('mob-logout-btn');
  if (mobGuest) mobGuest.classList.toggle('hidden', loggedIn);
  if (mobLoggedIn) mobLoggedIn.classList.toggle('hidden', !loggedIn);
  if (loggedIn && mobName) mobName.textContent = currentUser.name;
  if (loggedIn && mobAvatar) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    mobAvatar.textContent = initials;
  }
  if (mobLogoutBtn) mobLogoutBtn.classList.toggle('hidden', !loggedIn);
}

/* ---------- Auth Modal ---------- */
function openAuth(panel = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  switchAuth(panel);
  setTimeout(() => lucide && lucide.createIcons(), 50);
}

function closeAuth() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function switchAuth(panel) {
  const loginPanel = document.getElementById('panel-login');
  const signupPanel = document.getElementById('panel-signup');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  if (!loginPanel || !signupPanel) return;
  if (panel === 'login') {
    loginPanel.classList.remove('hidden');
    signupPanel.classList.add('hidden');
    tabLogin && (tabLogin.className = 'flex-1 py-4 text-sm font-semibold text-primary-600 border-b-2 border-primary-600 transition-all');
    tabSignup && (tabSignup.className = 'flex-1 py-4 text-sm font-semibold text-neutral-400 border-b-2 border-transparent transition-all hover:text-neutral-700');
  } else {
    signupPanel.classList.remove('hidden');
    loginPanel.classList.add('hidden');
    tabSignup && (tabSignup.className = 'flex-1 py-4 text-sm font-semibold text-primary-600 border-b-2 border-primary-600 transition-all');
    tabLogin && (tabLogin.className = 'flex-1 py-4 text-sm font-semibold text-neutral-400 border-b-2 border-transparent transition-all hover:text-neutral-700');
  }
}

function handleLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const pw = document.getElementById('login-pw')?.value;
  if (!email || !pw) { showToast('error', 'Missing fields', 'Please enter your email and password.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { showToast('error', 'Invalid email', 'Please enter a valid email address.'); return; }
  doLogin(email);
}

function handleSignup() {
  const email = document.getElementById('signup-email')?.value?.trim();
  const pw = document.getElementById('signup-pw')?.value;
  const firstName = document.getElementById('signup-firstname')?.value?.trim();
  const lastName = document.getElementById('signup-lastname')?.value?.trim();
  const agree = document.getElementById('signup-agree')?.checked;
  if (!email || !pw || !firstName) { showToast('error', 'Missing fields', 'Please fill in all required fields.'); return; }
  if (!agree) { showToast('error', 'Terms required', 'Please accept the Terms of Service.'); return; }
  if (pw.length < 8) { showToast('error', 'Weak password', 'Password must be at least 8 characters.'); return; }
  doSignup(email, firstName, lastName);
}

function handleSocialAuth(provider) {
  doLogin(`user@${provider.toLowerCase()}.com`, `${provider} User`);
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i data-lucide="eye" class="w-4 h-4"></i>';
  }
  lucide && lucide.createIcons();
}

/* ---------- Mobile Menu ---------- */
function openMobileMenu() {
  document.getElementById('mobile-menu')?.classList.add('open');
  document.getElementById('menu-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  document.getElementById('mobile-menu')?.classList.remove('open');
  document.getElementById('menu-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ---------- Toast ---------- */
// type: 'success' | 'error' | 'info' | 'warn'
function showToast(type = 'success', title = '', message = '') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
    warn:    'bg-amber-50 border-amber-200 text-amber-700',
  };
  const icons = {
    success: 'check-circle',
    error:   'x-circle',
    info:    'info',
    warn:    'alert-triangle',
  };

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-hover w-full ${colors[type] || colors.info}`;
  toast.style.cssText = 'animation:toastSlideIn .35s ease forwards,toastIn .35s ease forwards;';
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm">${title}</p>
      ${message ? `<p class="text-xs opacity-80 mt-0.5">${message}</p>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>`;

  stack.appendChild(toast);
  lucide && lucide.createIcons();
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut .3s ease forwards,toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ---------- Flash Sale Timer ---------- */
function startFlashTimer(elementId = 'flash-timer') {
  let secs = 5 * 3600 + 23 * 60 + 45;
  const tick = () => {
    const el = document.getElementById(elementId);
    if (!el) return;
    secs = secs > 0 ? secs - 1 : 5 * 3600 + 23 * 60 + 45;
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- Wishlist toggle ---------- */
function toggleWishlist(btn, productName = 'Item') {
  const isWished = btn.classList.contains('wished');
  if (isWished) {
    btn.classList.remove('wished', 'text-red-500');
    btn.classList.add('text-neutral-400');
    btn.querySelector('svg')?.setAttribute('fill', 'none');
    showToast('info', 'Removed from wishlist', `${productName} removed.`);
  } else {
    btn.classList.add('wished', 'text-red-500');
    btn.classList.remove('text-neutral-400');
    btn.querySelector('svg')?.setAttribute('fill', 'currentColor');
    showToast('success', 'Saved to wishlist', `${productName} added to your wishlist.`);
  }
}

/* ---------- Init on DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateAllCartBadges();
  updateAuthUI();

  // Close auth modal on backdrop click
  document.getElementById('auth-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeAuth();
  });

  // Escape key closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAuth(); closeMobileMenu(); }
  });

  // Init lucide
  lucide && lucide.createIcons();
});
