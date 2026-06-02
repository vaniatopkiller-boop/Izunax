// Голографический движок Игрового Хаба IZUNAX

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

// --- ЖИВАЯ ЛЕНТА ПОСТОВ ИЗ FIREBASE ---
function loadLivePosts() {
    const feedView = document.getElementById('feed-view');
    
    // Подключаемся к коллекции hub_posts и слушаем обновления в реальном времени (.onSnapshot)
    localDb.collection("hub_posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        // Если в базе еще нет постов, оставляем системное уведомление
        if (snapshot.empty) {
            feedView.innerHTML = `
                <div class="post-card">
                    <div class="post-header"><span>@system</span> <span>Сейчас</span></div>
                    <h3 class="post-title">Лента пуста</h3>
                    <p class="post-text">Перейдите в панель публикации publish.html, чтобы добавить первый пост.</p>
                </div>`;
            return;
        }

        // Очищаем ленту перед выводом свежих данных
        feedView.innerHTML = "";

        snapshot.forEach((doc) => {
            const post = doc.data();
            
            // Красиво форматируем дату, если она есть
            let postTime = "Только что";
            if (post.createdAt) {
                const date = post.createdAt.toDate();
                postTime = date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            // Создаем HTML структуру карточки поста
            const postHTML = `
                <div class="post-card">
                    <div class="post-header"><span>${post.author}</span> <span>${postTime}</span></div>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-text">${post.text}</p>
                </div>
            `;
            feedView.innerHTML += postHTML;
        });
    }, (error) => {
        console.error("Ошибка загрузки постов: ", error);
    });
}

// Запускаем загрузку постов сразу при чтении скрипта
document.addEventListener("DOMContentLoaded", () => {
    loadLivePosts();
});

// Логика переключения вкладок Кибер-Хаба
function switchTab(tabId) {
    document.getElementById('feed-view').style.display = 'none';
    document.getElementById('videos-view').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    
    const activeView = document.getElementById(tabId + '-view');
    if (activeView) {
        activeView.style.display = (tabId === 'feed' || tabId === 'videos') ? 'grid' : 'block';
    }

    document.querySelectorAll('.nav-links .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if(event && event.target) {
        event.target.classList.add('active');
    }
}

// Перехват отправки формы регистрации
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

    localDb.collection("game_accounts").add(data)
    .then(() => {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-hub').style.display = 'block';
        
        document.getElementById('p-login').innerText = data.login;
        document.getElementById('p-email').innerText = data.email;
        document.getElementById('p-faction').innerText = data.faction;
        document.getElementById('p-bio').innerText = data.bio;
        
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
