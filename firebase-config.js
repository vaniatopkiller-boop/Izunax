// Конфігурація Firebase (ваш проєкт)
const firebaseConfig = {
    apiKey: "AIzaSyAY58C_0NckfmkNHLsoB_eeKPcsBuB-W04",
    authDomain: "izunax-c1707.firebaseapp.com",
    projectId: "izunax-c1707",
    storageBucket: "izunax-c1707.firebasestorage.app",
    messagingSenderId: "755797664743",
    appId: "1:755797664743:web:2eaeff896c9df27075d342"
};

// Ініціалізація
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();

// Список адмінів (ваш email + спеціальний)
const ALLOWED_ADMINS = ["ВАШ_EMAIL@gmail.com", "zxc_angel@izunax.user"]; // ЗАМІНІТЬ СВІЙ EMAIL

// Функція перевірки адміна
function isAdmin(email) { return ALLOWED_ADMINS.includes(email); }

// Експортуємо в глобальний об'єкт (щоб було доступно в інших скриптах)
window.auth = auth;
window.db = db;
window.storage = storage;
window.provider = provider;
window.isAdmin = isAdmin;
