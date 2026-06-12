const TOKEN = "8956729095:AAGG05HpSaXkRT0rzY3nbgRjTd3gUvvxAgI";

async function sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: text })
        });
        return await res.json();
    } catch(e) { console.error("Error:", e); }
}

async function getUpdates(offset = 0) {
    const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?timeout=30&offset=${offset}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.result || [];
    } catch(e) { console.error("Polling error:", e); return []; }
}

async function main() {
    console.log("🤖 Тестовий бот запущено!");
    let offset = 0;
    while (true) {
        const updates = await getUpdates(offset);
        for (const update of updates) {
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text;
                console.log(`Отримано: ${text} від ${chatId}`);
                await sendMessage(chatId, `Ви написали: ${text}`);
                offset = update.update_id + 1;
            }
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

main();
