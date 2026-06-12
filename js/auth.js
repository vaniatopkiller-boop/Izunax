// IZUNAX — auth.js
// Авторизация через LocalStorage

// ── Утилиты ──────────────────────────────────────
function getUsers() {
  return JSON.parse(localStorage.getItem('izunax_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('izunax_users', JSON.stringify(users));
}

function setCurrentUser(nick) {
  localStorage.setItem('izunax_current', nick);
}

function getCurrentUser() {
  return localStorage.getItem('izunax_current');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function hideError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
}

function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function validateNick(nick) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(nick);
}

// ── Показать/скрыть пароль ───────────────────────
const eyeBtn = document.getElementById('eyeBtn');
if (eyeBtn) {
  eyeBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('input[type=password], input[type=text]');
    inputs.forEach(inp => {
      if (inp.id === 'loginPass' || inp.id === 'regPass' || inp.id === 'regPass2') {
        inp.type = inp.type === 'password' ? 'text' : 'password';
      }
    });
    eyeBtn.textContent = eyeBtn.textContent === '👁' ? '🙈' : '👁';
  });
}

// ── Логин ────────────────────────────────────────
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    const nick = document.getElementById('loginNick').value.trim();
    const pass = document.getElementById('loginPass').value;

    hideError('loginError');

    if (!nick || !pass) {
      showError('loginError', 'Заполни все поля');
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.nick === nick && u.pass === pass);

    if (!user) {
      showError('loginError', 'Неверный ник или пароль');
      document.getElementById('loginNick').classList.add('error');
      document.getElementById('loginPass').classList.add('error');
      return;
    }

    setCurrentUser(nick);
    loginBtn.textContent = '✓ Входим...';
    loginBtn.style.background = '#1a5c1a';

    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 700);
  });

  // Сабмит по Enter
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}

// ── Регистрация ───────────────────────────────────
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
  registerBtn.addEventListener('click', () => {
    const nick = document.getElementById('regNick').value.trim();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;

    hideError('regError');

    if (!nick || !pass || !pass2) {
      showError('regError', 'Заполни все поля');
      return;
    }

    if (!validateNick(nick)) {
      showError('regError', 'Ник: только латиница, цифры и _ (3–20 символов)');
      document.getElementById('regNick').classList.add('error');
      return;
    }

    if (pass.length < 6) {
      showError('regError', 'Пароль минимум 6 символов');
      document.getElementById('regPass').classList.add('error');
      return;
    }

    if (pass !== pass2) {
      showError('regError', 'Пароли не совпадают');
      document.getElementById('regPass2').classList.add('error');
      return;
    }

    const users = getUsers();
    if (users.find(u => u.nick === nick)) {
      showError('regError', 'Этот ник уже занят');
      document.getElementById('regNick').classList.add('error');
      return;
    }

    // Создаём юзера
    users.push({
      nick,
      pass,
      avatar: '',
      bio: '',
      posts: [],
      joined: new Date().toISOString(),
      isAdmin: users.length === 0 // первый юзер = админ
    });
    saveUsers(users);
    setCurrentUser(nick);

    showSuccess('regSuccess', '✓ Аккаунт создан! Перенаправляем...');
    registerBtn.textContent = '✓ Готово';
    registerBtn.style.background = '#1a5c1a';

    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 1000);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
}

// Убираем класс error при вводе
document.querySelectorAll('.field-input').forEach(inp => {
  inp.addEventListener('input', () => {
    inp.classList.remove('error');
  });
});
