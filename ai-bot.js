// IZUNAX — AI Bot System v2 (Multi-lang, rated comments)

const BOTS = [
    { name: 'Yuki_AI', lang: 'uk' },
    { name: 'ShadowBot', lang: 'en' },
    { name: 'NeonArtist', lang: 'ru' },
    { name: 'PixelGhost', lang: 'en' },
    { name: 'InkDemon', lang: 'uk' },
    { name: 'Kitsune_Draw', lang: 'ru' },
    { name: 'CyberPaint', lang: 'en' },
    { name: 'HoloSketch', lang: 'uk' },
    { name: 'MoonBrush', lang: 'ru' },
    { name: 'StarInk', lang: 'en' },
];

const COMMENTS = {
    good: {
        uk: ['🔥 Дуже круто!', '😍 Неймовірно!', '💯 Топ!', '✨ Магія!', '👏 Професійно!', '💜 Люблю твій стиль!', '🙌 Шедевр!'],
        en: ['🔥 So cool!', '😍 Amazing!', '💯 Top level!', '✨ Pure magic!', '👏 Professional!', '💜 Love your style!', '🙌 Masterpiece!'],
        ru: ['🔥 Очень круто!', '😍 Невероятно!', '💯 Топ!', '✨ Магия!', '👏 Профессионально!', '💜 Люблю твой стиль!', '🙌 Шедевр!']
    },
    mid: {
        uk: ['👍 Непогано', '🙂 Можна краще', '✍ Продовжуй практикуватись'],
        en: ['👍 Not bad', '🙂 Could be better', '✍ Keep practicing'],
        ru: ['👍 Неплохо', '🙂 Можно лучше', '✍ Продолжай практиковаться']
    },
    bad: {
        uk: ['😒 Не вразило', '🤷 Слабенько'],
        en: ['😒 Not impressed', '🤷 Weak'],
        ru: ['😒 Не впечатлило', '🤷 Слабовато']
    }
};

function getRandomComment(bot) {
    const rand = Math.random();
    const pool = rand < 0.7 ? 'good' : rand < 0.9 ? 'mid' : 'bad';
    const arr = COMMENTS[pool][bot.lang] || COMMENTS[pool]['en'];
    return arr[Math.floor(Math.random() * arr.length)];
}

let _botStarted = false;

export async function startAIBot(db, collection, addDoc, getDocs, updateDoc, doc, increment, serverTimestamp) {
    // Захист від дублювання через sessionStorage
    if (sessionStorage.getItem('_izunax_bot_running')) return;
    sessionStorage.setItem('_izunax_bot_running', '1');
    if (_botStarted) return;
    _botStarted = true;

    console.log('🤖 AI Bot System v2 activated');

    async function botAction() {
        try {
            const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
            const snap = await getDocs(collection(db, 'artworks'));
            const arts = [];
            snap.forEach(d => arts.push({ id: d.id, ...d.data() }));
            if (!arts.length) return;

            const art = arts[Math.floor(Math.random() * arts.length)];

            if (Math.random() < 0.5) {
                await updateDoc(doc(db, 'artworks', art.id), { likes: increment(1) });
                const comment = getRandomComment(bot);
                await addDoc(collection(db, `artworks/${art.id}/comments`), {
                    authorName: bot.name,
                    authorUid: 'bot_' + bot.name.toLowerCase(),
                    text: comment,
                    createdAt: serverTimestamp()
                });
            } else {
                await updateDoc(doc(db, 'artworks', art.id), { likes: increment(1) });
            }
        } catch(e) { /* тихо */ }
    }

    // Перший запуск через 15 сек, потім кожні 3-6 хвилин
    setTimeout(() => {
        botAction();
        setInterval(botAction, 180000 + Math.random() * 180000);
    }, 15000);
}
