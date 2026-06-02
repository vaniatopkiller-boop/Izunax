// Головний керуючий модуль авторизації, постів та модерації IZUNAX Core

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

const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)' width='100' height='100'><circle cx='50' cy='50' r='50' fill='%23251647'/><circle cx='50' cy='40' r='18' fill='%23a855f7'/></svg>";

document.addEventListener("DOMContentLoaded", () => {
    const session = localStorage.getItem("izunax_session");
    if (session) {
        const parsed = JSON.parse(session);
        autoLogin(parsed.email, parsed.pass);
    }
    setupMediaHandler();
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
        if (!check.empty) { alert("Даний email вже зареєстрований."); return; }

        let role = (email.toLowerCase() === 'vaniatopkiller@gmail.com' && pass === '777_admin') ? 'admin' : 'user';

        const userObj = { login, email, pass, role, avatar: defaultAvatar, createdAt: new Date() };
        db.collection("game_accounts").add(userObj).then((doc) => authorizeUser(userObj, doc.id));
    } else {
        db.collection("game_accounts").where("email", "==", email).where("pass", "==", pass).get().then((snap) => {
            if (!snap.empty) {
                let uData = snap.docs[0].data();
                if (email.toLowerCase() === 'vaniatopkiller@gmail.com' && pass === '777_admin') {
                    uData.role = 'admin';
                    db.collection("game_accounts").doc(snap.docs[0].id).update({ role: 'admin' });
                }
                authorizeUser(uData, snap.docs[0].id);
            } else {
                if (email.toLowerCase() === 'vaniatopkiller@gmail.com' && pass === '777_admin') {
                    const adminObj = { login: "ROOT_ADMIN", email, pass, role: "admin", avatar: defaultAvatar, createdAt: new Date() };
                    db.collection("game_accounts").add(adminObj).then(doc => authorizeUser(adminObj, doc.id));
                } else {
                    alert("Помилка автентифікації.");
                }
            }
        });
    }
});

function autoLogin(email, pass) {
    db.collection("game_accounts").where("email", "==", email).where("pass", "==", pass).get().then((snap) => {
        if (!snap.empty) {
            let uData = snap.docs[0].data();
            if (email.toLowerCase() === 'vaniatopkiller@gmail.com' && pass === '777_admin') {
                uData.role = 'admin';
            }
            authorizeUser(uData, snap.docs[0].id);
        }
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
    
    // ВІДКРИТТЯ ROOT-ПАНЕЛІ ДЛЯ ВЛАСНИКА АККАУНТА GMAIL
    if (userObj.email.toLowerCase() === 'vaniatopkiller@gmail.com' || userObj.role === 'admin') {
        document.getElementById('btn-tab-admin').style.display = 'block';
        initAdminPanel();
    }
    
    loadInstagramFeed();
    if (typeof startNewsScraping === 'function') {
        startNewsScraping(false);
    }
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
        alert("Пост додано в стрічку!");
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
        alert("Профіль синхронізовано!");
        loadInstagramFeed();
    });
});

// Експорт функції імпорту новин
window.importNewsToFirebase = function(title, desc, imgUrl) {
    if (!currentUser) return;
    
    db.collection("hub_posts").add({
        title: title,
        text: desc,
        mediaUrl: imgUrl,
        mediaType: "image",
        author: `${currentUser.login} (Імпорт)`,
        authorAvatar: currentUser.avatar || defaultAvatar,
        authorEmail: currentUser.email,
        likes: [],
        createdAt: new Date()
    }).then(() => {
        alert("Новину успішно імпортовано у стрічку Хабу!");
    }).catch(err => {
        alert("Помилка імпорту: " + err.message);
    });
};

function setupInfiniteNewsScroll() {
    window.addEventListener('scroll', () => {
        if (document.getElementById('itc-view-container').style.display !== 'none') {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 150) {
                if (typeof startNewsScraping === 'function') {
                    startNewsScraping(true);
                }
            }
        }
    });
}

// ПАНЕЛЬ АДМІНІСТРАТОРА (ROOT_ПАНЕЛЬ)
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

    db.collection("game_accounts").orderBy("createdAt", "desc").onSnapshot(snap => {
        const list = document.getElementById('admin-users-list'); if(!list) return;
        list.innerHTML = "";
        snap.forEach(doc => {
            const u = doc.data();
            if (u.email === currentUser.email) return;
            list.innerHTML += `
                <div class="admin-list-item">
                    <div>
                        <strong style="color: #fff;">${u.login}</strong> <br>
                        <span style="font-size:11px; color:var(--text-muted);">${u.email} [Роль: ${u.role || 'user'}]</span>
                    </div>
                    <div>
                        <button class="btn-grant" onclick="toggleAdminRole('${doc.id}', '${u.role}')">${u.role === 'admin' ? 'Розжалувати' : 'Зробити адміном'}</button>
                        <button class="btn-delete" onclick="deleteUserByAdmin('${doc.id}')">БАН</button>
                    </div>
                </div>`;
        });
    });
}

function deletePostByAdmin(id) {
    if(confirm("Видалити цей пост безповоротно з бази Firestore?")) {
        db.collection("hub_posts").doc(id).delete();
    }
}

function deleteUserByAdmin(id) {
    if(confirm("Забанити та видалити акаунт цього користувача?")) {
        db.collection("game_accounts").doc(id).delete();
    }
}

function toggleAdminRole(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    db.collection("game_accounts").doc(id).update({ role: newRole }).then(() => {
        alert("Права доступу користувача змінено!");
    });
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
