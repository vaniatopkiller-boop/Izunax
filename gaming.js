// Движок терминала IZUNAX v2.5 Полная локализация

const firebaseConfig = {
    apiKey: "AIzaSyAY58C_0NckfmkNHLsoB_eeKPcsBuB-W04",
    authDomain: "izunax-c1707.firebaseapp.com",
    projectId: "izunax-c1707",
    storageBucket: "izunax-c1707.firebasestorage.app",
    messagingSenderId: "755797664743",
    appId: "1:755797664743:web:2eaeff896c9df27075d342"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

let currentUser = null;
let currentUserId = null;
let currentAuthMode = 'login';

// Глобальный набор уникальных новостей для предотвращения дублирования контента
let loadedNewsKeys = new Set();
let rssFeeds = [
    "https://api.rss2json.com/v1/api.json?rss_url=https://itc.ua/tag/igry/feed/",
    "https://api.rss2json.com/v1/api.json?rss_url=https://gagadget.com/ru/games/rss/"
];
let currentFeedIndex = 0;

const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='50' cy='50' r='50' fill='%23251647'/><circle cx='50' cy='40' r='18' fill='%23a855f7'/><path d='M25,75 Q50,50 75,75' fill='none' stroke='%23a855f7' stroke-width='4'/></svg>";

document.addEventListener("DOMContentLoaded", () => {
    const session = localStorage.getItem("izunax_session");
    if (session) {
        const parsed = JSON.parse(session);
        autoLogin(parsed.email, parsed.pass);
    }
    setupMediaHandler();
    setupInfiniteNewsScroll();
});

function setMode(mode) {
    currentAuthMode = mode;
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-reg').classList.remove('active');
    document.getElementById('tab-' + mode).classList.add('active');
    document.getElementById('nick-group').style.display = (mode === 'reg') ? 'block' : 'none';
    document.getElementById('reg-fields').style.display = (mode === 'reg') ? 'block' : 'none';
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('g-email').value.trim();
    const pass = document.getElementById('g-pass').value.trim();

    if (!email.endsWith('@gmail.com')) {
        alert("Допускаются только адреса @gmail.com");
        return;
    }

    if (currentAuthMode === 'reg') {
        const login = document.getElementById('g-login').value.trim();
        const faction = document.getElementById('g-faction').value;

        const check = await db.collection("game_accounts").where("email", "==", email).get();
        if (!check.empty) { alert("Этот email уже занят."); return; }

        let role = (email === 'vaniatopkiller@gmail.com' && pass === '777_admin') ? 'admin' : 'user';

        const userObj = { login, email, pass, faction, role, avatar: defaultAvatar, createdAt: new Date() };
        db.collection("game_accounts").add(userObj).then((doc) => authorizeUser(userObj, doc.id));
    } else {
        db.collection("game_accounts").where("email", "==", email).where("pass", "==", pass).get().then((snap) => {
            if (!snap.empty) {
                let data = snap.docs[0].data();
                if (email === 'vaniatopkiller@gmail.com' && pass === '777_admin') { data.role = 'admin'; }
                authorizeUser(data, snap.docs[0].id);
            } else {
                alert("Неверные данные входа.");
            }
        });
    }
});

function autoLogin(email, pass) {
    db.collection("game_accounts").where("email", "==", email).where("pass", "==", pass).get().then((snap) => {
        if (!snap.empty) authorizeUser(snap.docs[0].data(), snap.docs[0].id);
    });
}

function authorizeUser(userObj, id) {
    currentUser = userObj;
    currentUserId = id;
    localStorage.setItem("izunax_session", JSON.stringify({ email: userObj.email, pass: userObj.pass }));
    
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-hub').style.display = 'block';
    
    document.getElementById('profile-avatar-img').src = userObj.avatar || defaultAvatar;
    document.getElementById('p-edit-login').value = userObj.login;
    document.getElementById('p-edit-faction').value = userObj.faction || "Теневой Синдикат";
    
    if (userObj.role === 'admin') {
        document.getElementById('admin-panel').style.display = 'block';
        initAdminPanel();
    }
    
    loadInstagramFeed();
    fetchRealTimeNews(false);
}

function logoutSession() {
    localStorage.removeItem("izunax_session");
    location.reload();
}

// Конвертер медиафайлов
let base64Media = "";
let mediaFormat = "none";
function setupMediaHandler() {
    document.getElementById('profile-avatar-file').addEventListener('change', (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader(); r.onload = (ev) => document.getElementById('profile-avatar-img').src = ev.target.result;
        r.readAsDataURL(f);
    });

    document.getElementById('post-file').addEventListener('change', (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader(); r.onload = (ev) => {
            base64Media = ev.target.result;
            mediaFormat = f.type.startsWith('video/') ? "video" : "image";
        };
        r.readAsDataURL(f);
    });
}

// Создание поста из профиля
document.getElementById('post-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const text = document.getElementById('post-text').value.trim();
    const url = document.getElementById('post-media-url').value.trim();

    let media = base64Media || url;
    let type = mediaFormat;
    if (url && !base64Media) { type = url.match(/\.(mp4|webm)$/i) ? "video" : "image"; }

    db.collection("hub_posts").add({
        title, text, mediaUrl: media || "", mediaType: type,
        author: currentUser.login, authorAvatar: currentUser.avatar || defaultAvatar,
        authorEmail: currentUser.email, likes: [], createdAt: new Date()
    }).then(() => {
        document.getElementById('post-form').reset();
        base64Media = ""; mediaFormat = "none";
        alert("Данные транслированы в ленту!");
        switchTab('feed');
    });
});

// Загрузка ленты Инстаграм-формата
function loadInstagramFeed() {
    db.collection("hub_posts").orderBy("createdAt", "desc").onSnapshot((snap) => {
        const view = document.getElementById('feed-view'); if (!view) return;
        view.innerHTML = "";
        snap.forEach((doc) => {
            const p = doc.data(); const pId = doc.id;
            const liked = p.likes && p.likes.includes(currentUser.email);
            let media = "";
            if (p.mediaUrl) {
                media = (p.mediaType === 'video') 
                ? `<div class="post-media-container"><video src="${p.mediaUrl}" controls loop muted></video></div>`
                : `<div class="post-media-container"><img src="${p.mediaUrl}"></div>`;
            }
            view.innerHTML += `
                <div class="insta-post">
                    <div class="post-author-bar">
                        <div class="author-info"><img class="author-avatar" src="${p.authorAvatar}"><span class="author-name">@${p.author}</span></div>
                    </div>
                    ${media}
                    <div class="post-actions">
                        <button class="like-btn ${liked ? 'liked' : ''}" onclick="hitLike('${pId}', ${liked})">${liked ? '❤️' : '🤍'} <span>${p.likes?p.likes.length:0}</span></button>
                    </div>
                    <div class="post-content-block"><div class="post-main-title">${p.title}</div><p class="post-desc">${p.text}</p></div>
                </div>`;
        });
    });
}

function hitLike(id, liked) {
    const ref = db.collection("hub_posts").doc(id);
    ref.update({ likes: liked ? firebase.firestore.FieldValue.arrayRemove(currentUser.email) : firebase.firestore.FieldValue.arrayAdd(currentUser.email) });
}

// Обновление профиля
document.getElementById('profile-update-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const login = document.getElementById('p-edit-login').value.trim();
    const faction = document.getElementById('p-edit-faction').value;
    const av = document.getElementById('profile-avatar-img').src;

    db.collection("game_accounts").doc(currentUserId).update({ login, faction, avatar: av }).then(() => {
        currentUser.login = login; currentUser.faction = faction; currentUser.avatar = av;
        alert("Синхронизация успешна!");
    });
});

// Реальный парсинг стрима новостей с разных ресурсов без дублирования
async function fetchRealTimeNews(append = false) {
    const box = document.getElementById('itc-view'); if (!box) return;
    if (!append) box.innerHTML = "";

    try {
        let targetFeed = rssFeeds[currentFeedIndex];
        const res = await fetch(targetFeed);
        const data = await res.json();

        if(data && data.items) {
            let contextAdded = 0;
            data.items.forEach(item => {
                let uniqueKey = item.guid || item.link;
                if (!loadedNewsKeys.has(uniqueKey)) {
                    loadedNewsKeys.add(uniqueKey);
                    contextAdded++;
                    box.innerHTML += `
                        <div class="insta-post" style="padding:18px;">
                            <div style="font-size:11px; color:var(--neon-glow); font-weight:700; margin-bottom:8px;">🔴 LIVE // ИГРОВОЙ ПОТОК</div>
                            <div class="post-main-title" style="font-size:16px;">${item.title}</div>
                            <p class="post-desc" style="margin-top:6px;">${item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 160) : 'Перейдите по ссылке для ознакомления...'}...</p>
                            <a href="${item.link}" target="_blank" style="color:var(--neon-glow); font-size:12px; text-decoration:none; display:inline-block; margin-top:10px; font-weight:600;">Открыть источник →</a>
                        </div>`;
                }
            });
            // Переключаем фид-ресурс для следующего скролла, обеспечивая бесконечное разнообразие сайтов
            currentFeedIndex = (currentFeedIndex + 1) % rssFeeds.length;
        }
    } catch (err) { console.log("Ошибка шлюза парсинга новостей."); }
}

function setupInfiniteNewsScroll() {
    window.addEventListener('scroll', () => {
        if (document.getElementById('itc-view-container').style.display !== 'none') {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 120) {
                fetchRealTimeNews(true);
            }
        }
    });
}

// Административная панель
function initAdminPanel() {
    db.collection("hub_posts").onSnapshot(snap => {
        const container = document.getElementById('admin-posts-list'); container.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            container.innerHTML += `
                <div class="admin-list-item">
                    <span>${d.title} (от ${d.author})</span>
                    <button class="admin-action-btn btn-delete" onclick="db.collection('hub_posts').doc('${doc.id}').delete()">Удалить</button>
                </div>`;
        });
    });
}

function switchTab(id) {
    document.getElementById('feed-view-container').style.display = 'none';
    document.getElementById('itc-view-container').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById(id + '-view-container').style.display = 'block';

    document.getElementById('btn-tab-feed').classList.remove('active');
    document.getElementById('btn-tab-itc').classList.remove('active');
    document.getElementById('btn-tab-profile').classList.remove('active');
    document.getElementById('btn-tab-' + id).classList.add('active');
}
