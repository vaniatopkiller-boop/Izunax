// Голографический движок Игрового Хаба IZUNAX

const firebaseConfig = {
    apiKey: "AIzaSyAY58C_0NckfmkNHLsoB_eeKPcsBuB-W04",
    authDomain: "izunax-c1707.firebaseapp.com",
    projectId: "izunax-c1707",
    storageBucket: "izunax-c1707.firebasestorage.app",
    messagingSenderId: "755797664743",
    appId: "1:755797664743:web:2eaeff896c9df27075d342"
};

// Инициализация базы данных
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const localDb = firebase.firestore();

// Логика переключения вкладок Кибер-Хаба
function switchTab(tabId) {
    document.getElementById('feed-view').style.display = 'none';
    document.getElementById('videos-view').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    
    // Переключаем активную вкладку в сетку (grid) или блок (block)
    const activeView = document.getElementById(tabId + '-view');
    if (activeView) {
        activeView.style.display = (tabId === 'feed' || tabId === 'videos') ? 'grid' : 'block';
    }

    // Свечение активной кнопки меню
    document.querySelectorAll('.nav-links .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // Добавляем класс, если кликнули по кнопкам Лента/Архивы
    if(event && event.target) {
        event.target.classList.add('active');
    }
}

// Перехват отправки формы и запись в Firestore
document.getElementById('gamer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const data = {
        login: document.getElementById('g-login').value,
        email: document.getElementById('g-email').value,
        password: document.getElementById('g-pass').value,
        faction: document.getElementById('g-faction').value,
        color: document.getElementById('g-color').value,
        bio: document.getElementById('g-bio').value || "Данные засекречены",
        createdAt: new Date()
    };

    // Запись в облако
    localDb.collection("game_accounts").add(data)
    .then(() => {
        // Плавный переход: скрываем терминал авторизации, запускаем Хаб
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-hub').style.display = 'block';
        
        // Разворачиваем карточку профиля юзера
        document.getElementById('p-login').innerText = data.login;
        document.getElementById('p-email').innerText = data.email;
        document.getElementById('p-faction').innerText = data.faction;
        document.getElementById('p-bio').innerText = data.bio;
        
        // Активируем кастомную неоновую подсветку, которую выбрал игрок
        const pAvatar = document.getElementById('p-avatar');
        pAvatar.style.borderColor = data.color;
        pAvatar.style.color = data.color;
        pAvatar.style.boxShadow = `0 0 20px ${data.color}`;
        document.getElementById('p-card-body').style.borderColor = data.color;
        
        alert('Терминал успешно синхронизирован. Добро пожаловать в сеть, ' + data.login);
    })
    .catch((err) => {
        alert("Критический сбой подсети: " + err.message);
    });
});
