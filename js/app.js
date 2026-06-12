import { onAuthChange, getLocalSession } from "./auth.js";
import { initNoise, initGlitch, initCRTFlicker } from "./effects.js";
import { onNotifications, markAllNotificationsRead, markNotificationRead } from "./submissions.js";

let currentUser = null;
let currentProfile = null;
let notifUnsub = null;

function initApp() {
  initNoise("noise");
  initGlitch();
  initCRTFlicker();
  initBurgerMenu();

  const cached = getLocalSession();
  if (cached && cached.uid) {
    updateNavAuth({ displayName: cached.displayName, role: cached.role, clearanceLevel: cached.clearanceLevel });
  } else {
    updateNavAuth(null);
  }

  onAuthChange(({ user, profile, loggedIn }) => {
    currentUser = user;
    currentProfile = profile;
    if (profile) {
      const sess = getLocalSession() || {};
      sess.role = profile.role;
      sess.clearanceLevel = profile.clearanceLevel;
      try { localStorage.setItem("h_archives_auth", JSON.stringify(sess)); } catch {}
    }
    updateNavAuth(profile);
    initNotificationBell(user, profile, loggedIn);
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

// ---------- Notification Bell (auto-injected) ----------

function initNotificationBell(user, profile, loggedIn) {
  if (notifUnsub) { notifUnsub(); notifUnsub = null; }

  const existing = document.getElementById("notifWrap");
  if (!loggedIn || !user) {
    if (existing) existing.remove();
    return;
  }

  let wrap = existing;
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "notifWrap";
    wrap.className = "notif-wrap";
    wrap.innerHTML = `
      <button class="notif-bell" id="notifBellBtn" title="Уведомления">&#128276;<span class="notif-badge hidden" id="notifBadge"></span></button>
      <div class="notif-dropdown" id="notifDropdown">
        <div class="notif-dropdown-header">
          <span>Уведомления</span>
          <button id="notifMarkAll">Прочитать все</button>
        </div>
        <div id="notifList"><div class="notif-empty">Нет уведомлений</div></div>
      </div>`;

    const nav = document.querySelector(".nav");
    if (nav) {
      const profileLink = nav.querySelector("[href='profile.html']");
      if (profileLink) {
        nav.insertBefore(wrap, profileLink);
      } else {
        nav.appendChild(wrap);
      }
    }

    wrap.querySelector("#notifBellBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("notifDropdown").classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      const dd = document.getElementById("notifDropdown");
      if (dd && !wrap.contains(e.target)) dd.classList.remove("open");
    });

    wrap.querySelector("#notifMarkAll").addEventListener("click", async () => {
      try { await markAllNotificationsRead(user.uid); } catch {}
    });
  }

  notifUnsub = onNotifications(user.uid, (notifs) => {
    renderNotifications(notifs);
  });
}

function renderNotifications(notifs) {
  const badge = document.getElementById("notifBadge");
  const list = document.getElementById("notifList");
  if (!list) return;

  const unreadCount = notifs.filter(n => !n.read).length;
  if (badge) {
    badge.textContent = unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : "";
    badge.classList.toggle("hidden", unreadCount === 0);
  }

  if (!notifs.length) {
    list.innerHTML = '<div class="notif-empty">Нет уведомлений</div>';
    return;
  }

  const icons = { approved: "&#10004;", rejected: "&#10006;", submit: "&#9993;", info: "&#9432;" };
  list.innerHTML = notifs.map(n => {
    const iconType = n.type || "info";
    const timeStr = n.createdAt ? formatTimeAgo(n.createdAt) : "";
    return `<div class="notif-item ${n.read ? "" : "unread"}" data-nid="${n.id}">
      <div class="notif-icon ${iconType}">${icons[iconType] || icons.info}</div>
      <div class="notif-text">
        ${n.message}
        <div class="notif-time">${timeStr}</div>
      </div>
    </div>`;
  }).join("");

  list.querySelectorAll(".notif-item.unread").forEach(el => {
    el.addEventListener("click", async () => {
      try {
        await markNotificationRead(el.dataset.nid);
        el.classList.remove("unread");
      } catch {}
    });
  });
}

function formatTimeAgo(ts) {
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч. назад`;
  const days = Math.floor(hrs / 24);
  return `${days} дн. назад`;
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

export { initApp, showToast, formatDate, formatTimeAgo, getClearanceBadge, getStatusBadge, getCurrentUser, getCurrentProfile };
