// IZUNAX — gallery.js

// ── Хранилище ─────────────────────────────────────
function getPosts() {
  return JSON.parse(localStorage.getItem('izunax_posts') || '[]');
}
function savePosts(posts) {
  localStorage.setItem('izunax_posts', JSON.stringify(posts));
}
function getLikes() {
  return JSON.parse(localStorage.getItem('izunax_likes') || '{}');
}
function saveLikes(likes) {
  localStorage.setItem('izunax_likes', JSON.stringify(likes));
}

// ── Состояние ─────────────────────────────────────
const currentNick = getCurrentUser();
let allPosts      = getPosts();
let activeTag     = 'all';
let searchQuery   = '';
let currentPostId = null;

// ── Навигация ─────────────────────────────────────
function updateNav() {
  const navLogin   = document.getElementById('navLogin');
  const navReg     = document.getElementById('navReg');
  const navProfile = document.getElementById('navProfile');
  const navNick    = document.getElementById('navNick');
  const mNavLogin  = document.getElementById('mNavLogin');
  const mNavReg    = document.getElementById('mNavReg');
  const uploadBtn  = document.getElementById('uploadBtn');
  const inviteBtn  = document.getElementById('inviteBtn');

  if (currentNick) {
    if (navLogin)   navLogin.style.display   = 'none';
    if (navReg)     navReg.style.display     = 'none';
    if (navProfile) navProfile.style.display = '';
    if (navNick)    { navNick.style.display = ''; navNick.textContent = '@' + currentNick; }
    if (uploadBtn)  uploadBtn.style.display  = '';
    if (mNavLogin)  mNavLogin.style.display  = 'none';
    if (mNavReg)    mNavReg.style.display    = 'none';
    if (inviteBtn)  { inviteBtn.href = '#'; inviteBtn.textContent = '+ Загрузить арт'; inviteBtn.onclick = () => openUploadModal(); }
  }
}
updateNav();

// ── Рендер карточек ───────────────────────────────
function getFilteredPosts() {
  return allPosts.filter(p => {
    const matchTag  = activeTag === 'all' || p.tag === activeTag;
    const q         = searchQuery.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q);
    return matchTag && matchSearch;
  });
}

function renderGallery() {
  const grid   = document.getElementById('galleryGrid');
  const empty  = document.getElementById('galleryEmpty');
  const invite = document.getElementById('galleryInvite');
  const posts  = getFilteredPosts();

  // Убираем старые карточки
  grid.querySelectorAll('.art-card').forEach(c => c.remove());

  if (allPosts.length === 0) {
    // Совсем нет артов
    if (empty)  empty.style.display  = 'none';
    if (invite) invite.style.display = 'block';
    return;
  }

  if (invite) invite.style.display = 'none';

  if (posts.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  const likes = getLikes();

  posts.forEach((post, i) => {
    const liked = currentNick && likes[post.id] && likes[post.id].includes(currentNick);
    const card  = document.createElement('div');
    card.className = 'art-card';
    card.style.animationDelay = (i * 0.05) + 's';
    card.dataset.id = post.id;
    card.innerHTML = `
      <div class="art-tag-badge">${post.tag}</div>
      <img src="${post.image}" alt="${post.title}" loading="lazy"/>
      <div class="art-card-info">
        <div class="art-card-title">${post.title}</div>
        <div class="art-card-meta">
          <span class="art-card-author">@${post.author}</span>
          <span class="art-card-likes ${liked ? 'liked' : ''}">
            ♥ ${(likes[post.id] || []).length}
          </span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openViewModal(post.id));
    grid.appendChild(card);
  });
}

// ── Теги ──────────────────────────────────────────
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTag = btn.dataset.tag;
    renderGallery();
  });
});

// ── Поиск ─────────────────────────────────────────
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  searchClear.style.display = searchQuery ? '' : 'none';
  renderGallery();
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.style.display = 'none';
  renderGallery();
});

// ── Модалка загрузки ──────────────────────────────
let selectedFile = null;
let selectedTag  = 'bleach';

function openUploadModal() {
  if (!currentNick) { window.location.href = 'login.html'; return; }
  selectedFile = null;
  selectedTag  = 'bleach';
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('dropContent').style.display = 'flex';
  document.getElementById('artTitle').value = '';
  document.getElementById('artDesc').value  = '';
  document.getElementById('modalError').textContent = '';
  document.querySelectorAll('.tag-opt').forEach(b => {
    b.classList.toggle('active', b.dataset.val === 'bleach');
  });
  document.getElementById('uploadModal').style.display = 'flex';
}
function closeUploadModal() {
  document.getElementById('uploadModal').style.display = 'none';
}

document.getElementById('uploadBtn').addEventListener('click', openUploadModal);
document.getElementById('modalClose').addEventListener('click', closeUploadModal);
document.getElementById('modalCancel').addEventListener('click', closeUploadModal);
document.getElementById('uploadModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeUploadModal();
});

// Drag & drop / клик
const uploadDrop = document.getElementById('uploadDrop');
const fileInput  = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const dropContent = document.getElementById('dropContent');

uploadDrop.addEventListener('click', () => fileInput.click());
uploadDrop.addEventListener('dragover', (e) => { e.preventDefault(); uploadDrop.classList.add('drag-over'); });
uploadDrop.addEventListener('dragleave', () => uploadDrop.classList.remove('drag-over'));
uploadDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadDrop.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    document.getElementById('modalError').textContent = 'Файл слишком большой (максимум 5MB)';
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.style.display = 'block';
    dropContent.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// Выбор тега
document.querySelectorAll('.tag-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTag = btn.dataset.val;
  });
});

// Публикация
document.getElementById('publishBtn').addEventListener('click', () => {
  const title     = document.getElementById('artTitle').value.trim();
  const desc      = document.getElementById('artDesc').value.trim();
  const errorEl   = document.getElementById('modalError');

  if (!selectedFile) { errorEl.textContent = 'Выбери картинку'; return; }
  if (!title)        { errorEl.textContent = 'Добавь название'; return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const post = {
      id:      Date.now().toString(),
      title,
      desc,
      tag:     selectedTag,
      author:  currentNick,
      image:   e.target.result,
      date:    new Date().toISOString()
    };

    allPosts.unshift(post);
    savePosts(allPosts);

    // Обновляем счётчик постов у юзера
    const users = getUsers();
    const idx   = users.findIndex(u => u.nick === currentNick);
    if (idx !== -1) {
      users[idx].posts = (users[idx].posts || []);
      users[idx].posts.unshift(post.id);
      saveUsers(users);
    }

    closeUploadModal();
    renderGallery();

    const btn = document.getElementById('publishBtn');
    btn.textContent = '✓ Опубликовано!';
    btn.style.background = '#1a5c1a';
    setTimeout(() => { btn.textContent = 'Опубликовать'; btn.style.background = ''; }, 2000);
  };
  reader.readAsDataURL(selectedFile);
});

// ── Модалка просмотра ─────────────────────────────
function openViewModal(postId) {
  const post  = allPosts.find(p => p.id === postId);
  if (!post) return;
  currentPostId = postId;

  const likes  = getLikes();
  const liked  = currentNick && (likes[postId] || []).includes(currentNick);
  const isOwner = currentNick === post.author;

  // Заполняем данные
  document.getElementById('viewImg').src           = post.image;
  document.getElementById('viewTitle').textContent = post.title;
  document.getElementById('viewTag').textContent   = post.tag.toUpperCase();
  document.getElementById('viewNick').textContent  = '@' + post.author;
  document.getElementById('viewDesc').textContent  = post.desc || '';
  document.getElementById('viewLikeCount').textContent = (likes[postId] || []).length;
  document.getElementById('viewDate').textContent  =
    new Date(post.date).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });

  // Аватар автора
  const users  = getUsers();
  const author = users.find(u => u.nick === post.author);
  const avEl   = document.getElementById('viewAvatar');
  if (author && author.avatar) {
    avEl.innerHTML = `<img src="${author.avatar}" alt="av"/>`;
  } else {
    avEl.textContent = post.author[0].toUpperCase();
  }

  // Лайк
  const likeBtn = document.getElementById('viewLikeBtn');
  likeBtn.classList.toggle('liked', liked);

  // Кнопка удаления — только автор
  const deleteBtn = document.getElementById('deleteArtBtn');
  deleteBtn.style.display = isOwner ? '' : 'none';

  document.getElementById('viewModal').style.display = 'flex';
}

function closeViewModal() {
  document.getElementById('viewModal').style.display = 'none';
  currentPostId = null;
}

document.getElementById('viewClose').addEventListener('click', closeViewModal);
document.getElementById('viewModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeViewModal();
});

// Лайк
document.getElementById('viewLikeBtn').addEventListener('click', () => {
  if (!currentNick) { window.location.href = 'login.html'; return; }
  const likes   = getLikes();
  const postId  = currentPostId;
  if (!likes[postId]) likes[postId] = [];

  const idx = likes[postId].indexOf(currentNick);
  if (idx === -1) {
    likes[postId].push(currentNick);
  } else {
    likes[postId].splice(idx, 1);
  }
  saveLikes(likes);

  const count = likes[postId].length;
  const liked = likes[postId].includes(currentNick);
  document.getElementById('viewLikeCount').textContent = count;
  document.getElementById('viewLikeBtn').classList.toggle('liked', liked);

  // Обновляем карточку в гриде
  const card = document.querySelector(`.art-card[data-id="${postId}"] .art-card-likes`);
  if (card) {
    card.textContent = '♥ ' + count;
    card.classList.toggle('liked', liked);
  }
});

// Удалить арт
document.getElementById('deleteArtBtn').addEventListener('click', () => {
  if (!confirm('Удалить этот арт?')) return;
  allPosts = allPosts.filter(p => p.id !== currentPostId);
  savePosts(allPosts);

  // Убираем из постов юзера
  const users = getUsers();
  const idx   = users.findIndex(u => u.nick === currentNick);
  if (idx !== -1) {
    users[idx].posts = (users[idx].posts || []).filter(id => id !== currentPostId);
    saveUsers(users);
  }

  closeViewModal();
  renderGallery();
});

// ── Старт ─────────────────────────────────────────
renderGallery();
