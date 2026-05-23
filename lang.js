// ========== СИСТЕМА ЛОКАЛІЗАЦІЇ ==========
// Підтримувані мови
const LANGUAGES = {
    uk: { name: "Українська", flag: "🇺🇦", code: "uk" },
    ru: { name: "Русский", flag: "🇷🇺", code: "ru" },
    en: { name: "English", flag: "🇬🇧", code: "en" }
};

// Переклади для всього сайту
const translations = {
    uk: {
        // Навігація
        nav_home: "Головна",
        nav_gallery: "Галерея",
        nav_chat: "Чат",
        nav_profile: "Профіль",
        nav_admin: "Адмін",
        nav_login: "Увійти",
        nav_logout: "Вийти",
        nav_register: "Реєстрація",
        
        // Hero секція
        hero_title: "Твори. Без кордонів.",
        hero_subtitle: "Платформа для авторів, художників та творців",
        hero_btn_start: "Почати творити",
        hero_btn_explore: "Досліджувати",
        
        // Стрічка
        feed_title: "Стрічка публікацій",
        feed_new_post: "+ Новий пост",
        feed_no_posts: "Поки немає постів. Створіть перший!",
        feed_post_image: "Зображення",
        feed_post_text: "Текст публікації",
        feed_publish: "Опублікувати",
        feed_cancel: "Скасувати",
        
        // Профіль
        profile_title: "Мій профіль",
        profile_name: "Ім'я",
        profile_email: "Email",
        profile_bio: "Про себе",
        profile_avatar: "Аватар",
        profile_save: "Зберегти зміни",
        profile_logout: "Вийти",
        
        // Чат
        chat_title: "Спільний чат",
        chat_placeholder: "Ваше повідомлення...",
        chat_send: "Надіслати",
        
        // Галерея
        gallery_title: "Галерея робіт",
        gallery_author: "Автор",
        
        // Повідомлення
        msg_login_required: "Потрібно увійти",
        msg_saved: "Збережено!",
        msg_error: "Помилка",
        msg_confirm_delete: "Ви впевнені?",
        
        // Пости
        post_create: "Створити пост",
        post_edit: "Редагувати",
        post_delete: "Видалити",
        post_like: "Подобається",
        post_comment: "Коментувати",
        
        // Кнопки
        btn_save: "Зберегти",
        btn_cancel: "Скасувати",
        btn_delete: "Видалити",
        btn_edit: "Редагувати"
    },
    ru: {
        nav_home: "Главная",
        nav_gallery: "Галерея",
        nav_chat: "Чат",
        nav_profile: "Профиль",
        nav_admin: "Админ",
        nav_login: "Войти",
        nav_logout: "Выйти",
        nav_register: "Регистрация",
        hero_title: "Твори. Без границ.",
        hero_subtitle: "Платформа для авторов, художников и творцов",
        hero_btn_start: "Начать творить",
        hero_btn_explore: "Исследовать",
        feed_title: "Лента публикаций",
        feed_new_post: "+ Новый пост",
        feed_no_posts: "Пока нет постов. Создайте первый!",
        feed_post_image: "Изображение",
        feed_post_text: "Текст публикации",
        feed_publish: "Опубликовать",
        feed_cancel: "Отмена",
        profile_title: "Мой профиль",
        profile_name: "Имя",
        profile_email: "Email",
        profile_bio: "О себе",
        profile_avatar: "Аватар",
        profile_save: "Сохранить изменения",
        profile_logout: "Выйти",
        chat_title: "Общий чат",
        chat_placeholder: "Ваше сообщение...",
        chat_send: "Отправить",
        gallery_title: "Галерея работ",
        gallery_author: "Автор",
        msg_login_required: "Необходимо войти",
        msg_saved: "Сохранено!",
        msg_error: "Ошибка",
        msg_confirm_delete: "Вы уверены?",
        post_create: "Создать пост",
        post_edit: "Редактировать",
        post_delete: "Удалить",
        post_like: "Нравится",
        post_comment: "Комментировать",
        btn_save: "Сохранить",
        btn_cancel: "Отмена",
        btn_delete: "Удалить",
        btn_edit: "Редактировать"
    },
    en: {
        nav_home: "Home",
        nav_gallery: "Gallery",
        nav_chat: "Chat",
        nav_profile: "Profile",
        nav_admin: "Admin",
        nav_login: "Login",
        nav_logout: "Logout",
        nav_register: "Register",
        hero_title: "Create. Without limits.",
        hero_subtitle: "Platform for authors, artists and creators",
        hero_btn_start: "Start creating",
        hero_btn_explore: "Explore",
        feed_title: "Feed",
        feed_new_post: "+ New post",
        feed_no_posts: "No posts yet. Create the first one!",
        feed_post_image: "Image",
        feed_post_text: "Post text",
        feed_publish: "Publish",
        feed_cancel: "Cancel",
        profile_title: "My profile",
        profile_name: "Name",
        profile_email: "Email",
        profile_bio: "About me",
        profile_avatar: "Avatar",
        profile_save: "Save changes",
        profile_logout: "Logout",
        chat_title: "Public chat",
        chat_placeholder: "Your message...",
        chat_send: "Send",
        gallery_title: "Art gallery",
        gallery_author: "Author",
        msg_login_required: "Login required",
        msg_saved: "Saved!",
        msg_error: "Error",
        msg_confirm_delete: "Are you sure?",
        post_create: "Create post",
        post_edit: "Edit",
        post_delete: "Delete",
        post_like: "Like",
        post_comment: "Comment",
        btn_save: "Save",
        btn_cancel: "Cancel",
        btn_delete: "Delete",
        btn_edit: "Edit"
    }
};

// Поточна мова (з localStorage або браузера)
let currentLang = localStorage.getItem('izunax_lang') || 'uk';

// Функція перекладу
function t(key) {
    return translations[currentLang]?.[key] || translations['uk'][key] || key;
}

// Зміна мови
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('izunax_lang', lang);
        translatePage();
    }
}

// Переклад всієї сторінки
function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.placeholder = t(key);
    });
    document.title = t('nav_home') + " - IZUNAX";
}

// Додати селектор мови на сторінку
function addLanguageSelector() {
    const selector = document.createElement('div');
    selector.className = 'language-selector';
    selector.style.cssText = 'position:fixed; bottom:80px; right:15px; z-index:1000; background:#1e1e28; border-radius:40px; padding:5px; display:flex; gap:5px; box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    selector.innerHTML = Object.values(LANGUAGES).map(lang => 
        `<button onclick="setLanguage('${lang.code}')" style="background:${currentLang === lang.code ? '#8a6eff' : 'transparent'}; border:none; border-radius:30px; padding:8px 12px; cursor:pointer; color:white; font-size:0.9rem;">${lang.flag} ${lang.name.substring(0,2)}</button>`
    ).join('');
    document.body.appendChild(selector);
}

// Запуск при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    addLanguageSelector();
});
