const TOKEN = "8956729095:AAGG05HpSaXkRT0rzY3nbgRjTd3gUvvxAgI";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

const LANGUAGES = {
    uk: { welcome: "Ласкаво просимо до IZUNAX! 🇺🇦\n\nОберіть дію:", menu: "🔹 Головне меню:\n1️⃣ Сайт\n2️⃣ Правила\n3️⃣ Контакти\n4️⃣ Мова" },
    ru: { welcome: "Добро пожаловать в IZUNAX! 🇷🇺\n\nВыберите действие:", menu: "🔹 Главное меню:\n1️⃣ Сайт\n2️⃣ Правила\n3️⃣ Контакты\n4️⃣ Язык" },
    en: { welcome: "Welcome to IZUNAX! 🇬🇧\n\nChoose an action:", menu: "🔹 Main menu:\n1️⃣ Website\n2️⃣ Rules\n3️⃣ Contacts\n4️⃣ Language" }
};

const defaultLang = "ru";
let userLanguages = {};

function getUserLang(userId) { return userLanguages[userId] || defaultLang; }
function setUserLang(userId, lang) { if (LANGUAGES[lang]) { userLanguages[userId] = lang; return true; } return false; }

function getText(userId, key) {
    const lang = getUserLang(userId);
    if (key === 'welcome') return LANGUAGES[lang].welcome;
    if (key === 'menu') return LANGUAGES[lang].menu;
    if (key === 'website') return "🌐 https://project-z3cuy.vercel.app";
    if (key === 'rules') return "📜 Правила спільноти: поважайте один одного, без спаму, тільки авторський контент";
    if (key === 'contacts') return "📞 Telegram: @izunax_official\n📧 Email: support@izunax.com";
    return LANGUAGES[lang].menu;
}

const languageKeyboard = {
    inline_keyboard: [[{ text: "🇺🇦 Українська", callback_data: "lang_uk" }],[{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],[{ text: "🇬🇧 English", callback_data: "lang_en" }]]
};

function getMainKeyboard(userId) {
    const lang = getUserLang(userId);
    return { inline_keyboard: [[{ text: "🌐 Сайт", callback_data: "website" }],[{ text: "📜 Правила", callback_data: "rules" }],[{ text: "📞 Контакти", callback_data: "contacts" }],[{ text: "🌍 Змінити мову", callback_data: "language" }]] };
}

async function apiCall(method, body) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch(e) { console.error("API error:", e); return null; }
}

async function sendMessage(chatId, text, keyboard = null) {
    const body = { chat_id: chatId, text: text };
    if (keyboard) body.reply_markup = JSON.stringify(keyboard);
    return await apiCall("sendMessage", body);
}

async function answerCallback(queryId, text) {
    return await apiCall("answerCallbackQuery", { callback_query_id: queryId, text: text });
}

async function getUpdates(offset = 0) {
    const result = await apiCall("getUpdates", { offset: offset, timeout: 30 });
    return result?.result || [];
}

async function handleUpdate(update) {
    try {
        if (update.message && update.message.text === "/start") {
            const chatId = update.message.chat.id;
            const userId = update.message.from.id;
            setUserLang(userId, defaultLang);
            await sendMessage(chatId, getText(userId, "welcome"), languageKeyboard);
            console.log(`✅ /start from ${userId}`);
            return;
        }
        if (update.callback_query) {
            const query = update.callback_query;
            const chatId = query.message.chat.id;
            const userId = query.from.id;
            const data = query.data;
            if (data === "lang_uk" || data === "lang_ru" || data === "lang_en") {
                const langCode = data.split("_")[1];
                setUserLang(userId, langCode);
                await answerCallback(query.id, "✅ Мову змінено!");
                await sendMessage(chatId, getText(userId, "menu"), getMainKeyboard(userId));
            }
            else if (data === "website") {
                await answerCallback(query.id, "🔗 Відкриваємо сайт...");
                await sendMessage(chatId, getText(userId, "website"));
            }
            else if (data === "rules") {
                await answerCallback(query.id, "📜 Правила...");
                await sendMessage(chatId, getText(userId, "rules"));
            }
            else if (data === "contacts") {
                await answerCallback(query.id, "📞 Контакти...");
                await sendMessage(chatId, getText(userId, "contacts"));
            }
            else if (data === "language") {
                await answerCallback(query.id, "🌍 Оберіть мову:");
                await sendMessage(chatId, getText(userId, "menu"), languageKeyboard);
            }
            return;
        }
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userId = update.message.from.id;
            await sendMessage(chatId, getText(userId, "menu"), getMainKeyboard(userId));
        }
    } catch (error) { console.error("Handle error:", error); }
}

async function main() {
    console.log("🤖 Бот запущено на Render! Починаю опитування...");
    let offset = 0;
    while (true) {
        try {
            const updates = await getUpdates(offset);
            for (const update of updates) {
                await handleUpdate(update);
                offset = update.update_id + 1;
            }
        } catch (error) { console.error("Polling error:", error); }
        await new Promise(r => setTimeout(r, 1000));
    }
}

main();
