// IZUNAX — profile.js
// auth.js загружается ПЕРВЫМ — там getCurrentUser, getUsers, saveUsers

document.addEventListener('DOMContentLoaded', function () {

  const currentNick = getCurrentUser();
  const guestView   = document.getElementById('guestView');
  const profileView = document.getElementById('profileView');

  // Сначала прячем оба — потом покажем нужный
  guestView.style.display   = 'none';
  profileView.style.display = 'none';

  // Навигация
  const navLogin   = document.getElementById('navLogin');
  const navReg     = document.getElementById('navReg');
  const navProfile = document.getElementById('navProfile');
  const navLogout  = document.getElementById('navLogout');
  const mNavLogin  = document.getElementById('mNavLogin');
  const mNavReg    = document.getElementById('mNavReg');
  const mNavLogout = document.getElementById('mNavLogout');

  if (currentNick) {
    if (navLogin)   navLogin.style.display   = 'none';
    if (navReg)     navReg.style.display     = 'none';
    if (navProfile) navProfile.style.display = '';
    if (navLogout)  navLogout.style.display  = '';
    if (mNavLogin)  mNavLogin.style.display  = 'none';
    if (mNavReg)    mNavReg.style.display    = 'none';
    if (mNavLogout) mNavLogout.style.display = '';
  }

  if (!currentNick) {
    // Не залогинен — показываем заглушку
    guestView.style.display = 'flex';
    return;
  }

  // Залогинен
  const users = getUsers();
  const user  = users.find(u => u.nick === currentNick);

  if (!user) {
    localStorage.removeItem('izunax_current');
    window.location.href = 'login.html';
    return;
  }

  // Показываем профиль
  profileView.style.display = 'block';

  // Заполняем данные
  document.getElementById('profileNick').textContent = '@' + user.nick;
  document.getElementById('profileBioDisplay').textContent = user.bio || 'Нет описания';
  document.getElementById('statJoined').textContent =
    new Date(user.joined).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });

  if (user.isAdmin) {
    document.getElementById('profileBadge').textContent = '★ ADMIN';
  }

  // Кол-во артов
  const posts   = JSON.parse(localStorage.getItem('izunax_posts') || '[]');
  const myPosts = posts.filter(p => p.author === user.nick);
  document.getElementById('statPosts').textContent = myPosts.length;

  // Аватар
  const avatarEl = document.getElementById('avatarDisplay');
  renderAvatar(avatarEl, user);

  // Смена аватара
  document.getElementById('avatarEditBtn').addEventListener('click', () => {
    document.getElementById('avatarInput').click();
  });
  document.getElementById('avatarInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Максимум 3MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const allUsers = getUsers();
      const idx = allUsers.findIndex(u => u.nick === currentNick);
      if (idx !== -1) {
        allUsers[idx].avatar = ev.target.result;
        saveUsers(allUsers);
        user.avatar = ev.target.result;
        renderAvatar(avatarEl, user);
      }
    };
    reader.readAsDataURL(file);
  });

  // Мои арты
  renderMyPosts(myPosts);

  // Bio редактор
  const bioEditor  = document.getElementById('bioEditor');
  const bioInput   = document.getElementById('bioInput');
  const bioDisplay = document.getElementById('profileBioDisplay');

  document.getElementById('editBioBtn').addEventListener('click', () => {
    bioInput.value = user.bio || '';
    bioEditor.style.display = 'block';
    bioInput.focus();
  });
  document.getElementById('cancelBioBtn').addEventListener('click', () => {
    bioEditor.style.display = 'none';
  });
  document.getElementById('saveBioBtn').addEventListener('click', () => {
    const newBio = bioInput.value.trim();
    const allUsers = getUsers();
    const idx = allUsers.findIndex(u => u.nick === currentNick);
    if (idx !== -1) { allUsers[idx].bio = newBio; saveUsers(allUsers); user.bio = newBio; }
    bioDisplay.textContent = newBio || 'Нет описания';
    bioEditor.style.display = 'none';
  });

  // Выход
  function doLogout() {
    localStorage.removeItem('izunax_current');
    window.location.href = 'index.html';
  }
  document.getElementById('logoutBtn').addEventListener('click', doLogout);
  if (navLogout)  navLogout.addEventListener('click', doLogout);
  if (mNavLogout) mNavLogout.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });

});

// ── Хелперы ───────────────────────────────────────
function renderAvatar(el, user) {
  if (user.avatar) {
    el.innerHTML = `<img src="${user.avatar}" alt="av" style="width:100%;height:100%;object-fit:cover;display:block"/>`;
  } else {
    el.textContent = user.nick[0].toUpperCase();
  }
}

function renderMyPosts(posts) {
  const container = document.getElementById('profilePosts');
  if (!posts.length) return;
  container.innerHTML = '';
  container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.8rem';
  posts.forEach(post => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg2);border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:transform 0.2s,border-color 0.2s';
    card.innerHTML = `
      <img src="${post.image}" alt="${post.title}" style="width:100%;aspect-ratio:1;object-fit:cover;display:block"/>
      <div style="padding:0.5rem 0.7rem;font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-dim)">${post.title}</div>
    `;
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.borderColor = 'var(--red-dim)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.borderColor = ''; });
    card.addEventListener('click', () => { window.location.href = 'gallery.html'; });
    container.appendChild(card);
  });
}
