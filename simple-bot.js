const TOKEN = "8956729095:AAGG05HpSaXkRT0rzY3nbgRjTd3gUvvxAgI";
const express = require('express');
const app = express();
app.use(express.json());

// Головна сторінка
app.get('/', (req, res) => {
    res.send('🤖 IZUNAX Bot is running!');
});

// Webhook для Telegram
app.post(`/webhook/${TOKEN}`, async (req, res) => {
    const update = req.body;
    console.log("Update:", JSON.stringify(update));
    
    if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: "🇺🇦 Ласкаво просимо до IZUNAX!\n🇷🇺 Добро пожаловать!\n🇬🇧 Welcome!",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🌐 Сайт", callback_data: "site" }],
                        [{ text: "📜 Правила", callback_data: "rules" }]
                    ]
                }
            })
        });
    }
    
    if (update.callback_query) {
        const query = update.callback_query;
        const chatId = query.message.chat.id;
        const data = query.data;
        
        let text = "";
        if (data === "site") text = "https://project-z3cuy.vercel.app";
        if (data === "rules") text = "Правила: поважайте один одного, без спаму!";
        
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text })
        });
        
        await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: query.id })
        });
    }
    
    res.sendStatus(200);
});

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Бот запущено на порту ${port}`);
    
    // Встановлюємо webhook
    const webhookUrl = `https://izunax-bot.onrender.com/webhook/${TOKEN}`;
    fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook?url=${webhookUrl}`)
        .then(res => res.json())
        .then(data => console.log("Webhook set:", data))
        .catch(err => console.error("Webhook error:", err));
});
