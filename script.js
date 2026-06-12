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
  'Досьє: Пульс об\u2019єкта',
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

function createDoc(custom = false) {
  const type = rand(Object.keys(categories));
  const id = randomPaddedId('H-', 100, 999);
  const title = custom
    ? `Автогенерація: ${rand(['Сектор', 'Периметр', 'Фрагмент', 'Код'])} ${pad(randomInt(1, 99))}`
    : rand(titles);
  return {
    id,
    type,
    title,
    body: rand(bodies),
    date: randomDate(),
    category: type,
    custom,
  };
}

function seedDocs() {
  state.docs = Array.from({ length: 9 }, () => createDoc(false));
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
  show('docModal');
}

function closeModal() {
  hide('docModal');
}

function setMode(mode) {
  state.mode = mode;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
  toggleVisibility('guestForm', mode === 'guest');
  toggleVisibility('orgForm', mode === 'org');
}

function setLoggedIn(loggedIn, role = 'гість') {
  state.loggedIn = loggedIn;
  setSession(loggedIn ? `${role} активний` : 'гість неактивний');
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

function fileTag(file) {
  if (file.type.startsWith('image/')) return 'PHOTO';
  if (file.name.toLowerCase().endsWith('.pdf')) return 'PDF';
  return 'FILE';
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

  on('openLogin', 'click', () => {
    el('loginPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setMode('org');
  });

  on('guestModeBtn', 'click', () => setMode('guest'));
  on('orgModeBtn', 'click', () => setMode('org'));

  onAll('.tab', 'click', (e) => setMode(e.currentTarget.dataset.mode));

  on('switchToLogin', 'click', (e) => {
    e.preventDefault();
    setMode('org');
  });

  on('guestRegister', 'submit', (e) => {
    e.preventDefault();
    setLoggedIn(true, 'гість');
    notify('Гостьовий акаунт створено (демо-режим).');
  });

  on('orgLogin', 'submit', (e) => {
    e.preventDefault();
    const user = el('orgUser').value.trim();
    const pass = el('orgPass').value;
    if (user === demoOrg.username && pass === demoOrg.password) {
      setLoggedIn(true, 'організатор');
      notify('Доступ організатора активовано.');
    } else {
      notify('Невірний логін або пароль.');
    }
  });

  on('logoutBtn', 'click', () => {
    setLoggedIn(false);
    notify('Сесію завершено.');
  });

  on('closeModal', 'click', closeModal);
  on('docModal', 'click', (e) => {
    if (e.target.id === 'docModal') closeModal();
  });

  /* Theme toggles — unified binding */
  bindToggle('toggleNoise', state.toggles, 'noise', applyThemeToggles);
  bindToggle('toggleScanlines', state.toggles, 'scanlines', applyThemeToggles);
  bindToggle('toggleRedactions', state.toggles, 'redactions', () => {
    renderDocs();
    applyThemeToggles();
  });
  bindToggle('toggleStamp', state.toggles, 'stamp', applyThemeToggles);

  on('searchInput', 'input', (e) => {
    state.filters.search = e.target.value;
    renderDocs();
  });
  on('categoryFilter', 'change', (e) => {
    state.filters.category = e.target.value;
    renderDocs();
  });

  on('generateDocBtn', 'click', () => {
    const doc = createDoc(true);
    state.docs.unshift(doc);
    renderDocs();
    openDoc(doc);
  });

  on('fileInput', 'change', async (e) => {
    const picked = [...e.target.files];
    if (!picked.length) return;

    for (const file of picked) {
      state.files.unshift({
        name: file.name,
        kind: file.type || 'unknown',
        size: bytesToHuman(file.size),
        tag: fileTag(file),
      });
    }

    renderFiles();
    notify(`${picked.length} файл(и) додано до локального прев'ю.`);
    e.target.value = '';
  });

  window.addEventListener('resize', resizeCanvas);
});
