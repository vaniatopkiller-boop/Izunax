// IZUNAX — Language System (UK, EN, RU)

const LANG = {
    uk: {
        gallery: 'Галерея',
        chat: 'Чат',
        messages: 'Повідомлення',
        bookmarks: 'Закладки',
        profile: 'Профіль',
        settings: 'Налаштування',
        login: 'Увійти',
        register: 'Реєстрація',
        logout: 'Вийти',
        search: 'Пошук',
        upload: 'Завантажити',
        share: 'Поділитись',
        like: 'Подобається',
        comment: 'Коментар',
        save: 'Зберегти',
        cancel: 'Скасувати',
        delete: 'Видалити',
        edit: 'Редагувати',
        create: 'Твори. Без границь.',
        subtitle: 'Місце для аніме-артів, скетчів і всього з чорнил',
        start: 'Почати',
        topArtists: 'ТОП автори',
        artFeed: 'Стрічка артів',
        noArts: 'Немає артів',
        loadMore: 'Завантажити ще',
        writeComment: 'Написати коментар...',
        send: 'Відправити',
        shareTelegram: 'Поділитись у Telegram',
        shareTwitter: 'Поділитись у Twitter',
        copyLink: 'Копіювати посилання',
        close: 'Закрити',
        confirmDelete: 'Ви впевнені що хочете видалити?',
        yes: 'Так',
        no: 'Ні',
        online: 'Онлайн',
        events: 'Івенти',
        achievements: 'Досягнення',
        analytics: 'Аналітика',
        export: 'Експорт',
        logs: 'Логи',
        tools: 'Інструменти',
        theme: 'Тема',
        language: 'Мова',
    },
    en: {
        gallery: 'Gallery',
        chat: 'Chat',
        messages: 'Messages',
        bookmarks: 'Bookmarks',
        profile: 'Profile',
        settings: 'Settings',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        search: 'Search',
        upload: 'Upload',
        share: 'Share',
        like: 'Like',
        comment: 'Comment',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create. No limits.',
        subtitle: 'A place for anime art, sketches and ink',
        start: 'Start',
        topArtists: 'TOP Artists',
        artFeed: 'Art Feed',
        noArts: 'No artworks',
        loadMore: 'Load more',
        writeComment: 'Write a comment...',
        send: 'Send',
        shareTelegram: 'Share on Telegram',
        shareTwitter: 'Share on Twitter',
        copyLink: 'Copy link',
        close: 'Close',
        confirmDelete: 'Are you sure you want to delete?',
        yes: 'Yes',
        no: 'No',
        online: 'Online',
        events: 'Events',
        achievements: 'Achievements',
        analytics: 'Analytics',
        export: 'Export',
        logs: 'Logs',
        tools: 'Tools',
        theme: 'Theme',
        language: 'Language',
    },
    ru: {
        gallery: 'Галерея',
        chat: 'Чат',
        messages: 'Сообщения',
        bookmarks: 'Закладки',
        profile: 'Профиль',
        settings: 'Настройки',
        login: 'Войти',
        register: 'Регистрация',
        logout: 'Выйти',
        search: 'Поиск',
        upload: 'Загрузить',
        share: 'Поделиться',
        like: 'Нравится',
        comment: 'Комментарий',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        create: 'Твори. Без границ.',
        subtitle: 'Место для аниме-артов, скетчей и всего из чернил',
        start: 'Начать',
        topArtists: 'ТОП авторы',
        artFeed: 'Лента артов',
        noArts: 'Нет артов',
        loadMore: 'Загрузить ещё',
        writeComment: 'Написать комментарий...',
        send: 'Отправить',
        shareTelegram: 'Поделиться в Telegram',
        shareTwitter: 'Поделиться в Twitter',
        copyLink: 'Копировать ссылку',
        close: 'Закрыть',
        confirmDelete: 'Вы уверены что хотите удалить?',
        yes: 'Да',
        no: 'Нет',
        online: 'Онлайн',
        events: 'События',
        achievements: 'Достижения',
        analytics: 'Аналитика',
        export: 'Экспорт',
        logs: 'Логи',
        tools: 'Инструменты',
        theme: 'Тема',
        language: 'Язык',
    }
};

// Отримати поточну мову
function getLang() {
    return localStorage.getItem('izunax_lang') || 'uk';
}

// Встановити мову
function setLang(lang) {
    localStorage.setItem('izunax_lang', lang);
    translatePage();
}

// Перекласти сторінку
function translatePage() {
    const lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (LANG[lang] && LANG[lang][key]) {
            el.textContent = LANG[lang][key];
        }
    });
}

// Запустити при завантаженні
document.addEventListener('DOMContentLoaded', translatePage);