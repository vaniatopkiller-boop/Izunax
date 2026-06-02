// Ядро игровой платформы IZUNAX // Версия 2.0 Полная локализация

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
const db = firebase.firestore();
let currentUser = null;
let currentUserId = null;
let currentAuthMode = 'login';
let itcPageCount = 1;

// Дефолтный аватар
const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23251647'/><circle cx='50' cy='40' r='20' fill='%23a855f7'/><path d='M20,80 Q50,50 80,80' fill='none' stroke='%23a855f7' stroke-width='6'/></svg>";

document.addEventListener("DOMContentLoaded", () => {
    const sessionData = localStorage.getItem("izunax_user_session");
    if (sessionData) {
        const parsed = JSON.parse(sessionData);
        loginWithSession(parsed.email, parsed.pass);
    }
    
    setupMediaPreview();
    setupInfiniteScroll();
});

function setMode(mode) {
    currentAuthMode = mode;
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-reg').classList.remove('active');
    document.getElementById('tab-' + mode).classList.add('active');
    
    const nickGroup = document.getElementById('nick-group');
    const regFields = document.getElementById('reg-fields');
    
    if (mode === 'reg') {
        nickGroup.style.display = 'block';
        regFields.style.display = 'block';
    } else {
        nickGroup.style.display = 'none';
        regFields.style.display = 'none';
    }
}

// Регистрация и Вход
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('g-email').value.trim();
    const pass = document.getElementById('g-pass').value.trim();

    if (!email.endsWith('@gmail.com')) {
        playAudio('error');
        alert("Ошибка: Допускаются только адреса электронной почты @gmail.com");
        return;
    }

    if (currentAuthMode === 'reg') {
        const login = document.getElementById('g-login').value.trim();
        const faction = document.getElementById('g-faction').value;
        const bio = document.getElementById('g-bio').value.trim() || "Прошивка активирована";

        if (!login) {
            alert("Укажите ваш уникальный никнейм.");
            return;
        }

        // Проверим, нет ли уже такого юзера
        const existCheck = await db.collection("game_accounts").where("email", "==", email).get();
        if (!existCheck.empty) {
            playAudio('error');
            alert("Этот аккаунт уже зарегистрирован в системе.");
            return;
        }

        // Жёсткое условие для админа
        let role = 'user';
        if (email === 'vaniatopkiller@gmail.com' && pass === '777_admin') {
            role = 'admin';
        }

        const newUserObj = {
            login, email, pass, faction, bio, role,
            avatar: defaultAvatar, xp: 10, createdAt: new Date()
        };

        db.collection("game_accounts").add(newUserObj).then((docRef) => {
            playAudio('success');
            saveAndAuthorize(newUserObj, docRef.id);
        });

    } else {
        // Авторизация
        db.collection("game_accounts")
            .where("email", "==", email)
            .where("pass", "==", pass)
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    playAudio('success');
                    // Дополнительный апдейт роли при совпадении секретных данных админа
                    let uData = snapshot.docs[0].data();
                    let uId = snapshot.docs[0].id;
                    if (email === 'vaniatopkiller@gmail.com' && pass === '777_admin' && uData.role !== 'admin') {
                        db.collection("game_accounts").document(uId).update({ role: 'admin' });
                        uData.role = 'admin';
                    }
                    saveAndAuthorize(uData, uId);
                } else {
                    playAudio('error');
                    alert("Ошибка аутентификации: Неверный ключ доступа.");
                }
            });
    }
});

function saveAndAuthorize(userObj, docId) {
    currentUser = userObj;
    currentUserId = docId;
    localStorage.setItem("izunax_user_session", JSON.stringify({ email: userObj.email, pass: userObj.pass }));
    
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-hub').style.display = 'block';
    
    // Наполнение полей профиля в настройках
    document.getElementById('profile-avatar-img').src = userObj.avatar || defaultAvatar;
    document.getElementById('p-edit-login').value = userObj.login;
    document.getElementById('p-edit-bio').value = userObj.bio;
    document.getElementById('p-edit-faction').value = userObj.faction || "Теневой Синдикат";
    
    if (userObj.role === 'admin') {
        document.getElementById('admin-panel').style.display = 'block';
        loadAdminPanelData();
    }
    
    loadInstagramFeed();
    buildItcNewsList(false);
}

function loginWithSession(email, pass) {
    db.collection("game_accounts")
        .where("email", "==", email)
        .where("pass", "==", pass)
        .get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                saveAndAuthorize(snapshot.docs[0].data(), snapshot.docs[0].id);
            }
        });
}

function logoutSession() {
    localStorage.removeItem("izunax_user_session");
    location.reload();
}

// Обработка превью медиафайлов перед созданием поста
let postMediaBase64 = "";
let postMediaType = "none";

function setupMediaPreview() {
    const fileInput = document.getElementById('post-file');
    const previewBox = document.getElementById('media-preview');
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            postMediaBase64 = event.target.result;
            previewBox.style.display = "block";
            
            if (file.type.startsWith('image/')) {
                postMediaType = "image";
                previewBox.innerHTML = `<img src="${postMediaBase64}">`;
            } else if (file.type.startsWith('video/')) {
                postMediaType = "video";
                previewBox.innerHTML = `<video src="${postMediaBase64}" controls muted></video>`;
            }
        };
        reader.readAsDataURL(file);
    });
}

// Публикация поста (Инстаграм-формат)
document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const text = document.getElementById('post-text').value.trim();
    const linkUrl = document.getElementById('post-media-url').value.trim();

    let finalMedia = postMediaBase64 || linkUrl;
    let finalType = postMediaType;

    if (linkUrl && !postMediaBase64) {
        finalType = linkUrl.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image";
    }

    const postObj = {
        title,
        text,
        mediaUrl: finalMedia || "",
        mediaType: finalType,
        author: currentUser.login,
        authorEmail: currentUser.email,
        authorAvatar: currentUser.avatar || defaultAvatar,
        likes: [],
        createdAt: new Date()
    };

    db.collection("hub_posts").add(postObj).then(() => {
        playAudio('success');
        document.getElementById('post-form').reset();
        document.getElementById('media-preview').style.display = "none";
        postMediaBase64 = "";
        postMediaType = "none";
        loadInstagramFeed();
    });
});

// Загрузка ленты публикаций
function loadInstagramFeed() {
    const feedView = document.getElementById('feed-view');
    if (!feedView) return;

    db.collection("hub_posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        feedView.innerHTML = "";
        if (snapshot.empty) {
            feedView.innerHTML = `<div class="publish-card" style="text-align:center;">Пока нет ни одного медиа-поста. Станьте первым!</div>`;
            return;
        }
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            const isLiked = post.likes && post.likes.includes(currentUser.email);
            const likeCount = post.likes ? post.likes.length : 0;
            
            let mediaHtml = "";
            if (post.mediaUrl) {
                if (post.mediaType === 'video') {
                    mediaHtml = `<div class="post-media-container"><video src="${post.mediaUrl}" controls loops playsinline muted></video></div>`;
                } else {
                    mediaHtml = `<div class="post-media-container"><img src="${post.mediaUrl}" alt="Медиа"></div>`;
                }
            }

            const formattedTime = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('ru-RU') : "Сейчас";

            feedView.innerHTML += `
                <div class="insta-post">
                    <div class="post-author-bar">
                        <div class="author-info">
                            <img class="author-avatar" src="${post.authorAvatar || defaultAvatar}">
                            <span class="author-name">@${post.author}</span>
                        </div>
                        <span class="post-time">${formattedTime}</span>
                    </div>
                    ${mediaHtml}
                    <div class="post-actions">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${postId}', ${isLiked})">
                            ${isLiked ? '❤️' : '🤍'} <span class="like-count">${likeCount}</span>
                        </button>
                    </div>
                    <div class="post-content-block">
                        <div class="post-main-title">${post.title}</div>
                        <p class="post-desc">${post.text}</p>
                    </div>
                </div>
            `;
        });
    });
}

// Система Лайков
function toggleLike(postId, isLiked) {
    const postRef = db.collection("hub_posts").doc(postId);
    if (isLiked) {
        postRef.update({
            likes: firebase.firestore.FieldValue.arrayRemove(currentUser.email)
        });
    } else {
        postRef.update({
            likes: firebase.firestore.FieldValue.arrayAdd(currentUser.email)
        });
    }
}

// Изменение аватарки пользователя (Перевод в Base64)
document.getElementById('profile-avatar-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('profile-avatar-img').src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Сохранение изменений профиля
document.getElementById('profile-update-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newLogin = document.getElementById('p-edit-login').value.trim();
    const newBio = document.getElementById('p-edit-bio').value.trim();
    const newFaction = document.getElementById('p-edit-faction').value;
    const avatarData = document.getElementById('profile-avatar-img').src;

    db.collection("game_accounts").doc(currentUserId).update({
        login: newLogin,
        bio: newBio,
        faction: newFaction,
        avatar: avatarData
    }).then(() => {
        playAudio('success');
        currentUser.login = newLogin;
        currentUser.bio = newBio;
        currentUser.faction = newFaction;
        currentUser.avatar = avatarData;
        alert("Профиль успешно синхронизирован с сервером!");
        loadInstagramFeed();
    });
});

// Мониторинг бесконечных игровых новостей (ITC.ua)
function buildItcNewsList(append = false) {
    const itcContainer = document.getElementById('itc-view');
    if (!itcContainer) return;

    // Снабжаем массив генеративными новостями симулируя переход по страницам ITC
    const generatorPool = [
        { title: "S.T.A.L.K.E.R. 2 получает премию за лучшую атмосферу десятилетия", text: "Проект украинской студии побил рекорды пикового онлайна среди всех шутеров от первого лица в СНГ." },
        { title: "Платформа Steam внедрила децентрализованные криптокошельки для обмена инвентарем", text: "Гейб Ньюэлл подтвердил поддержку смарт-контрактов для безопасной торговли скинами нового уровня." },
        { title: "Новая часть Call of Duty 2026 развернется в полностью открытом процедурном космосе", text: "Разработчики задействовали нейросети для отрисовки бесшовных ландшафтов сотен обитаемых лун." },
        { title: "Вышел трейлер ремейка всеми любимого Ведьмака на движке Unreal Engine 5.5", text: "Графика демонстрирует фотореалистичное освещение и симуляцию погодных условий Люмерии." }
    ];

    if (!append) itcContainer.innerHTML = "";

    for(let i=0; i<4; i++) {
        const item = generatorPool[Math.floor(Math.random() * generatorPool.length)];
        itcContainer.innerHTML += `
            <div class="insta-post" style="padding:20px;">
                <div class="post-header" style="color:var(--neon-glow); font-size:12px; font-weight:700; margin-bottom:10px;">ITC.UA // ИГРЫ // СТРАНИЦА ${itcPageCount}</div>
                <div class="post-main-title" style="font-size:17px;">${item.title}</div>
                <p class="post-desc" style="margin-top:8px;">${item.text}</p>
                <span style="font-size:11px; color:var(--text-muted); display:block; margin-top:10px;">Оригинал: itc.ua/tag/igry</span>
            </div>
        `;
    }
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (document.getElementById('itc-view-container').style.display !== 'none') {
            if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100) {
                itcPageCount++;
                buildItcNewsList(true);
            }
        }
    });
}

// ЛОГИКА АДМИН-ПАНЕЛИ (МОДЕРАЦИЯ)
function loadAdminPanelData() {
    // Вывод всех постов
    db.collection("hub_posts").onSnapshot(snapshot => {
        const postsBox = document.getElementById('admin-posts-list');
        postsBox.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            postsBox.innerHTML += `
                <div class="admin-list-item">
                    <span><strong>[Пост]</strong> ${data.title} (от ${data.author})</span>
                    <div>
                        <button class="admin-action-btn btn-role" onclick="adminEditPost('${doc.id}', '${data.text}')">Ред.</button>
                        <button class="admin-action-btn btn-delete" onclick="adminDeletePost('${doc.id}')">Удалить</button>
                    </div>
                </div>
            `;
        });
    });

    // Вывод всех юзеров
    db.collection("game_accounts").onSnapshot(snapshot => {
        const usersBox = document.getElementById('admin-users-list');
        usersBox.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            usersBox.innerHTML += `
                <div class="admin-list-item">
                    <span><strong>${data.login}</strong> (${data.email}) - Роль: <u>${data.role || 'user'}</u></span>
                    <div>
                        <button class="admin-action-btn btn-role" onclick="adminToggleRole('${doc.id}', '${data.role || 'user'}')">Сменить роль</button>
                    </div>
                </div>
            `;
        });
    });
}

function adminDeletePost(id) {
    if (confirm("Вы уверены, что хотите безвозвратно удалить этот пост?")) {
        db.collection("hub_posts").doc(id).delete().then(() => alert("Пост стёрт."));
    }
}

function adminEditPost(id, currentText) {
    const newText = prompt("Введите новый отредактированный текст поста:", currentText);
    if (newText !== null) {
        db.collection("hub_posts").doc(id).update({ text: newText });
    }
}

function adminToggleRole(id, currentRole) {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    db.collection("game_accounts").doc(id).update({ role: targetRole }).then(() => alert("Роль обновлена!"));
}

// Дополнительный вызов звуков
function playAudio(type) {
    if (window.triggerSound) window.triggerSound(type);
}

function switchTab(tabId) {
    document.getElementById('feed-view-container').style.display = 'none';
    document.getElementById('itc-view-container').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    
    document.getElementById(tabId + '-view-container').style.display = 'block';

    document.getElementById('btn-tab-feed').classList.remove('active');
    document.getElementById('btn-tab-itc').classList.remove('active');
    document.getElementById('btn-tab-profile').classList.remove('active');
    document.getElementById('btn-tab-' + tabId).classList.add('active');
}
