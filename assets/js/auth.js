
/* Apply saved dark mode on pages that do not load main.js */
(function applySavedThemeForAuthPages(){
  if (window.__roseThreadThemeReady) return;
  const themeKey = "rose-thread-theme";
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === "dark") document.body.classList.add("dark-mode");
})();

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

/* ==============================
   Shared storage helpers + guest checkout
   This site has no accounts or login: orders are placed as a guest using
   the name/email/phone entered directly in the checkout form.
============================== */

const ORDER_KEY = "boutiqueOrders";
const CART_STORAGE_KEY = "rosethread-cart";
const BUY_NOW_KEY = "rosethread-buy-now";

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function clearErrors() { document.querySelectorAll(".form-error").forEach((el) => { el.textContent = ""; }); }
function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

/* Guest checkout: just make sure the cart isn't empty before moving on */
function setupCustomerOrderProtection() {
  const paymentBtn = document.getElementById("placeOrderBtn");
  if (!paymentBtn) return;
  paymentBtn.addEventListener("click", (event) => {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    if (cart.length === 0) {
      event.preventDefault();
      alert("Your cart is empty.");
    }
  });
}

function getCurrentCartItems() {
  try { return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || []; }
  catch { return []; }
}

function isBuyNowCheckout() {
  const params = new URLSearchParams(window.location.search);
  return params.get("buyNow") === "1" || params.get("mode") === "buy-now";
}

function getBuyNowItems() {
  try {
    const item = JSON.parse(localStorage.getItem(BUY_NOW_KEY));
    return item ? [item] : [];
  } catch {
    return [];
  }
}

function getCheckoutItems() {
  return isBuyNowCheckout() ? getBuyNowItems() : getCurrentCartItems();
}

function clearPurchasedCheckoutItems() {
  if (isBuyNowCheckout()) {
    localStorage.removeItem(BUY_NOW_KEY);
  } else {
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}

function calculateCheckoutTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
  const tax = Math.round(subtotal * 0.02);
  return { subtotal, tax, total: subtotal + tax };
}

function rupee(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function renderCheckoutPage() {
  if (!document.body.dataset.checkoutPage) return;
  const cart = getCheckoutItems();
  const buyNowMode = isBuyNowCheckout();
  const itemsBox = document.getElementById("checkoutItems");
  const emptyBox = document.getElementById("checkoutEmpty");
  const form = document.getElementById("checkoutForm");
  const totals = calculateCheckoutTotals(cart);

  const backLink = form ? form.querySelector('a.btn-outline-boutique') : null;
  if (backLink && buyNowMode && cart[0]) {
    backLink.href = "product-details.html?id=" + encodeURIComponent(cart[0].id);
    backLink.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back to Product';
  }

  if (cart.length === 0) {
    if (emptyBox) emptyBox.classList.remove("d-none");
    if (form) form.classList.add("checkout-disabled");
    if (itemsBox) itemsBox.innerHTML = buyNowMode
      ? '<p class="text-muted-custom mb-0">No product selected for direct checkout. Please choose a product again.</p>'
      : '<p class="text-muted-custom mb-0">No items available for checkout.</p>';
  } else {
    if (emptyBox) emptyBox.classList.add("d-none");
    if (itemsBox) {
      itemsBox.innerHTML = cart.map((item) => `
        <div class="checkout-item">
          ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<span class="checkout-item-placeholder"><i class="fa-solid fa-shirt"></i></span>'}
          <div>
            <strong>${item.name}</strong>
            <small>${item.size ? `Size: ${item.size} | ` : ""}${item.color ? `Color: ${item.color} | ` : ""}Qty: ${item.quantity} × ${rupee(item.price)}</small>
          </div>
          <b>${rupee(Number(item.price) * Number(item.quantity || 1))}</b>
        </div>
      `).join("");
    }
  }

  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText("checkoutSubtotal", rupee(totals.subtotal));
  setText("checkoutTax", rupee(totals.tax));
  setText("checkoutTotal", rupee(totals.total));
}

function setupCheckoutPayment() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const cart = getCheckoutItems();
    const buyNowMode = isBuyNowCheckout();
    const message = document.getElementById("checkoutMessage");

    if (cart.length === 0) {
      alert(buyNowMode ? "Please choose a product before direct checkout." : "Your cart is empty.");
      window.location.href = buyNowMode ? "collections.html" : "cart.html";
      return;
    }

    let valid = true;
    form.querySelectorAll("[data-checkout-required]").forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("is-invalid");
        valid = false;
      } else {
        field.classList.remove("is-invalid");
      }
    });
    const emailField = document.getElementById("checkoutEmail");
    if (emailField && !isEmail(emailField.value.trim())) {
      emailField.classList.add("is-invalid");
      valid = false;
    }
    if (!valid) {
      if (message) {
        message.className = "checkout-message error";
        message.textContent = "Please fill all required checkout details correctly.";
      }
      return;
    }

    const totals = calculateCheckoutTotals(cart);
    const order = {
      orderId: "RT" + Date.now(),
      customerName: document.getElementById("checkoutName").value.trim(),
      email: document.getElementById("checkoutEmail").value.trim().toLowerCase(),
      phone: document.getElementById("checkoutPhone").value.trim(),
      address: document.getElementById("checkoutAddress").value.trim(),
      city: document.getElementById("checkoutCity").value.trim(),
      pincode: document.getElementById("checkoutPincode").value.trim(),
      paymentMethod: document.getElementById("paymentMethod").value,
      items: cart,
      subtotal: totals.subtotal,
      tax: totals.tax,
      amount: totals.total,
      status: "Payment Completed",
      placedAt: new Date().toISOString()
    };

    const orders = getData(ORDER_KEY);
    orders.push(order);
    saveData(ORDER_KEY, orders);
    clearPurchasedCheckoutItems();
    if (typeof updateCartCount === "function") updateCartCount();

    if (message) {
      message.className = "checkout-message success";
      message.textContent = "Payment successful! Order #" + order.orderId + " placed successfully. A confirmation has been recorded for " + order.email + ".";
    }
    form.classList.add("checkout-disabled");
    setTimeout(() => { window.location.href = "index.html"; }, 2200);
  });
}


const MESSAGE_KEY = "boutiqueMessages";

/* ==============================
   Contact Page Form
   The form previously posted to a placeholder Formspree endpoint
   (https://formspree.io/f/XXXXX), which navigated the visitor away to a
   real "Form not found" error page on submit. This is a static demo site
   with no backend, so instead the message is saved into the boutiqueMessages
   localStorage store and a success confirmation is shown in place.
============================== */
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const statusBox = document.getElementById("contactFormStatus");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.querySelector(".is-invalid")) return;

    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");
    const messageField = document.getElementById("message");

    const messages = getData(MESSAGE_KEY);
    messages.push({
      id: "m" + Date.now(),
      name: nameField ? nameField.value.trim() : "",
      email: emailField ? emailField.value.trim() : "",
      subject: "Website Contact Form",
      message: messageField ? messageField.value.trim() : "",
      replied: false,
      replyText: ""
    });
    saveData(MESSAGE_KEY, messages);

    form.reset();
    if (statusBox) {
      statusBox.classList.remove("d-none");
      statusBox.textContent = "Message sent successfully. Our team will get back to you within one business day.";
      setTimeout(() => { statusBox.classList.add("d-none"); }, 4000);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupCustomerOrderProtection();
  renderCheckoutPage();
  setupCheckoutPayment();
  setupContactForm();
});
