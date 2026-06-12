import { initApp, showToast, formatDate, getClearanceBadge, getStatusBadge, getCurrentProfile } from "./app.js";
import { logout } from "./auth.js";
import { getItems, createItem, updateItem, deleteItem, uploadFile, CLEARANCE_LEVELS, STATUSES } from "./archive.js";

function renderHeader(activePage) {
  return `
  <canvas id="noise"></canvas>
  <div class="overlay scanlines"></div>
  <div class="overlay vignette"></div>
  <div class="scanline-bar"></div>

  <header class="site-header">
    <a href="index.html" class="brand">
      <div class="brand-mark">H</div>
      <div>
        <div class="brand-title">H ARCHIVES</div>
        <div class="brand-subtitle">СЕКРЕТНЫЙ АРХИВ</div>
      </div>
    </a>
    <nav class="nav" id="desktopNav">
      <a href="archive.html" ${activePage==='archive'?'class="active"':''}>Архив</a>
      <a href="documents.html" ${activePage==='documents'?'class="active"':''}>Документы</a>
      <a href="dossiers.html" ${activePage==='dossiers'?'class="active"':''}>Досье</a>
      <a href="anomalies.html" ${activePage==='anomalies'?'class="active"':''}>Аномалии</a>
      <a href="terminal.html" ${activePage==='terminal'?'class="active"':''}>Терминал</a>
      <a href="search.html" ${activePage==='search'?'class="active"':''}>Поиск</a>
      <a href="admin.html" data-auth="admin" class="hidden${activePage==='admin'?' active':''}">Управление</a>
      <a href="profile.html" data-auth="only" class="hidden nav-btn">Профиль</a>
      <a href="login.html" data-auth="login" class="nav-auth-btn">Войти</a>
      <a href="#" data-auth="logout" class="hidden nav-btn" id="logoutBtn">Выйти</a>
    </nav>
    <button class="burger" id="burgerBtn"><span></span><span></span><span></span></button>
  </header>

  <nav class="mobile-nav" id="mobileNav">
    <a href="archive.html">Архив</a>
    <a href="documents.html">Документы</a>
    <a href="photos.html">Фотоархив</a>
    <a href="dossiers.html">Досье</a>
    <a href="anomalies.html">Аномалии</a>
    <a href="incidents.html">Инциденты</a>
    <a href="operations.html">Операции</a>
    <a href="personnel.html">Персонал</a>
    <a href="timeline.html">Хронология</a>
    <a href="terminal.html">Терминал</a>
    <a href="search.html">Поиск</a>
    <a href="admin.html" data-auth="admin" class="hidden">Управление</a>
    <a href="profile.html" data-auth="only" class="hidden">Профиль</a>
    <a href="login.html" data-auth="login">Войти</a>
    <a href="#" data-auth="logout" class="hidden" id="mobileLogoutBtn">Выйти</a>
  </nav>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <p>H ARCHIVES &copy; ОРГАНИЗАЦИЯ Н &mdash; Все материалы рассекречены в демонстрационных целях</p>
  </footer>`;
}

function renderArchiveCard(item, type) {
  const clearance = getClearanceBadge(item.clearanceLevel || 1);
  const status = getStatusBadge(item.status || "active");
  const date = formatDate(item.createdAt);
  return `
  <div class="archive-card" data-id="${item.id}" data-type="${type}" onclick="window.openDetail('${type}','${item.id}')">
    <div class="card-header">
      <span class="card-code">${item.code || "---"}</span>
      ${clearance}
    </div>
    <div class="card-title">${item.title || "Без названия"}</div>
    <div class="card-desc">${item.description || item.body || ""}</div>
    <div class="card-footer">
      <span>${date}</span>
      ${status}
    </div>
    ${(item.clearanceLevel || 1) >= 3 ? '<div class="stamp" style="right:-10px;bottom:14px;">СЕКРЕТНО</div>' : ''}
  </div>`;
}

function renderDetailModal(item, type) {
  const clearance = getClearanceBadge(item.clearanceLevel || 1);
  const status = getStatusBadge(item.status || "active");
  const date = formatDate(item.createdAt);
  const history = (item.history || []).map(h =>
    `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:0.8rem;">
      <span style="color:var(--accent)">${h.action}</span> — ${h.details || ""} <span style="color:var(--faint)">${h.at || ""}</span>
    </div>`
  ).join("");

  const attachments = (item.attachments || []).map(a =>
    `<a href="${a}" target="_blank" class="btn btn-sm btn-ghost" style="margin:4px;">Файл</a>`
  ).join("");

  return `
  <div class="modal-overlay active" id="detailModal" onclick="if(event.target===this)this.classList.remove('active')">
    <div class="modal-card">
      <button class="modal-close" onclick="document.getElementById('detailModal').classList.remove('active')">&times;</button>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="font-family:var(--font-mono);color:var(--accent);font-size:0.85rem;letter-spacing:0.1em;">${item.code || "---"}</span>
        ${clearance} ${status}
      </div>
      <h2 style="font-family:var(--font-display);font-size:1.6rem;margin:10px 0;">${item.title || "Без названия"}</h2>
      <div style="color:var(--muted);line-height:1.8;margin:16px 0;">${item.body || item.description || "Содержимое отсутствует."}</div>
      ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;border-radius:10px;margin:12px 0;" alt="">` : ""}
      ${attachments ? `<div style="margin:12px 0;"><strong style="font-size:0.8rem;color:var(--faint);letter-spacing:0.1em;">ВЛОЖЕНИЯ:</strong><div>${attachments}</div></div>` : ""}
      <div style="display:flex;gap:16px;align-items:center;margin-top:16px;flex-wrap:wrap;">
        <div class="stamp-circle" style="flex-shrink:0;">ОРГАНИЗАЦИЯ<br>Н</div>
        <div>
          <div style="font-size:0.8rem;color:var(--faint);">Дата: ${date}</div>
          <div style="font-size:0.8rem;color:var(--faint);">Тип: ${type}</div>
        </div>
      </div>
      ${history ? `<div style="margin-top:20px;"><strong style="font-size:0.8rem;color:var(--faint);letter-spacing:0.1em;">ИСТОРИЯ ИЗМЕНЕНИЙ:</strong>${history}</div>` : ""}
    </div>
  </div>`;
}

function renderCreateModal(type, fields) {
  const clearanceOptions = Object.entries(CLEARANCE_LEVELS).map(([k, v]) =>
    `<option value="${k}">${v.code} — ${v.name}</option>`
  ).join("");
  const statusOptions = Object.entries(STATUSES).map(([k, v]) =>
    `<option value="${k}">${v.name}</option>`
  ).join("");

  const fieldsHtml = fields.map(f => {
    if (f.type === "textarea") {
      return `<div class="form-group"><label class="form-label">${f.label}</label><textarea class="form-textarea form-input" id="field_${f.name}" placeholder="${f.placeholder || ""}">${f.value || ""}</textarea></div>`;
    }
    if (f.type === "file") {
      return `<div class="form-group"><label class="form-label">${f.label}</label><input type="file" class="form-input" id="field_${f.name}" accept="${f.accept || "*"}"></div>`;
    }
    return `<div class="form-group"><label class="form-label">${f.label}</label><input type="${f.type||'text'}" class="form-input" id="field_${f.name}" placeholder="${f.placeholder||''}" value="${f.value || ''}"></div>`;
  }).join("");

  return `
  <div class="modal-overlay active" id="createModal" onclick="if(event.target===this)this.classList.remove('active')">
    <div class="modal-card">
      <button class="modal-close" onclick="document.getElementById('createModal').classList.remove('active')">&times;</button>
      <h2 style="font-family:var(--font-display);margin-bottom:16px;">Создать запись</h2>
      <form id="createForm">
        ${fieldsHtml}
        <div class="form-group">
          <label class="form-label">Уровень допуска</label>
          <select class="form-select" id="field_clearance">${clearanceOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Статус</label>
          <select class="form-select" id="field_status">${statusOptions}</select>
        </div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top:12px;">Создать</button>
      </form>
    </div>
  </div>`;
}

function setupLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await logout();
    showToast("Сессия завершена");
  });
  document.getElementById("mobileLogoutBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await logout();
    showToast("Сессия завершена");
  });
}

export {
  renderHeader, renderFooter, renderArchiveCard, renderDetailModal,
  renderCreateModal, setupLogout,
  initApp, showToast, formatDate, getClearanceBadge, getStatusBadge,
  getCurrentProfile, getItems, createItem, updateItem, deleteItem, uploadFile
};
