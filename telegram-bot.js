// ========== TELEGRAM БОТ ДЛЯ IZUNAX ==========
// Токен: 8956729095:AAGG05HpSaXkRT0rzY3nbgRjTd3gUvvxAgI

const TOKEN = "8956729095:AAGG05HpSaXkRT0rzY3nbgRjTd3gUvvxAgI";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// Мови
const LANGUAGES = {
    uk: { name: "Українська", code: "uk", welcome: "Ласкаво просимо до IZUNAX! 🇺🇦\n\nЦе спільнота для авторів та художників.\n\nОберіть дію:", 
          menu: "🔹 Головне меню:\n1️⃣ Сайт\n2️⃣ Правила\n3️⃣ Контакти\n4️⃣ Мова" },
    ru: { name: "Русский", code: "ru", welcome: "Добро пожаловать в IZUNAX! 🇷🇺\n\nЭто сообщество для авторов и художников.\n\nВыберите действие:",
          menu: "🔹 Главное меню:\n1️⃣ Сайт\n2️⃣ Правила\n3️⃣ Контакты\n4️⃣ Язык" },
    en: { name: "English", code: "en", welcome: "Welcome to IZUNAX! 🇬🇧\n\nThis is a community for authors and artists.\n\nChoose an action:",
          menu: "🔹 Main menu:\n1️⃣ Website\n2️⃣ Rules\n3️⃣ Contacts\n4️⃣ Language" }
};

const defaultLang = "ru";
let userLanguages = {};

function getUserLang(userId) {
    return userLanguages[userId] || defaultLang;
}

function setUserLang(userId, lang) {
    if (LANGUAGES[lang]) {
        userLanguages[userId] = lang;
        return true;
    }
    return false;
}

function getText(userId, key) {
    const lang = getUserLang(userId);
    switch(key) {
        case 'welcome': return LANGUAGES[lang].welcome;
        case 'menu': return LANGUAGES[lang].menu;
        case 'website': 
            if (lang === 'uk') return "🌐 Наш сайт: https://project-z3cuy.vercel.app";
            if (lang === 'ru') return "🌐 Наш сайт: https://project-z3cuy.vercel.app";
            return "🌐 Our website: https://project-z3cuy.vercel.app";
        case 'rules':
            if (lang === 'uk') return "📜 Правила спільноти:\n1. Поважайте один одного\n2. Без спаму та реклами\n3. Тільки авторський контент\n4. Порушення = бан";
            if (lang === 'ru') return "📜 Правила сообщества:\n1. Уважайте друг друга\n2. Без спама и рекламы\n3. Только авторский контент\n4. Нарушение = бан";
            return "📜 Community rules:\n1. Respect each other\n2. No spam or ads\n3. Only original content\n4. Violation = ban";
        case 'contacts':
            if (lang === 'uk') return "📞 Контакти:\n• Telegram: @izunax_official\n• Discord: izunax.com/discord\n• Email: support@izunax.com";
            if (lang === 'ru') return "📞 Контакты:\n• Telegram: @izunax_official\n• Discord: izunax.com/discord\n• Email: support@izunax.com";
            return "📞 Contacts:\n• Telegram: @izunax_official\n• Discord: izunax.com/discord\n• Email: support@izunax.com";
        case 'lang_changed':
            if (lang === 'uk') return "🇺🇦 Мову змінено на Українську!";
            if (lang === 'ru') return "🇷🇺 Язык изменен на Русский!";
            return "🇬🇧 Language changed to English!";
        default: return LANGUAGES[defaultLang].menu;
    }
}

// Клавіатура вибору мови
const languageKeyboard = {
    inline_keyboard: [
        [{ text: "🇺🇦 Українська", callback_data: "lang_uk" }],
        [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
        [{ text: "🇬🇧 English", callback_data: "lang_en" }]
    ]
};

// Головна клавіатура
function getMainKeyboard(userId) {
    const lang = getUserLang(userId);
    return {
        inline_keyboard: [
            [{ text: LANGUAGES[lang].code === 'uk' ? "🌐 Сайт" : (LANGUAGES[lang].code === 'ru' ? "🌐 Сайт" : "🌐 Website"), callback_data: "website" }],
            [{ text: LANGUAGES[lang].code === 'uk' ? "📜 Правила" : (LANGUAGES[lang].code === 'ru' ? "📜 Правила" : "📜 Rules"), callback_data: "rules" }],
            [{ text: LANGUAGES[lang].code === 'uk' ? "📞 Контакти" : (LANGUAGES[lang].code === 'ru' ? "📞 Контакты" : "📞 Contacts"), callback_data: "contacts" }],
            [{ text: LANGUAGES[lang].code === 'uk' ? "🌍 Змінити мову" : (LANGUAGES[lang].code === 'ru' ? "🌍 Сменить язык" : "🌍 Change language"), callback_data: "language" }]
        ]
    };
}

async function sendMessage(chatId, text, keyboard = null) {
    const url = `${TELEGRAM_API}/sendMessage`;
    const body = { chat_id: chatId, text: text, parse_mode: "HTML" };
    if (keyboard) body.reply_markup = JSON.stringify(keyboard);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (error) {
        console.error("Send error:", error);
    }
}

async function answerCallback(queryId, text, showAlert = false) {
    const url = `${TELEGRAM_API}/answerCallbackQuery`;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callback_query_id: queryId, text: text, show_alert: showAlert })
        });
    } catch (error) {
        console.error("Callback error:", error);
    }
}

async function setWebhook() {
    const url = `${TELEGRAM_API}/setWebhook`;
    const webhookUrl = "https://project-z3cuy.vercel.app/api/bot";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: webhookUrl })
        });
        const data = await response.json();
        console.log("Webhook set:", data);
    } catch (error) {
        console.error("Webhook error:", error);
    }
}

// Обробник повідомлень
async function handleUpdate(update) {
    try {
        // Обробка команди /start
        if (update.message && update.message.text === "/start") {
            const chatId = update.message.chat.id;
            const userId = update.message.from.id;
            setUserLang(userId, defaultLang);
            await sendMessage(chatId, getText(userId, "welcome"), languageKeyboard);
            return;
        }
        
        // Обробка callback (кнопки)
        if (update.callback_query) {
            const query = update.callback_query;
            const chatId = query.message.chat.id;
            const userId = query.from.id;
            const data = query.data;
            
            if (data === "lang_uk" || data === "lang_ru" || data === "lang_en") {
                const langCode = data.split("_")[1];
                setUserLang(userId, langCode);
                await answerCallback(query.id, getText(userId, "lang_changed"));
                await sendMessage(chatId, getText(userId, "menu"), getMainKeyboard(userId));
            }
            else if (data === "website") {
                await answerCallback(query.id, "🔗 Відкриваємо сайт...");
                await sendMessage(chatId, getText(userId, "website"));
            }
            else if (data === "rules") {
                await answerCallback(query.id, "📜 Завантажуємо правила...");
                await sendMessage(chatId, getText(userId, "rules"));
            }
            else if (data === "contacts") {
                await answerCallback(query.id, "📞 Завантажуємо контакти...");
                await sendMessage(chatId, getText(userId, "contacts"));
            }
            else if (data === "language") {
                await answerCallback(query.id, "🌍 Оберіть мову:");
                await sendMessage(chatId, getText(userId, "menu"), languageKeyboard);
            }
            return;
        }
        
        // Звичайне текстове повідомлення
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userId = update.message.from.id;
            const text = update.message.text;
            
            if (text === "1" || text.toLowerCase() === "сайт" || text.toLowerCase() === "website") {
                await sendMessage(chatId, getText(userId, "website"));
            }
            else if (text === "2" || text.toLowerCase() === "правила" || text.toLowerCase() === "rules") {
                await sendMessage(chatId, getText(userId, "rules"));
            }
            else if (text === "3" || text.toLowerCase() === "контакты" || text.toLowerCase() === "contacts") {
                await sendMessage(chatId, getText(userId, "contacts"));
            }
            else if (text === "4" || text.toLowerCase() === "мова" || text.toLowerCase() === "язык" || text.toLowerCase() === "language") {
                await sendMessage(chatId, getText(userId, "menu"), languageKeyboard);
            }
            else {
                await sendMessage(chatId, getText(userId, "menu"), getMainKeyboard(userId));
            }
        }
    } catch (error) {
        console.error("Handle error:", error);
    }
}

// Експорт для Vercel serverless function
if (typeof module !== "undefined" && module.exports) {
    module.exports = async (req, res) => {
        if (req.method === "POST") {
            try {
                await handleUpdate(req.body);
                res.status(200).json({ status: "ok" });
            } catch (error) {
                res.status(200).json({ status: "error", message: error.message });
            }
        } else if (req.method === "GET" && req.url === "/api/bot/setup") {
            await setWebhook();
            res.status(200).json({ status: "webhook set" });
        } else {
            res.status(200).send("Bot is running");
        }
    };
}

// Якщо запускаємо локально (для тесту)
if (typeof window === "undefined" && !module.parent) {
    setWebhook();
    console.log("Bot started with webhook");
}
