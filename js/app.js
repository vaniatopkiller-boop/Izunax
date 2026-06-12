import { onAuthChange } from "./auth.js";
import { initNoise, initGlitch, initCRTFlicker } from "./effects.js";

let currentUser = null;
let currentProfile = null;

function initApp() {
  initNoise("noise");
  initGlitch();
  initCRTFlicker();
  initBurgerMenu();
  updateNavAuth(null);

  onAuthChange(({ user, profile, loggedIn }) => {
    currentUser = user;
    currentProfile = profile;
    updateNavAuth(profile);
    document.dispatchEvent(new CustomEvent("authChanged", { detail: { user, profile, loggedIn } }));
  });
}

function updateNavAuth(profile) {
  const loginLinks = document.querySelectorAll("[data-auth='login']");
  const logoutLinks = document.querySelectorAll("[data-auth='logout']");
  const authOnlyEls = document.querySelectorAll("[data-auth='only']");
  const guestOnlyEls = document.querySelectorAll("[data-auth='guest']");
  const adminOnlyEls = document.querySelectorAll("[data-auth='admin']");
  const userNameEls = document.querySelectorAll("[data-auth='name']");

  if (profile) {
    loginLinks.forEach(el => el.classList.add("hidden"));
    logoutLinks.forEach(el => el.classList.remove("hidden"));
    authOnlyEls.forEach(el => el.classList.remove("hidden"));
    guestOnlyEls.forEach(el => el.classList.add("hidden"));
    userNameEls.forEach(el => { el.textContent = profile.displayName || "Оператор"; });
    const isOrg = profile.role === "organizer" || profile.clearanceLevel >= 4;
    adminOnlyEls.forEach(el => { el.classList.toggle("hidden", !isOrg); });
  } else {
    loginLinks.forEach(el => el.classList.remove("hidden"));
    logoutLinks.forEach(el => el.classList.add("hidden"));
    authOnlyEls.forEach(el => el.classList.add("hidden"));
    guestOnlyEls.forEach(el => el.classList.remove("hidden"));
    adminOnlyEls.forEach(el => el.classList.add("hidden"));
    userNameEls.forEach(el => { el.textContent = ""; });
  }
}

function initBurgerMenu() {
  const burger = document.getElementById("burgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  if (burger && mobileNav) {
    burger.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
    });
    mobileNav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => mobileNav.classList.remove("open"));
    });
  }
}

function showToast(message, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(ts) {
  if (!ts) return "---";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "short", day: "2-digit" });
}

function getClearanceBadge(level) {
  const map = {
    1: ["ОТКРЫТЫЙ", "badge-open"],
    2: ["ОГРАНИЧЕННЫЙ", "badge-restricted"],
    3: ["СЕКРЕТНЫЙ", "badge-secret"],
    4: ["СОВ. СЕКРЕТНЫЙ", "badge-topsecret"],
    5: ["ОСОБОЙ ВАЖНОСТИ", "badge-critical"]
  };
  const [text, cls] = map[level] || map[1];
  return `<span class="badge ${cls}">${text}</span>`;
}

function getStatusBadge(status) {
  const cls = `badge-${status || "active"}`;
  const names = {
    active: "АКТИВНЫЙ",
    archived: "В АРХИВЕ",
    classified: "ЗАСЕКРЕЧЕН",
    declassified: "РАССЕКРЕЧЕН",
    neutralized: "НЕЙТРАЛИЗОВАН"
  };
  return `<span class="badge ${cls}">${names[status] || status}</span>`;
}

function getCurrentUser() { return currentUser; }
function getCurrentProfile() { return currentProfile; }

export { initApp, showToast, formatDate, getClearanceBadge, getStatusBadge, getCurrentUser, getCurrentProfile };
