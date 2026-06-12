const state = {
  loggedIn: false,
  mode: 'guest',
  docs: [],
  language: 'UK',
  filters: {
    search: '',
    category: 'all',
  },
  toggles: {
    noise: true,
    scanlines: true,
    redactions: true,
    stamp: true,
  },
  files: [],
};

const demoOrg = {
  username: 'SEO_IZ',
  password: 'ARCHIVE-77',
};

const categories = {
  dossier: 'DOSSIER',
  photo: 'PHOTO',
  audio: 'AUDIO',
  memo: 'MEMO',
};

const titles = [
  'Досьє: Пульс об’єкта',
  'Пакет спостереження',
  'Звіт нічної групи',
  'Фотографії коридору',
  'Польова записка',
  'Аудіо протокол',
  'Схема переміщень',
  'Реєстр свідчень',
];

const bodies = [
  'Матеріал містить уривки спостережень, часові мітки та сліди ручної редакції. Частина тексту була прихована під чорними смугами після автоматичного аналізу.',
  'У справі зазначено кілька версій події. Додаткові поля підкреслено червоними помітками. Рекомендовано переглядати у режимі організатора.',
  'Надійшли фотофрагменти з різним рівнем освітлення. На деяких кадрах видно печатку організації «H» та службові маркери.',
  'Запис містить шум, короткі фрази і зниження сигналу. Система розпізнавання додає анімовану мітку для демонстраційного ефекту.',
  'Оновлено через панель керування: додано правки, локальні коментарі та приховані поля, які відкриваються при наведенні.',
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n) {
  return String(n).padStart(3, '0');
}

function randomDate() {
  const start = new Date(2024, 0, 1).getTime();
  const end = new Date(2025, 11, 31).getTime();
  const ts = start + Math.random() * (end - start);
  const d = new Date(ts);
  return d.toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: '2-digit' });
}

function createDoc(custom = false) {
  const type = rand(Object.keys(categories));
  const id = `H-${pad(Math.floor(Math.random() * 900 + 100))}`;
  const title = custom ? `Автогенерація: ${rand(['Сектор', 'Периметр', 'Фрагмент', 'Код'])} ${pad(Math.floor(Math.random()*99)+1)}` : rand(titles);
  const text = rand(bodies);
  return {
    id,
    type,
    title,
    body: text,
    date: randomDate(),
    category: type,
    custom,
  };
}

function seedDocs() {
  state.docs = Array.from({ length: 9 }, () => createDoc(false));
}

function el(id) {
  return document.getElementById(id);
}

function setSession(text) {
  el('sessionState').textContent = `Сесія: ${text}`;
}

function applyThemeToggles() {
  document.body.classList.toggle('no-noise', !state.toggles.noise);
  document.body.classList.toggle('no-scanlines', !state.toggles.scanlines);
  document.body.classList.toggle('no-redactions', !state.toggles.redactions);
  document.body.classList.toggle('no-stamps', !state.toggles.stamp);
}

function redactText(text) {
  if (!state.toggles.redactions) return text;
  const words = text.split(' ');
  return words
    .map((word, i) => (i % 7 === 2 || i % 11 === 5 ? `<span class="redact">${word}</span>` : word))
    .join(' ');
}

function renderDocs() {
  const grid = el('archiveGrid');
  const template = el('docTemplate');
  const fragment = document.createDocumentFragment();
  const q = state.filters.search.trim().toLowerCase();

  const filtered = state.docs.filter((doc) => {
    const matchesSearch =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.body.toLowerCase().includes(q) ||
      doc.id.toLowerCase().includes(q);
    const matchesCategory = state.filters.category === 'all' || doc.category === state.filters.category;
    return matchesSearch && matchesCategory;
  });

  grid.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'glass';
    empty.style.padding = '24px';
    empty.style.borderRadius = '20px';
    empty.textContent = 'Нічого не знайдено. Змініть пошук або фільтр.';
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((doc) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.doc-card');
    node.querySelector('.badge').textContent = categories[doc.type];
    node.querySelector('.doc-title').textContent = doc.title;
    node.querySelector('.doc-snippet').innerHTML = redactText(doc.body);
    node.querySelector('.doc-date').textContent = `${doc.id} • ${doc.date}`;

    card.addEventListener('click', () => openDoc(doc));
    node.querySelector('.open-doc').addEventListener('click', (e) => {
      e.stopPropagation();
      openDoc(doc);
    });

    fragment.appendChild(node);
  });

  grid.appendChild(fragment);
}

function openDoc(doc) {
  el('modalType').textContent = categories[doc.type];
  el('modalId').textContent = doc.id;
  el('modalTitle').textContent = doc.title;
  el('modalBody').innerHTML = redactText(doc.body + ' ' + rand(bodies) + ' ' + rand(bodies));
  el('docModal').classList.remove('hidden');
}

function closeModal() {
  el('docModal').classList.add('hidden');
}

function setMode(mode) {
  state.mode = mode;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
  el('guestForm').classList.toggle('hidden', mode !== 'guest');
  el('orgForm').classList.toggle('hidden', mode !== 'org');
}

function setLoggedIn(loggedIn, role = 'гість') {
  state.loggedIn = loggedIn;
  if (loggedIn) {
    setSession(`${role} активний`);
  } else {
    setSession('гість неактивний');
  }
}

function renderFiles() {
  const container = el('filePreview');
  if (!state.files.length) {
    container.className = 'preview-empty';
    container.textContent = 'Поки що файлів немає.';
    return;
  }
  container.className = '';
  container.innerHTML = state.files.map((file) => `
    <div class="file-item">
      <div>
        <strong>${file.name}</strong>
        <span>${file.kind} • ${file.size}</span>
      </div>
      <div class="badge">${file.tag}</div>
    </div>
  `).join('');
}

function bytesToHuman(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Noise canvas */
const canvas = el('noise');
const ctx = canvas.getContext('2d', { alpha: true });
let w = 0, h = 0, raf = 0;

function resizeCanvas() {
  w = canvas.width = window.innerWidth * devicePixelRatio;
  h = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}
function drawNoise() {
  if (state.toggles.noise) {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = Math.random() * 40;
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  raf = requestAnimationFrame(drawNoise);
}

/* Events */
document.addEventListener('DOMContentLoaded', () => {
  seedDocs();
  renderDocs();
  renderFiles();
  applyThemeToggles();
  setSession('гість неактивний');
  resizeCanvas();
  drawNoise();

  el('openLogin').addEventListener('click', () => {
    el('loginPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setMode('org');
  });

  el('guestModeBtn').addEventListener('click', () => setMode('guest'));
  el('orgModeBtn').addEventListener('click', () => setMode('org'));

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  el('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    setMode('org');
  });

  el('guestRegister').addEventListener('submit', (e) => {
    e.preventDefault();
    setLoggedIn(true, 'гість');
    alert('Гостьовий акаунт створено (демо-режим).');
  });

  el('orgLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = el('orgUser').value.trim();
    const pass = el('orgPass').value;
    if (user === demoOrg.username && pass === demoOrg.password) {
      setLoggedIn(true, 'організатор');
      alert('Доступ організатора активовано.');
    } else {
      alert('Невірний логін або пароль.');
    }
  });

  el('logoutBtn').addEventListener('click', () => {
    setLoggedIn(false);
    alert('Сесію завершено.');
  });

  el('closeModal').addEventListener('click', closeModal);
  el('docModal').addEventListener('click', (e) => {
    if (e.target.id === 'docModal') closeModal();
  });

  el('toggleNoise').addEventListener('change', (e) => {
    state.toggles.noise = e.target.checked;
    applyThemeToggles();
  });
  el('toggleScanlines').addEventListener('change', (e) => {
    state.toggles.scanlines = e.target.checked;
    applyThemeToggles();
  });
  el('toggleRedactions').addEventListener('change', (e) => {
    state.toggles.redactions = e.target.checked;
    renderDocs();
    applyThemeToggles();
  });
  el('toggleStamp').addEventListener('change', (e) => {
    state.toggles.stamp = e.target.checked;
    applyThemeToggles();
  });

  el('searchInput').addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderDocs();
  });
  el('categoryFilter').addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    renderDocs();
  });

  el('generateDocBtn').addEventListener('click', () => {
    const doc = createDoc(true);
    state.docs.unshift(doc);
    renderDocs();
    openDoc(doc);
  });

  el('fileInput').addEventListener('change', async (e) => {
    const picked = [...e.target.files];
    if (!picked.length) return;

    for (const file of picked) {
      state.files.unshift({
        name: file.name,
        kind: file.type || 'unknown',
        size: bytesToHuman(file.size),
        tag: file.type.startsWith('image/') ? 'PHOTO' : file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'FILE',
      });
    }

    renderFiles();
    alert(`${picked.length} файл(и) додано до локального прев’ю.`);
    e.target.value = '';
  });

  window.addEventListener('resize', resizeCanvas);
});
