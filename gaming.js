// Инициализация конфигурации Firebase
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
let loadedNewsKeys = new Set();

// Реальные новостные сайты через обходчик CORS
const rssSources = [
    "https://itc.ua/feed/",
    "https://gagadget.com/ru/games/rss/"
];

const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='50' cy='50' r='50' fill='%23251647'/><circle cx='50' cy='40' r='18' fill='%23a855f7'/></svg>";

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
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('g-email').value.trim();
    const pass = document.getElementById('g-pass').value.trim();

    if (currentAuthMode === 'reg') {
        const login = document.getElementById('g-login').value.trim();
        const check = await db.collection("game_accounts").where("email", "==", email).get();
        if (!check.empty) { alert("Данный email уже зарегистрирован."); return; }

        const userObj = { login, email, pass, avatar: defaultAvatar, createdAt: new Date() };
        db.collection("game_accounts").add(userObj).then((doc) => authorizeUser(userObj, doc.id));
    } else {
        db.collection("game_accounts").where("email", "==", email).where("pass", "==", pass).get().then((snap) => {
            if (!snap.empty) {
                authorizeUser(snap.docs[0].data(), snap.docs[0].id);
            } else {
                // Прямой хардкод админа, если аккаунт еще не создан в базе данных
                if (email === 'vaniatopkiller@gmail.com' && pass === '777_admin') {
                    const adminObj = { login: "ROOT_ADMIN", email, pass, avatar: defaultAvatar };
                    db.collection("game_accounts").add(adminObj).then(doc => authorizeUser(adminObj, doc.id));
                } else {
                    alert("Ошибка аутентификации.");
                }
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
    
    document.getElementById('p-edit-login').value = userObj.login;
    document.getElementById('profile-avatar-img').src = userObj.avatar || defaultAvatar;
    
    // ПРОВЕРКА НА ТВОЙ GMAIL ДЛЯ ОТКРЫТИЯ АДМИНКИ В МЕНЮ
    if (userObj.email.toLowerCase() === 'vaniatopkiller@gmail.com') {
        document.getElementById('btn-tab-admin').style.display = 'block';
        initAdminPanel();
    }
    
    loadInstagramFeed();
    fetchLiveScrapedNews();
}

function logoutSession() {
    localStorage.removeItem("izunax_session");
    location.reload();
}

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

document.getElementById('post-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const text = document.getElementById('post-text').value.trim();

    db.collection("hub_posts").add({
        title, text, mediaUrl: base64Media || "", mediaType: mediaFormat,
        author: currentUser.login, authorAvatar: currentUser.avatar || defaultAvatar,
        authorEmail: currentUser.email, likes: [], createdAt: new Date()
    }).then(() => {
        document.getElementById('post-form').reset();
        base64Media = ""; mediaFormat = "none";
        alert("Пост добавлен в ленту!");
        switchTab('feed');
    });
});

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
                        <img class="author-avatar" src="${p.authorAvatar || defaultAvatar}">
                        <span class="author-name">@${p.author}</span>
                    </div>
                    ${media}
                    <div class="post-actions">
                        <button class="like-btn ${liked ? 'liked' : ''}" onclick="hitLike('${pId}', ${liked})">${liked ? '❤️' : '🤍'} <span>${p.likes?p.likes.length:0}</span></button>
                    </div>
                    <div class="post-content-block">
                        <div class="post-main-title">${p.title}</div>
                        <p class="post-desc">${p.text}</p>
                    </div>
                </div>`;
        });
    });
}

function hitLike(id, liked) {
    db.collection("hub_posts").doc(id).update({
        likes: liked ? firebase.firestore.FieldValue.arrayRemove(currentUser.email) : firebase.firestore.FieldValue.arrayAdd(currentUser.email)
    });
}

document.getElementById('profile-update-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const login = document.getElementById('p-edit-login').value.trim();
    const av = document.getElementById('profile-avatar-img').src;

    db.collection("game_accounts").doc(currentUserId).update({ login, avatar: av }).then(() => {
        currentUser.login = login; currentUser.avatar = av;
        alert("Конфигурация профиля обновлена!");
    });
});

// АВТОМАТИЧЕСКИЙ ЖИВОЙ ПАРСЕР НОВОСТЕЙ С РАЗНЫХ САЙТОВ БЕЗ ПОВТОРОВ (ИМПОРТ КАК СВОИ)
async function fetchLiveScrapedNews() {
    const container = document.getElementById('itc-view'); if (!container) return;
    
    for (let sourceUrl of rssSources) {
        try {
            // Используем прокси allorigins для полного обхода ограничений CORS в реальном времени
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(sourceUrl)}`);
            const json = await response.json();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(json.contents, "text/xml");
            const items = xmlDoc.getElementsByTagName("item");

            for (let item of items) {
                let title = item.getElementsByTagName("title")[0].textContent;
                let link = item.getElementsByTagName("link")[0].textContent;
                let desc = item.getElementsByTagName("description")[0]?.textContent || "Откройте инфо-пакет для детального изучения.";
                
                // Очистка HTML тегов из описания стороннего сайта
                desc = desc.replace(/<[^>]*>/g, '').substring(0, 180);

                if (!loadedNewsKeys.has(link)) {
                    loadedNewsKeys.add(link);

                    container.innerHTML += `
                        <div class="insta-post">
                            <div class="post-author-bar">
                                <div style="width:10px; height:10px; background:var(--accent-green); border-radius:50%; margin-right:8px; display:inline-block;"></div>
                                <span class="author-name" style="color:var(--neon-glow);">IZUNAX // AUTOMATIC_BOT</span>
                            </div>
                            <div class="post-content-block" style="padding-top:15px;">
                                <div class="post-main-title" style="font-size:16px; color:#fff;">${title}</div>
                                <p class="post-desc">${desc}...</p>
                                <a href="${link}" target="_blank" style="color:var(--neon-glow); font-size:12px; text-decoration:none; display:inline-block; margin-top:10px; font-weight:700;">Читать оригинал на источнике →</a>
                            </div>
                        </div>`;
                }
            }
        } catch (err) {
            console.log("Ошибка обработки шлюза для источника: " + sourceUrl);
        }
    }
}

function setupInfiniteNewsScroll() {
    window.addEventListener('scroll', () => {
        if (document.getElementById('itc-view-container').style.display !== 'none') {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 150) {
                fetchLiveScrapedNews();
            }
        }
    });
}

// РАБОТА АДМИН-ПАНЕЛИ ДЛЯ ОПЕРАТОРА VANIATOPKILLER
function initAdminPanel() {
    db.collection("hub_posts").orderBy("createdAt", "desc").onSnapshot(snap => {
        const list = document.getElementById('admin-posts-list'); if(!list) return;
        list.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            list.innerHTML += `
                <div class="admin-list-item">
                    <div>
                        <strong style="color:var(--neon-glow);">${data.title}</strong> <br>
                        <span style="font-size:11px; color:var(--text-muted);">Автор: ${data.author} (${data.authorEmail})</span>
                    </div>
                    <button class="btn-delete" onclick="deletePostByAdmin('${doc.id}')">УДАЛИТЬ</button>
                </div>`;
        });
    });
}

function deletePostByAdmin(id) {
    if(confirm("Удалить этот пост безвозвратно из базы Firestore?")) {
        db.collection("hub_posts").doc(id).delete().then(() => alert("Пост стерт."));
    }
}

function switchTab(id) {
    document.getElementById('feed-view-container').style.display = 'none';
    document.getElementById('itc-view-container').style.display = 'none';
    document.getElementById('profile-view-container').style.display = 'none';
    document.getElementById('admin-view-container').style.display = 'none';
    
    document.getElementById(id + '-view-container').style.display = 'block';

    document.getElementById('btn-tab-feed').classList.remove('active');
    document.getElementById('btn-tab-itc').classList.remove('active');
    document.getElementById('btn-tab-profile').classList.remove('active');
    document.getElementById('btn-tab-admin').classList.remove('active');
    document.getElementById('btn-tab-' + id).classList.add('active');
}
