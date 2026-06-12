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
    { name: 'SakuraBot', lang: 'uk' },
    { name: 'TechArt', lang: 'ru' },
];

// 70% хороші, 20% середні, 10% погані
const COMMENTS = {
    good: {
        uk: ['🔥 Дуже круто! Продовжуй!', '😍 Це неймовірно!', '💯 Топ! Я в захваті!', '✨ Магія на полотні!', '👏 Професійний рівень!', '💪 З кожним разом краще!', '🌟 Це має бути в ТОПі!', '💜 Люблю твій стиль!', '🙌 Вау, це шедевр!', '💎 Справжній діамант!'],
        en: ['🔥 So cool! Keep going!', '😍 This is amazing!', '💯 Top level!', '✨ Pure magic!', '👏 Professional work!', '💪 Better every time!', '🌟 This should be in TOP!', '💜 Love your style!', '🙌 Wow, masterpiece!', '💎 A real gem!'],
        ru: ['🔥 Очень круто! Продолжай!', '😍 Это невероятно!', '💯 Топ! Я в восторге!', '✨ Магия на холсте!', '👏 Профессионально!', '💪 С каждым разом лучше!', '🌟 Это должно быть в ТОПе!', '💜 Люблю твой стиль!', '🙌 Вау, это шедевр!', '💎 Настоящий бриллиант!']
    },
    mid: {
        uk: ['👍 Непогано', '🙂 Можна краще', '😐 Норм', '✍ Продовжуй практикуватись'],
        en: ['👍 Not bad', '🙂 Could be better', '😐 Okay', '✍ Keep practicing'],
        ru: ['👍 Неплохо', '🙂 Можно лучше', '😐 Норм', '✍ Продолжай практиковаться']
    },
    bad: {
        uk: ['😒 Не вразило', '👎 Мені не подобається', '🤷 Слабенько', '💤 Нудно'],
        en: ['😒 Not impressed', '👎 Not my style', '🤷 Weak', '💤 Boring'],
        ru: ['😒 Не впечатлило', '👎 Не мой стиль', '🤷 Слабовато', '💤 Скучно']
    }
};

function getRandomComment(bot) {
    const rand = Math.random();
    let pool;
    if (rand < 0.7) pool = 'good';
    else if (rand < 0.9) pool = 'mid';
    else pool = 'bad';
    
    const langComments = COMMENTS[pool][bot.lang] || COMMENTS[pool]['en'];
    return langComments[Math.floor(Math.random() * langComments.length)];
}

export async function startAIBot(db, collection, addDoc, getDocs, updateDoc, doc, increment, serverTimestamp) {
    console.log('🤖 AI Bot System v2 activated (Multi-lang, Rated)');
    
    async function botAction() {
        const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
        const action = Math.random();
        
        try {
            const snap = await getDocs(collection(db, 'artworks'));
            const arts = []; snap.forEach(d => arts.push({ id: d.id, ...d.data() }));
            
            if (arts.length === 0) return;
            
            const art = arts[Math.floor(Math.random() * arts.length)];
            
            if (action < 0.5) {
                // Лайк + коментар
                await updateDoc(doc(db, 'artworks', art.id), { likes: increment(1) });
                const comment = getRandomComment(bot);
                await addDoc(collection(db, `artworks/${art.id}/comments`), {
                    authorName: bot.name,
                    authorUid: 'bot_' + bot.name.toLowerCase(),
                    text: comment,
                    createdAt: serverTimestamp()
                });
                console.log(`🤖 ${bot.name} [${bot.lang}]: "${comment}" → "${art.title}"`);
            } else {
                // Тільки лайк
                await updateDoc(doc(db, 'artworks', art.id), { likes: increment(1) });
                console.log(`🤖 ${bot.name} liked "${art.title}"`);
            }
        } catch(e) { console.log('Bot error:', e.message); }
    }
    
    // Перший запуск через 10 сек, потім кожні 2-5 хвилин
    setTimeout(() => {
        botAction();
        setInterval(botAction, 120000 + Math.random() * 180000);
    }, 10000);
}