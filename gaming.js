// Движок підмережі IZUNAX // v1.2 Premium

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
        submitBtn.innerHTML = '<span>Зареєструвати ядро</span> <span>→</span>';
    } else {
        nickGroup.style.display = 'none';
        regFields.style.display = 'none';
        submitBtn.innerHTML = '<span>Отримати доступ</span> <span>→</span>';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("izunax_user");
    if (savedUser) {
        initHub(JSON.parse(savedUser));
    }
    loadLivePosts();
    buildItcFeed();
});

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('g-email').value;
    const pass = document.getElementById('g-pass').value;

    if (!email.endsWith('@gmail.com')) {
        if (typeof window.triggerSound === 'function') window.triggerSound('error');
        alert("Помилка: Доступ відкритий тільки для підтверджених адрес Gmail.");
        return;
    }

    if (currentMode === 'reg') {
        const login = document.getElementById('g-login').value;
        const faction = document.getElementById('g-faction').value;
        const bio = document.getElementById('g-bio').value || "Біометрія чиста";
        const color = document.getElementById('g-color').value;

        if (!login) {
            alert("Помилка: Позивний не може бути порожнім!");
            return;
        }

        localDb.collection("game_accounts").add({
            login, email, pass, faction, bio, color, xp: 0, createdAt: new Date()
        })
        .then(() => {
            if (typeof window.triggerSound === 'function') window.triggerSound('success');
            initHub({ login, email, faction, bio, color, xp: 0 });
        })
        .catch(() => { if (typeof window.triggerSound === 'function') window.triggerSound('error'); });

    } else {
        localDb.collection("game_accounts")
            .where("email", "==", email)
            .where("pass", "==", pass)
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    if (typeof window.triggerSound === 'function') window.triggerSound('success');
                    initHub(snapshot.docs[0].data());
                } else {
                    if (typeof window.triggerSound === 'function') window.triggerSound('error');
                    alert("Збій авторизації: Невірний крипто-ключ.");
                }
            })
            .catch(() => { if (typeof window.triggerSound === 'function') window.triggerSound('error'); });
    }
});

function initHub(user) {
    localStorage.setItem("izunax_user", JSON.stringify(user));
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-hub').style.display = 'block';
    
    document.getElementById('p-login').innerText = user.login;
    document.getElementById('p-email').innerText = user.email;
    document.getElementById('p-faction').innerText = user.faction || "Без фракції";
    document.getElementById('p-bio').innerText = user.bio || "Чистий статус";
    
    const currentXp = user.xp || 0;
    const rankTitle = typeof calculateRank === 'function' ? calculateRank(currentXp) : "Мережевий Мандрівник";
    document.getElementById('p-xp').innerText = `${rankTitle} (${currentXp} XP)`;
}

function loadLivePosts() {
    const feedView = document.getElementById('feed-view');
    if (!feedView) return;

    localDb.collection("hub_posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        if (snapshot.empty) {
            feedView.innerHTML = `<div class="post-card"><h3 class="post-title">Потоки порожні</h3><p class="post-text">Створіть першу трансляцію даних через свій профіль.</p></div>`;
            return;
        }
        feedView.innerHTML = "";
        snapshot.forEach((doc) => {
            const post = doc.data();
            feedView.innerHTML += `
                <div class="post-card">
                    <div class="post-header"><span class="badge">@${post.author}</span></div>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-text">${post.text}</p>
                </div>`;
        });
    });
}

// Автономний шлюз стрічки новин ITC.ua за тегом /игры
function buildItcFeed() {
    const itcView = document.getElementById('itc-view');
    if (!itcView) return;

    const mockItcData = [
        { title: "Реліз S.T.A.L.K.E.R. 2: Серце Чорнобиля отримав критичний пач оптимізації", text: "Розробники з GSC Game World випустили масштабне оновлення, яке повністю виправляє завантаження потокових текстур на відеокартах середнього сегмента та покращує роботу штучного інтелекту мутантів.", time: "10 хв тому" },
        { title: "Sony офіційно готує анонс портативної консолі нового покоління PlayStation Vita 2", text: "Інсайдери повідомляють, що пристрій зможе запускати ігри з PS5 у рідній роздільній здатності за допомогою хмарних ядер та нової архітектури архівації пакетів даних.", time: "2 години тому" },
        { title: "Cyberpunk 2077 отримав прихований графічний режим для ПК нового покоління", text: "CD Projekt RED додали експериментальне трасування шляху «Neural Path Overdrive», що працює на базі покращених алгоритмів нейромереж 2026 року.", time: "5 годин тому" },
        { title: "GTA VI: Нові деталі про симуляцію живого світу та штучний інтелект перехожих", text: "Rockstar Games розкрили патенти, згідно з якими кожен NPC у Вайс-Сіті матиме власну унікальну пам'ять, розпорядок дня та реакцію на зміну погодних умов у реальному часі.", time: "1 день тому" }
    ];

    itcView.innerHTML = "";
    mockItcData.forEach(news => {
        itcView.innerHTML += `
            <div class="post-card">
                <div class="post-header"><span>ITC.UA // ІГРИ</span> <span>${news.time}</span></div>
                <h3 class="post-title">${news.title}</h3>
                <p class="post-text">${news.text}</p>
                <span class="itc-source">Джерело: ITC.ua/tag/igry</span>
            </div>`;
    });
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
