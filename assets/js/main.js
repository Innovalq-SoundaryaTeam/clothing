/* =====================================================
   Rose & Thread Boutique - Main JavaScript
   Dark mode, validation, countdown, small interactions
===================================================== */
'use strict';

const storageKey = 'rose-thread-theme';
const body = document.body;
const savedTheme = localStorage.getItem(storageKey);
if (savedTheme === 'dark') body.classList.add('dark-mode');
if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) body.classList.add('dark-mode');
window.__roseThreadThemeReady = true;

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem(storageKey, body.classList.contains('dark-mode') ? 'dark' : 'light');
    button.setAttribute('aria-pressed', body.classList.contains('dark-mode').toString());
  });
});

function showError(field, message) {
  const holder = field.parentElement.querySelector('.error-message');
  field.classList.toggle('is-invalid', Boolean(message));
  if (holder) holder.textContent = message || '';
}

function validateEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

document.querySelectorAll('form[data-validate="true"]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    let valid = true;
    form.querySelectorAll('[data-required="true"]').forEach((field) => {
      const value = field.value.trim();
      let message = '';
      if (!value) message = 'This field is required.';
      if (!message && field.type === 'email' && !validateEmail(value)) message = 'Enter a valid email address.';
      showError(field, message);
      if (message) valid = false;
    });
    if (!valid) event.preventDefault();
  });
});

const countdown = document.querySelector('[data-countdown]');
if (countdown) {
  const target = new Date(countdown.getAttribute('data-countdown')).getTime();
  const updateCountdown = () => {
    const diff = Math.max(target - Date.now(), 0);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdown.querySelector('[data-days]').textContent = days.toString().padStart(2, '0');
    countdown.querySelector('[data-hours]').textContent = hours.toString().padStart(2, '0');
    countdown.querySelector('[data-minutes]').textContent = minutes.toString().padStart(2, '0');
    countdown.querySelector('[data-seconds]').textContent = seconds.toString().padStart(2, '0');
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);
}


/* ======================================================
   Rose & Thread Boutique — Cart System
   Handles: Add to Cart, Badge, Toast, Cart Page Render,
   Qty Controls, Remove, Clear Cart, GST Tax, Wishlist
====================================================== */
'use strict';

const CART_KEY = 'rosethread-cart';

/* ── Helpers ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/* ── Cart count badge ── */
function updateCartCount() {
  const count = getCart().reduce((t, i) => t + i.quantity, 0);
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ── Toast notification ── */
function showToast(name) {
  let toast = document.getElementById('cartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-check-circle"></i>&nbsp;<strong>${name}</strong>&nbsp;added to cart!&nbsp;<a href="cart.html" style="color:var(--color-accent);font-weight:700;">View Cart</a>`;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ── Core: add item ── */
function addToCart(btn) {
  const id = btn.dataset.id || ('item-' + Date.now());
  const name = btn.dataset.name || 'Item';
  const price = Number(btn.dataset.price) || 0;
  const image = btn.dataset.image || '';

  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  existing ? existing.quantity++ : cart.push({ id, name, price, image, quantity: 1 });

  saveCart(cart);
  updateCartCount();
  showToast(name);

  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  btn.disabled = true;
  setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 1500);
}

/* ── Wire all .add-to-cart buttons ── */
function setupAddToCart() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn));
  });
}

/* ── Product detail page: qty selector + main add btn ── */
function setupDetailQty() {
  const qtySpan = document.getElementById('detailQty');
  const btnMinus = document.getElementById('qtyMinus');
  const btnPlus = document.getElementById('qtyPlus');
  const addBtn = document.getElementById('mainAddToCart');
  if (!addBtn) return;

  let qty = 1;
  if (qtySpan) qtySpan.textContent = qty;

  btnMinus && btnMinus.addEventListener('click', () => {
    if (qty > 1) { qty--; if (qtySpan) qtySpan.textContent = qty; }
  });
  btnPlus && btnPlus.addEventListener('click', () => {
    qty++; if (qtySpan) qtySpan.textContent = qty;
  });

  addBtn.addEventListener('click', () => {
    const id = addBtn.dataset.id;
    const name = addBtn.dataset.name;
    const price = Number(addBtn.dataset.price);
    const image = addBtn.dataset.image;

    const cart = getCart();
    const existing = cart.find(i => i.id === id);
    existing ? (existing.quantity += qty) : cart.push({ id, name, price, image, quantity: qty });

    saveCart(cart);
    updateCartCount();
    showToast(name);

    const original = addBtn.innerHTML;
    addBtn.innerHTML = `<i class="fa-solid fa-check"></i> Added (${qty})`;
    addBtn.disabled = true;
    setTimeout(() => { addBtn.innerHTML = original; addBtn.disabled = false; }, 1800);
  });
}

/* ── Size button toggle ── */
function setupSizeButtons() {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.size-selector').querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ── Wishlist toggle ── */
function setupWishlist() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('wishlisted');
      const icon = btn.querySelector('i');
      if (icon) { icon.classList.toggle('fa-regular'); icon.classList.toggle('fa-solid'); }
    });
  });
}

/* ── Cart page: render ── */
function renderCartPage() {
  const wrap = document.getElementById('cartItems');
  const empty = document.getElementById('emptyCart');
  const content = document.getElementById('cartContent');
  if (!wrap) return;                        /* not on cart page */

  const cart = getCart();

  if (cart.length === 0) {
    if (empty) empty.classList.remove('d-none');
    if (content) content.style.display = 'none';
    return;
  }

  if (empty) empty.classList.add('d-none');
  if (content) content.style.display = '';

  let subtotal = 0;
  wrap.innerHTML = '';

  cart.forEach(item => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="min-width:220px;">
        <div class="cart-product">
          ${item.image
        ? `<img src="${item.image}" alt="${item.name}" loading="lazy">`
        : `<div class="cart-img-placeholder"><i class="fa-solid fa-shirt"></i></div>`}
          <div>
            <h3>${item.name}</h3>
            <small>Rose &amp; Thread Boutique</small>
          </div>
        </div>
      </td>
      <td style="white-space:nowrap;">${formatINR(item.price)}</td>
      <td>
        <div class="qty-control">
          <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity of ${item.name}">−</button>
          <span>${item.quantity}</span>
          <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase quantity of ${item.name}">+</button>
        </div>
      </td>
      <td style="white-space:nowrap;font-weight:700;">${formatINR(lineTotal)}</td>
      <td>
        <button type="button" class="remove-btn" data-id="${item.id}" aria-label="Remove ${item.name} from cart">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </td>`;
    wrap.appendChild(tr);
  });

  /* Totals with 2% GST */
  const gst = Math.round(subtotal * 0.02);// 2% GST
  const total = subtotal + gst;

  const elSub = document.getElementById('cartSubtotal');
  const elTax = document.getElementById('cartTax');
  const elTot = document.getElementById('cartTotal');
  if (elSub) elSub.textContent = formatINR(subtotal);
  if (elTax) elTax.textContent = formatINR(gst);
  if (elTot) elTot.textContent = formatINR(total);

  /* Qty & remove listeners */
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getCart();
      const p = c.find(i => i.id === btn.dataset.id);
      if (!p) return;
      btn.dataset.action === 'increase' ? p.quantity++ : p.quantity--;
      saveCart(c.filter(i => i.quantity > 0));
      updateCartCount();
      renderCartPage();
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      saveCart(getCart().filter(i => i.id !== btn.dataset.id));
      updateCartCount();
      renderCartPage();
    });
  });
}

/* ── Clear cart button ── */
function setupClearCart() {
  const btn = document.getElementById('clearCartBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (window.confirm('Remove all items from your cart?')) {
      saveCart([]);
      updateCartCount();
      renderCartPage();
    }
  });
}

/* ── Promo code (UI only) ── */
function setupPromoCode() {
  const input = document.getElementById('promoCode');
  const applyBtn = input && input.closest('.promo-box') && input.closest('.promo-box').querySelector('button');
  if (!applyBtn) return;
  applyBtn.addEventListener('click', () => {
    if (!input.value.trim()) return;
    applyBtn.textContent = '✓ Applied';
    applyBtn.disabled = true;
    input.disabled = true;
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  setupAddToCart();
  setupDetailQty();
  setupSizeButtons();
  setupWishlist();
  setupClearCart();
  setupPromoCode();
  updateCartCount();
  renderCartPage();
});


/* =====================================================
   Rose & Thread Direction Manager
   Default page direction is LTR. RTL is applied only when
   the user/browser uses an RTL language or the user sets it
   through RoseThreadDirection.set('rtl') / toggle().
===================================================== */
(function () {
  if (window.__roseThreadDirectionReady) return;

  var DIRECTION_KEY = 'rose-thread-direction';
  var OLD_RTL_KEY = 'rose-thread-rtl';
  var html = document.documentElement;
  var rtlLanguages = ['ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi'];

  function normalizeDirection(direction) {
    direction = String(direction || '').toLowerCase();
    return direction === 'rtl' ? 'rtl' : direction === 'ltr' ? 'ltr' : '';
  }

  function isRtlLocale(locale) {
    if (!locale) return false;
    var lang = String(locale).toLowerCase().split('-')[0].split('_')[0];
    return rtlLanguages.indexOf(lang) !== -1;
  }

  function getAutoDirection() {
    var candidates = [];
    if (html.getAttribute('lang')) candidates.push(html.getAttribute('lang'));
    if (navigator.languages && navigator.languages.length) candidates = candidates.concat(navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
    return candidates.some(isRtlLocale) ? 'rtl' : 'ltr';
  }

  function updateDirectionButtons() {
    var isRtl = getDirection() === 'rtl';
    document.querySelectorAll('[data-rtl-toggle]').forEach(function (btn) {
      btn.innerHTML = isRtl
        ? '<i class="fa-solid fa-left-right"></i> LTR'
        : '<i class="fa-solid fa-right-left"></i> RTL';
      btn.setAttribute('aria-pressed', String(isRtl));
      btn.title = isRtl ? 'Switch to Left-to-Right layout' : 'Switch to Right-to-Left layout';
    });
  }

  function applyDirection(direction, shouldSave) {
    var safeDirection = normalizeDirection(direction) || getAutoDirection();
    html.setAttribute('dir', safeDirection);
    html.style.direction = safeDirection;
    if (shouldSave) localStorage.setItem(DIRECTION_KEY, safeDirection);
    localStorage.removeItem(OLD_RTL_KEY); // prevents old versions from forcing RTL again
    updateDirectionButtons();
    return safeDirection;
  }

  function getDirection() {
    return normalizeDirection(html.getAttribute('dir')) || 'ltr';
  }

  function getSavedDirection() {
    return normalizeDirection(localStorage.getItem(DIRECTION_KEY));
  }

  function setDirection(direction) {
    return applyDirection(direction, true);
  }

  function toggleDirection() {
    return setDirection(getDirection() === 'rtl' ? 'ltr' : 'rtl');
  }

  function resetToAutoDirection() {
    localStorage.removeItem(DIRECTION_KEY);
    localStorage.removeItem(OLD_RTL_KEY);
    return applyDirection(getAutoDirection(), false);
  }

  applyDirection(getSavedDirection() || getAutoDirection(), false);

  window.RoseThreadDirection = {
    set: setDirection,
    toggle: toggleDirection,
    get: getDirection,
    reset: resetToAutoDirection,
    auto: resetToAutoDirection
  };
  window.__roseThreadDirectionReady = true;

  document.addEventListener('DOMContentLoaded', function () {
    updateDirectionButtons();
    document.querySelectorAll('[data-rtl-toggle]').forEach(function (btn) {
      if (btn.dataset.directionReady === 'true') return;
      btn.dataset.directionReady = 'true';
      btn.addEventListener('click', function () { toggleDirection(); });
    });
  });
})();


/* =====================================================
   Small scroll reveal animations for premium feel
===================================================== */
(function () {
  function initScrollReveal() {
    var items = document.querySelectorAll('.section-title, .product-card, .boutique-card, .blog-card, .icon-box, .checkout-card, .profile-card, .profile-details-card, .filter-bar, .brand-logo, .trust-item');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('reveal-visible'); });
      return;
    }
    items.forEach(function (item) { item.classList.add('reveal-up'); });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (item) { observer.observe(item); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.setTimeout(initScrollReveal, 80);
  });
})();

const subscribeForm = document.getElementById("subscribeForm");

if (subscribeForm) {
  subscribeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    window.location.href = "404.html";
  });
}
