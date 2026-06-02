// Основной движок авторизации и синхронизации подсети IZUNAX

const firebaseConfig = {
    apiKey: "AIzaSyAY58C_0NckfmkNHLsoB_eeKPcsBuB-W04",
    authDomain: "izunax-c1707.firebaseapp.com",
    projectId: "izunax-c1707",
    storageBucket: "izunax-c1707.firebasestorage.app",
    messagingSenderId: "755797664743",
    appId: "1:755797664743:web:2eaeff896c9df27075d342"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const localDb = firebase.firestore();

let currentMode = 'login';

function setMode(mode) {
    currentMode = mode;
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-reg').classList.remove('active');
    document.getElementById('tab-' + mode).classList.add('active');
    
    const nickGroup = document.getElementById('nick-group');
    const regFields = document.getElementById('reg-fields');
    const submitBtn = document.getElementById('submit-btn');
    
    if (mode === 'reg') {
        nickGroup.style.display = 'block';
        regFields.style.display = 'block';
        submitBtn.innerText = 'Создать аккаунт';
    } else {
        nickGroup.style.display = 'none';
        regFields.style.display = 'none';
        submitBtn.innerText = 'Авторизовать терминал';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("izunax_user");
    if (savedUser) {
        initHub(JSON.parse(savedUser));
    }
    loadLivePosts();
});

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('g-email').value;
    const pass = document.getElementById('g-pass').value;

    if (!email.endsWith('@gmail.com')) {
        alert("Критическая ошибка: Доступ разрешен только через авторизованный Gmail.");
        return;
    }

    if (currentMode === 'reg') {
        const login = document.getElementById('g-login').value;
        const faction = document.getElementById('g-faction').value;
        const bio = document.getElementById('g-bio').value || "Данные засекречены";
        const color = document.getElementById('g-color').value;

        if (!login) {
            alert("Ошибка: Укажите ваш игровой позывной!");
            return;
        }

        localDb.collection("game_accounts").add({
            login: login,
            email: email,
            pass: pass,
            faction: faction,
            bio: bio,
            color: color,
            xp: 0,
            createdAt: new Date()
        })
        .then(() => {
            alert("Регистрация успешна! Подключение к подсети...");
            initHub({ login, email, faction, bio, color, xp: 0 });
        })
        .catch((err) => alert("Сбой регистрации Firebase: " + err.message));

    } else {
        localDb.collection("game_accounts")
            .where("email", "==", email)
            .where("pass", "==", pass)
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    const userData = snapshot.docs[0].data();
                    alert('Синхронизация успешна! Добро пожаловать, ' + userData.login);
                    initHub(userData);
                } else {
                    alert("Сбой авторизации: Неверный адрес связи или ключ доступа.");
                }
            })
            .catch((err) => alert("Ошибка терминала: " + err.message));
    }
});

function initHub(user) {
    localStorage.setItem("izunax_user", JSON.stringify(user));
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-hub').style.display = 'block';
    
    document.getElementById('p-login').innerText = user.login;
    document.getElementById('p-email').innerText = "Связь: " + user.email;
    document.getElementById('p-faction').innerText = "Фракция: " + (user.faction || "Не выбрана");
    document.getElementById('p-bio').innerText = "Статус: " + (user.bio || "Засекречено");
    
    // Рассчитываем ранг через модуль дополнений izunax-extras.js
    const currentXp = user.xp || 0;
    const rankTitle = typeof calculateRank === 'function' ? calculateRank(currentXp) : "Рядовой Сети";
    document.getElementById('p-xp').innerText = `РАНГ: ${rankTitle} | ОПЫТ: ${currentXp} XP`;

    const pAvatar = document.getElementById('p-avatar');
    if(user.color) {
        pAvatar.style.borderColor = user.color;
        pAvatar.style.color = user.color;
        pAvatar.style.boxShadow = `0 0 15px ${user.color}`;
        document.getElementById('p-card-body').style.borderColor = user.color;
        pAvatar.innerText = user.login.substring(0, 2).toUpperCase();
    }
}

function loadLivePosts() {
    const feedView = document.getElementById('feed-view');
    if (!feedView) return;

    localDb.collection("hub_posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        if (snapshot.empty) {
            feedView.innerHTML = `
                <div class="post-card">
                    <div class="post-header"><span>@system</span> <span>Сейчас</span></div>
                    <h3 class="post-title">Лента пуста</h3>
                    <p class="post-text">Перейдите в профиль и создайте публикацию, чтобы запустить поток данных.</p>
                </div>`;
            return;
        }

        feedView.innerHTML = "";
        snapshot.forEach((doc) => {
            const post = doc.data();
            let postTime = "Только что";
            if (post.createdAt) {
                const date = post.createdAt.toDate();
                postTime = date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            feedView.innerHTML += `
                <div class="post-card">
                    <div class="post-header"><span>${post.author}</span> <span>${postTime}</span></div>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-text">${post.text}</p>
                </div>
            `;
        });
    });
}

function switchTab(tabId) {
    document.getElementById('feed-view').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById(tabId + '-view').style.display = (tabId === 'feed') ? 'grid' : 'block';

    document.getElementById('btn-tab-feed').classList.remove('active');
    document.getElementById('btn-tab-profile').classList.remove('active');
    document.getElementById('btn-tab-' + tabId).classList.add('active');
}
