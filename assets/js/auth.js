
/* Apply saved dark mode on admin pages that do not load main.js */
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
   Separate Customer + Admin Authentication
   Front-end only demo authentication using localStorage.
   Customer signup/login is for shopping and placing orders.
   Admin signup/login is for dashboard access.
============================== */

const CUSTOMER_KEY = "boutiqueCustomers";
const ADMIN_KEY = "boutiqueAdmins";
const CUSTOMER_SESSION_KEY = "boutiqueCustomerSession";
const ADMIN_SESSION_KEY = "boutiqueAdminSession";
const ORDER_KEY = "boutiqueOrders";
const CART_STORAGE_KEY = "rosethread-cart";
const BUY_NOW_KEY = "rosethread-buy-now";
const AFTER_LOGIN_REDIRECT_KEY = "rosethread-after-login";

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function setError(id, message) { const el = document.getElementById(id); if (el) el.textContent = message; }
function clearErrors() { document.querySelectorAll(".form-error").forEach((el) => { el.textContent = ""; }); }
function showAuthMessage(message) { const box = document.getElementById("authMessage"); if (box) { box.classList.remove("d-none"); box.textContent = message; } }
function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

function setupDefaultAdmin() {
  const admins = getData(ADMIN_KEY);
  const defaultAdmin = { name: "Sarath", email: "admin@roseandthread.com", password: "12345", role: "Admin" };
  if (!admins.some((admin) => admin.email === defaultAdmin.email)) {
    admins.push(defaultAdmin);
    saveData(ADMIN_KEY, admins);
  }
}

function setupDefaultCustomer() {
  const customers = getData(CUSTOMER_KEY);
  const defaultCustomer = { name: "Demo Customer", email: "customer@roseandthread.com", phone: "9876543210", password: "12345", role: "Customer" };
  if (!customers.some((customer) => customer.email === defaultCustomer.email)) {
    customers.push(defaultCustomer);
    saveData(CUSTOMER_KEY, customers);
  }
}

function getCustomerSession() {
  try {
    const session = JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY));
    if (!session) return null;
    if (session.email && session.name && session.loggedIn !== false) {
      return { name: session.name, email: session.email, phone: session.phone || "-", role: session.role || "Customer", loggedIn: true };
    }
    return null;
  } catch {
    return null;
  }
}

function getAdminSession() {
  try {
    const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
    if (!session) return null;
    if (session.email && session.name && session.loggedIn !== false) {
      return { name: session.name, email: session.email, role: session.role || "Admin", loggedIn: true };
    }
    return null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  return (name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

function renderProfileNav() {
  const customer = getCustomerSession();
  const admin = getAdminSession();
  const activeUser = customer || admin;
  const isAdmin = Boolean(admin && !customer);
  const loginActions = '<a href="auth.html?role=customer&mode=login">Customer Login</a><a href="auth.html?role=admin&mode=login">Admin Login</a>';

  /* Remove old text based auth links if any old page still contains them. */
  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    const li = link.closest("li");
    if (li) li.remove();
  });

  document.querySelectorAll("[data-profile-link]").forEach((link) => {
    link.href = activeUser ? (isAdmin ? "admin/dashboard.html" : "profile.html") : "auth.html?role=customer&mode=login";
    link.setAttribute("aria-label", activeUser ? (isAdmin ? "Open admin dashboard" : "View logged in customer profile") : "Login from profile menu");
    link.title = activeUser ? (isAdmin ? "Open admin dashboard" : "View logged in customer profile") : "Login from profile menu";
  });

  document.querySelectorAll("[data-profile-avatar]").forEach((avatar) => {
    avatar.innerHTML = activeUser ? getInitials(activeUser.name) : '<i class="fa-regular fa-user"></i>';
  });
  document.querySelectorAll("[data-profile-status]").forEach((el) => { el.textContent = activeUser ? (isAdmin ? "Logged In Admin" : "Logged In Customer") : "Guest Profile"; });
  document.querySelectorAll("[data-profile-name]").forEach((el) => { el.textContent = activeUser ? activeUser.name : "Guest User"; });
  document.querySelectorAll("[data-profile-email]").forEach((el) => { el.textContent = activeUser ? activeUser.email : "Choose customer or admin login"; });
  document.querySelectorAll("[data-profile-actions]").forEach((el) => {
    el.innerHTML = activeUser
      ? (isAdmin
        ? '<a href="admin/dashboard.html">Dashboard</a><button type="button" data-admin-nav-logout>Logout</button>'
        : '<a href="profile.html">View Profile</a><button type="button" data-customer-logout>Logout</button>')
      : loginActions;
  });
}

/* Profile dropdown only opens on hover/focus by default, which touch screens
   never trigger. On mobile, tapping the avatar used to just navigate straight
   to the default link and the login options were never seen. This makes the
   first tap open the dropdown (so Customer/Admin Login are visible) and a
   second tap or an outside tap continues/closes as normal. */
function setupMobileProfileDropdown() {
  document.addEventListener("click", (event) => {
    const isMobile = window.matchMedia("(max-width: 991.98px)").matches;
    const trigger = event.target.closest("[data-profile-link]");
    const wrapper = event.target.closest(".profile-nav-wrapper");

    if (isMobile && trigger) {
      const parentWrapper = trigger.closest(".profile-nav-wrapper");
      if (parentWrapper && !parentWrapper.classList.contains("profile-dropdown-open")) {
        event.preventDefault();
        document.querySelectorAll(".profile-nav-wrapper").forEach((w) => w.classList.remove("profile-dropdown-open"));
        parentWrapper.classList.add("profile-dropdown-open");
        return;
      }
    }

    if (!wrapper) {
      document.querySelectorAll(".profile-nav-wrapper").forEach((w) => w.classList.remove("profile-dropdown-open"));
    }
  });
}

function renderCustomerProfilePage() {
  if (!document.body.dataset.profilePage) return;
  const customer = getCustomerSession();
  const orders = getData(ORDER_KEY).filter((order) => customer && order.email === customer.email);

  const setText = (selector, value) => document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
  const avatar = document.querySelector("[data-profile-page-avatar]");
  const loginBtn = document.querySelector("[data-profile-login-btn]");
  const logoutBtn = document.querySelector("[data-profile-logout-btn]");
  const orderBody = document.querySelector("[data-profile-orders]");

  if (!customer) {
    if (avatar) avatar.innerHTML = '<i class="fa-regular fa-user"></i>';
    setText("[data-profile-page-name]", "Guest User");
    setText("[data-profile-page-email]", "Please login to view profile details.");
    setText("[data-profile-page-status]", "Not Logged In");
    setText("[data-profile-full-name]", "-");
    setText("[data-profile-full-email]", "-");
    setText("[data-profile-phone]", "-");
    setText("[data-profile-role]", "-");
    setText("[data-profile-order-count]", "0 Orders");
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (orderBody) orderBody.innerHTML = '<tr><td colspan="4" class="text-muted-custom">Login to see your order history.</td></tr>';
    return;
  }

  if (avatar) avatar.textContent = getInitials(customer.name);
  setText("[data-profile-page-name]", customer.name);
  setText("[data-profile-page-email]", customer.email);
  setText("[data-profile-page-status]", "Logged In");
  setText("[data-profile-full-name]", customer.name);
  setText("[data-profile-full-email]", customer.email);
  setText("[data-profile-phone]", customer.phone || "-");
  setText("[data-profile-role]", customer.role || "Customer");
  setText("[data-profile-order-count]", orders.length + (orders.length === 1 ? " Order" : " Orders"));
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-flex";

  if (!orderBody) return;
  if (orders.length === 0) {
    orderBody.innerHTML = '<tr><td colspan="4" class="text-muted-custom">No orders placed yet.</td></tr>';
    return;
  }
  orderBody.innerHTML = orders.slice().reverse().map((order) => {
    const itemCount = Array.isArray(order.items) ? order.items.reduce((total, item) => total + Number(item.quantity || 0), 0) : 0;
    return `<tr><td>#${order.orderId}</td><td>${itemCount} item${itemCount === 1 ? "" : "s"}</td><td>₹${Number(order.amount).toLocaleString("en-IN")}</td><td><span class="status-badge">${order.status}</span></td></tr>`;
  }).join("");
}

function setupPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    if (button.dataset.passwordToggleReady === "true") return;
    button.dataset.passwordToggleReady = "true";
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.passwordToggle);
      if (!target) return;
      target.type = target.type === "password" ? "text" : "password";
      button.innerHTML = target.type === "password" ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });
  });
}

/* Customer Signup */
function setupCustomerRegister() {
  const form = document.getElementById("customerRegisterForm") || (document.body.dataset.authType === "customer-register" ? document.getElementById("registerForm") : null);
  if (!form || !document.getElementById("fullName") || !document.getElementById("email")) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const terms = document.getElementById("terms") ? document.getElementById("terms").checked : true;
    let valid = true;
    if (name.length < 3) { setError("nameError", "Enter at least 3 characters."); valid = false; }
    if (!isEmail(email)) { setError("emailError", "Enter a valid email address."); valid = false; }
    if (phone.length < 10) { setError("phoneError", "Enter a valid mobile number."); valid = false; }
    if (password.length < 5) { setError("passwordError", "Password must have at least 5 characters."); valid = false; }
    if (password !== confirmPassword) { setError("confirmError", "Passwords do not match."); valid = false; }
    if (!terms) { setError("termsError", "Please accept the terms."); valid = false; }
    if (!valid) return;
    const customers = getData(CUSTOMER_KEY);
    if (customers.some((user) => user.email === email)) { setError("emailError", "This customer email is already registered."); return; }
    customers.push({ name, email, phone, password, role: "Customer" });
    saveData(CUSTOMER_KEY, customers);
    showAuthMessage("Customer account created successfully. Please login to place order.");
    setTimeout(() => { window.location.href = "login.html"; }, 900);
  });
}

/* Customer Login */
function setupCustomerLogin() {
  const form = document.getElementById("customerLoginForm") || (document.body.dataset.authType === "customer-login" ? document.getElementById("loginForm") : null);
  if (!form || !document.getElementById("email") || !document.getElementById("password")) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    if (!isEmail(email)) { setError("emailError", "Enter your customer email."); return; }
    if (!password) { setError("passwordError", "Enter your password."); return; }
    const customer = getData(CUSTOMER_KEY).find((item) => item.email === email && item.password === password);
    if (!customer) { setError("passwordError", "Invalid customer email or password."); return; }
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ name: customer.name, email: customer.email, phone: customer.phone, role: "Customer", loggedIn: true }));
    const redirectAfterLogin = localStorage.getItem(AFTER_LOGIN_REDIRECT_KEY);
    localStorage.removeItem(AFTER_LOGIN_REDIRECT_KEY);
    showAuthMessage(redirectAfterLogin ? "Customer login successful. Opening checkout..." : "Customer login successful. Redirecting to cart...");
    setTimeout(() => { window.location.href = redirectAfterLogin || "cart.html"; }, 700);
  });
}


/* Customer Forgot Password - localStorage demo reset */
function resetCustomerPasswordByEmail(email, newPassword, confirmPassword, setFieldError) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const password = String(newPassword || "").trim();
  const confirm = String(confirmPassword || "").trim();

  if (!isEmail(normalizedEmail)) {
    setFieldError("email", "Enter your registered customer email.");
    return false;
  }
  if (password.length < 5) {
    setFieldError("password", "New password must be at least 5 characters.");
    return false;
  }
  if (password !== confirm) {
    setFieldError("confirm", "Passwords do not match.");
    return false;
  }

  const customers = getData(CUSTOMER_KEY);
  const index = customers.findIndex((user) => user.email === normalizedEmail);
  if (index === -1) {
    setFieldError("email", "No customer account found with this email.");
    return false;
  }

  customers[index].password = password;
  saveData(CUSTOMER_KEY, customers);
  return true;
}

function setupCustomerForgotPassword() {
  const showForgotLink = document.getElementById("showForgotPassword");
  const backToLoginLink = document.getElementById("backToLogin");
  const loginForm = document.getElementById("customerLoginForm");
  const forgotBox = document.getElementById("forgotPasswordBox");
  const forgotLinkRow = document.getElementById("forgotLinkRow");

  if (showForgotLink && forgotBox) {
    showForgotLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (loginForm) loginForm.classList.add("d-none");
      if (forgotLinkRow) forgotLinkRow.classList.add("d-none");
      forgotBox.classList.remove("d-none");
      clearErrors();
      showAuthMessage("Enter your registered email and set a new password.");
    });
  }

  if (backToLoginLink && forgotBox) {
    backToLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      forgotBox.classList.add("d-none");
      if (loginForm) loginForm.classList.remove("d-none");
      if (forgotLinkRow) forgotLinkRow.classList.remove("d-none");
      clearErrors();
      const box = document.getElementById("authMessage");
      if (box) { box.classList.add("d-none"); box.textContent = ""; }
    });
  }

  const simpleForm = document.getElementById("customerForgotPasswordForm");
  if (simpleForm) {
    simpleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors();

      const success = resetCustomerPasswordByEmail(
        document.getElementById("forgotEmail") ? document.getElementById("forgotEmail").value : "",
        document.getElementById("forgotPassword") ? document.getElementById("forgotPassword").value : "",
        document.getElementById("forgotConfirmPassword") ? document.getElementById("forgotConfirmPassword").value : "",
        (field, message) => {
          const map = { email: "forgotEmailError", password: "forgotPasswordError", confirm: "forgotConfirmError" };
          setError(map[field], message);
        }
      );

      if (!success) return;
      showAuthMessage("Password reset successful. Please login with your new password.");
      simpleForm.reset();
      setTimeout(() => {
        if (forgotBox) forgotBox.classList.add("d-none");
        if (loginForm) loginForm.classList.remove("d-none");
        if (forgotLinkRow) forgotLinkRow.classList.remove("d-none");
      }, 900);
    });
  }

  const portalForm = document.getElementById("customerForgotPortalForm");
  if (portalForm) {
    portalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearErrors();

      const success = resetCustomerPasswordByEmail(
        document.getElementById("cf-email") ? document.getElementById("cf-email").value : "",
        document.getElementById("cf-password") ? document.getElementById("cf-password").value : "",
        document.getElementById("cf-confirm") ? document.getElementById("cf-confirm").value : "",
        (field, message) => {
          const map = { email: "cf-emailError", password: "cf-passwordError", confirm: "cf-confirmError" };
          setError(map[field], message);
        }
      );

      if (!success) return;
      showAuthMessage("Password reset successful. Please login with your new password.");
      portalForm.reset();
      setTimeout(() => {
        if (typeof switchMode === "function") switchMode("login");
      }, 900);
    });
  }
}


/* Admin Signup */
function setupAdminRegister() {
  const form = document.getElementById("adminRegisterForm");
  if (!form || !document.getElementById("fullName") || !document.getElementById("email")) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    let valid = true;
    if (name.length < 3) { setError("nameError", "Enter admin name."); valid = false; }
    if (!isEmail(email)) { setError("emailError", "Enter a valid admin email."); valid = false; }
    if (password.length < 5) { setError("passwordError", "Password must have at least 5 characters."); valid = false; }
    if (password !== confirmPassword) { setError("confirmError", "Passwords do not match."); valid = false; }
    if (!valid) return;
    const admins = getData(ADMIN_KEY);
    if (admins.some((admin) => admin.email === email)) { setError("emailError", "This admin email is already registered."); return; }
    admins.push({ name, email, password, role: "Admin" });
    saveData(ADMIN_KEY, admins);
    showAuthMessage("Admin account created successfully. Please login.");
    setTimeout(() => { window.location.href = "admin-login.html"; }, 900);
  });
}

/* Admin Login */
function setupAdminLogin() {
  const form = document.getElementById("adminLoginForm");
  if (!form || !document.getElementById("email") || !document.getElementById("password")) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    if (!isEmail(email)) { setError("emailError", "Enter your admin email."); return; }
    if (!password) { setError("passwordError", "Enter your password."); return; }
    const admin = getData(ADMIN_KEY).find((item) => item.email === email && item.password === password);
    if (!admin) { setError("passwordError", "Invalid admin email or password."); return; }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ name: admin.name, email: admin.email, role: "Admin", loggedIn: true }));
    showAuthMessage("Admin login successful. Opening dashboard...");
    setTimeout(() => { window.location.href = "admin/dashboard.html"; }, 700);
  });
}

/* Protect admin dashboard pages */
function protectAdminPages() {
  if (!document.body.dataset.adminPage) return;
  const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
  if (!session || !session.loggedIn) { window.location.href = "../admin-login.html"; return; }
  document.querySelectorAll("[data-admin-name]").forEach((el) => { el.textContent = session.name; });
}

function setupLogout() {
  document.addEventListener("click", (event) => {
    const adminLogout = event.target.closest("[data-logout]");
    if (adminLogout) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      window.location.href = "../admin-login.html";
      return;
    }

    const adminNavLogout = event.target.closest("[data-admin-nav-logout]");
    if (adminNavLogout) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      renderProfileNav();
      window.location.href = "auth.html?role=admin&mode=login";
      return;
    }

    const customerLogout = event.target.closest("[data-customer-logout]");
    if (customerLogout) {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      renderProfileNav();
      if (document.body.dataset.profilePage) {
        window.location.href = "login.html";
      } else {
        window.location.href = "login.html";
      }
    }
  });
}

/* Customer must login before payment/order */
function setupCustomerOrderProtection() {
  const paymentBtn = document.getElementById("placeOrderBtn");
  if (!paymentBtn) return;
  paymentBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const customer = getCustomerSession();
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    if (!customer) {
      alert("Please signup/login as customer before payment.");
      window.location.href = "login.html";
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    window.location.href = "checkout.html";
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
  const customer = getCustomerSession();
  const cart = getCheckoutItems();
  const buyNowMode = isBuyNowCheckout();
  const itemsBox = document.getElementById("checkoutItems");
  const emptyBox = document.getElementById("checkoutEmpty");
  const form = document.getElementById("checkoutForm");
  const totals = calculateCheckoutTotals(cart);

  if (!customer) {
    localStorage.setItem(AFTER_LOGIN_REDIRECT_KEY, "checkout.html" + window.location.search);
    if (itemsBox) itemsBox.innerHTML = '<p class="text-muted-custom mb-0">Please login as customer to continue payment.</p>';
    if (form) form.classList.add("checkout-disabled");
    const message = document.getElementById("checkoutMessage");
    if (message) {
      message.className = "checkout-message error";
      message.textContent = "Login required. Redirecting to customer login...";
    }
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
    return;
  }

  const nameField = document.getElementById("checkoutName");
  const emailField = document.getElementById("checkoutEmail");
  const phoneField = document.getElementById("checkoutPhone");
  if (nameField && !nameField.value) nameField.value = customer.name || "";
  if (emailField && !emailField.value) emailField.value = customer.email || "";
  if (phoneField && !phoneField.value) phoneField.value = customer.phone || "";

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
    const customer = getCustomerSession();
    const cart = getCheckoutItems();
    const buyNowMode = isBuyNowCheckout();
    const message = document.getElementById("checkoutMessage");

    if (!customer) {
      alert("Please login as customer before payment.");
      window.location.href = "login.html";
      return;
    }
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
      message.textContent = "Payment successful! Order #" + order.orderId + " placed successfully.";
    }
    setTimeout(() => { window.location.href = "profile.html"; }, 1300);
  });
}


function renderAdminOrders() {
  const table = document.getElementById("adminOrdersTable");
  if (!table) return;
  const orders = getData(ORDER_KEY);
  if (orders.length === 0) {
    table.innerHTML = '<tr><td colspan="5" class="text-muted-custom">No orders placed yet.</td></tr>';
    return;
  }
  table.innerHTML = "";
  orders.forEach((order) => {
    const productNames = order.items.map((item) => item.name + " x" + item.quantity).join(", ");
    table.innerHTML += `<tr><td>#${order.orderId}</td><td>${order.customerName}</td><td>${productNames}</td><td>₹${Number(order.amount).toLocaleString("en-IN")}</td><td><span class="status-badge">${order.status}</span></td></tr>`;
  });
}

/* ==============================
   Admin Products Management
   Stores products the admin adds/edits/deletes in localStorage so the
   Products page actually works instead of being static placeholder text.
============================== */
const PRODUCT_KEY = "boutiqueAdminProducts";

function setupDefaultProducts() {
  if (!document.getElementById("adminProductsTable")) return;
  const products = getData(PRODUCT_KEY);
  if (products.length === 0) {
    saveData(PRODUCT_KEY, [
      { id: "p1", name: "Silk Blend Blazer", category: "Women", price: 2499, stock: 24, status: "Active" },
      { id: "p2", name: "Linen Casual Shirt", category: "Men", price: 1699, stock: 18, status: "Active" },
      { id: "p3", name: "Pearl Mini Bag", category: "Accessories", price: 999, stock: 35, status: "Active" }
    ]);
  }
}

function renderAdminProducts() {
  const table = document.getElementById("adminProductsTable");
  if (!table) return;
  const products = getData(PRODUCT_KEY);
  if (products.length === 0) {
    table.innerHTML = '<tr><td colspan="6" class="text-muted-custom">No products yet. Click "Add Product" to create one.</td></tr>';
    return;
  }
  table.innerHTML = products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>₹${Number(product.price).toLocaleString("en-IN")}</td>
      <td>${product.stock}</td>
      <td><span class="status-badge">${product.status}</span></td>
      <td><a href="#" data-edit-product="${product.id}">Edit</a> / <a href="#" data-delete-product="${product.id}">Delete</a></td>
    </tr>`).join("");
}

function setupAdminProductActions() {
  const modalEl = document.getElementById("productModal");
  const addBtn = document.getElementById("addProductBtn");
  const form = document.getElementById("productForm");
  if (!modalEl || !addBtn || !form || typeof bootstrap === "undefined") return;

  const modal = new bootstrap.Modal(modalEl);
  const titleEl = document.getElementById("productModalTitle");
  const idField = document.getElementById("productId");
  const nameField = document.getElementById("productName");
  const categoryField = document.getElementById("productCategory");
  const priceField = document.getElementById("productPrice");
  const stockField = document.getElementById("productStock");
  const statusField = document.getElementById("productStatus");

  function openForAdd() {
    form.reset();
    idField.value = "";
    titleEl.textContent = "Add Product";
    modal.show();
  }

  function openForEdit(id) {
    const product = getData(PRODUCT_KEY).find((item) => item.id === id);
    if (!product) return;
    idField.value = product.id;
    nameField.value = product.name;
    categoryField.value = product.category;
    priceField.value = product.price;
    stockField.value = product.stock;
    statusField.value = product.status;
    titleEl.textContent = "Edit Product";
    modal.show();
  }

  addBtn.addEventListener("click", openForAdd);

  /* Explicit close handling: don't rely solely on Bootstrap's data-bs-dismiss
     auto-wiring, since it can silently no-op if the modal instance wasn't
     picked up correctly. Binding directly to modal.hide() guarantees the
     X button (and any other [data-bs-dismiss="modal"] element) works. */
  modalEl.querySelectorAll('[data-bs-dismiss="modal"]').forEach((closeBtn) => {
    closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      modal.hide();
    });
  });

  document.addEventListener("click", (event) => {
    const editLink = event.target.closest("[data-edit-product]");
    if (editLink) {
      event.preventDefault();
      openForEdit(editLink.dataset.editProduct);
      return;
    }
    const deleteLink = event.target.closest("[data-delete-product]");
    if (deleteLink) {
      event.preventDefault();
      if (window.confirm("Delete this product? This cannot be undone.")) {
        saveData(PRODUCT_KEY, getData(PRODUCT_KEY).filter((item) => item.id !== deleteLink.dataset.deleteProduct));
        renderAdminProducts();
      }
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameField.value.trim();
    if (!name) { nameField.focus(); return; }

    const products = getData(PRODUCT_KEY);
    const payload = {
      name,
      category: categoryField.value,
      price: Number(priceField.value) || 0,
      stock: Number(stockField.value) || 0,
      status: statusField.value
    };

    if (idField.value) {
      const existing = products.find((item) => item.id === idField.value);
      if (existing) Object.assign(existing, payload);
    } else {
      products.push({ id: "p" + Date.now(), ...payload });
    }

    saveData(PRODUCT_KEY, products);
    renderAdminProducts();
    modal.hide();
  });
}

/* ==============================
   Admin Store Settings
   Persists the Settings page fields to localStorage so "Save Settings"
   actually saves instead of being a static, non-functional button.
============================== */
const STORE_SETTINGS_KEY = "boutiqueStoreSettings";

function setupStoreSettingsForm() {
  const form = document.getElementById("storeSettingsForm");
  if (!form) return;

  const nameField = document.getElementById("settingsStoreName");
  const emailField = document.getElementById("settingsEmail");
  const phoneField = document.getElementById("settingsPhone");
  const addressField = document.getElementById("settingsAddress");
  const message = document.getElementById("settingsMessage");

  let storedSettings = null;
  try { storedSettings = JSON.parse(localStorage.getItem(STORE_SETTINGS_KEY)); } catch { storedSettings = null; }

  if (storedSettings) {
    if (nameField && storedSettings.name) nameField.value = storedSettings.name;
    if (emailField && storedSettings.email) emailField.value = storedSettings.email;
    if (phoneField && storedSettings.phone) phoneField.value = storedSettings.phone;
    if (addressField && storedSettings.address) addressField.value = storedSettings.address;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const settings = {
      name: nameField ? nameField.value.trim() : "",
      email: emailField ? emailField.value.trim() : "",
      phone: phoneField ? phoneField.value.trim() : "",
      address: addressField ? addressField.value.trim() : ""
    };
    localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings));
    if (message) {
      message.classList.remove("d-none");
      message.textContent = "Settings saved successfully.";
      setTimeout(() => { message.classList.add("d-none"); }, 2500);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupDefaultAdmin();
  setupDefaultCustomer();
  setupPasswordToggles();
  setupCustomerRegister();
  setupCustomerLogin();
  setupCustomerForgotPassword();
  setupAdminRegister();
  setupAdminLogin();
  protectAdminPages();
  setupLogout();
  setupCustomerOrderProtection();
  renderCheckoutPage();
  setupCheckoutPayment();
  renderAdminOrders();
  setupDefaultProducts();
  renderAdminProducts();
  setupAdminProductActions();
  setupStoreSettingsForm();
  renderProfileNav();
  renderCustomerProfilePage();
  setupMobileProfileDropdown();
});
