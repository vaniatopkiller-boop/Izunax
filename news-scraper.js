// Окремий модуль парсингу та агрегації новин для IZUNAX Core
// Забезпечений обходом CORS, живим пошуком, фільтрацією дублікатів та розумним імпортом

let loadedScrapedNews = [];
let newsSearchQuery = "";
let activeNewsCategory = "all";

// Список резервних проксі для гарантованого обходу блокувань CORS
const corsProxies = [
    "[https://api.allorigins.win/get?url=](https://api.allorigins.win/get?url=)",
    "[https://corsproxy.io/](https://corsproxy.io/)?",
    "[https://thingproxy.freeboard.io/fetch/](https://thingproxy.freeboard.io/fetch/)"
];
let currentProxyIndex = 0;

// Реальні RSS-канали ігрових та IT сайтів
const rssFeedsSources = [
    { url: "[https://itc.ua/tag/igry/feed/](https://itc.ua/tag/igry/feed/)", category: "games" },
    { url: "[https://gagadget.com/ru/games/rss/](https://gagadget.com/ru/games/rss/)", category: "games" },
    { url: "[https://itc.ua/feed/](https://itc.ua/feed/)", category: "hardware" }
];

// Автономна база даних (резервний пул на випадок офлайну або збою всіх проксі)
const offlineFallbackNews = [
    { title: "Реліз S.T.A.L.K.E.R. 2: Серце Чорнобиля б'є всі рекорди онлайну", description: "Український шутер від GSC Game World офіційно став найпопулярнішим релізом сезону, зібравши сотні тисяч гравців одночасно.", link: "[https://itc.ua](https://itc.ua)", category: "games" },
    { title: "Sony таємно готує анонс PlayStation 6 із підтримкою революційного ШІ", description: "Інсайдери повідомляють про нову архітектуру чипа, яка дозволить генерувати текстури на льоту за допомогою нейромереж.", link: "[https://itc.ua](https://itc.ua)", category: "hardware" },
    { title: "Турнір з Counter-Strike 2 у Києві зібрав рекордні призові фонди", description: "Кіберспортивна ліга анонсувала масштабні змагання за участю топових світових колективів.", link: "[https://itc.ua](https://itc.ua)", category: "esports" }
];

// Головна функція запуску парсингу
async function startNewsScraping(append = false) {
    const container = document.getElementById('itc-view');
    const loader = document.getElementById('news-loader');
    if (!container) return;
    
    if (!append) {
        container.innerHTML = "";
        loadedScrapedNews = [];
    }
    
    if (loader) loader.innerText = "🔄 Синхронізація потоків даних...";

    let success = false;

    // Пробуємо обійти CORS через резервні проксі
    for (let i = 0; i < corsProxies.length; i++) {
        let proxy = corsProxies[currentProxyIndex];
        try {
            const feed = rssFeedsSources[Math.floor(Math.random() * rssFeedsSources.length)];
            const response = await fetch(`${proxy}${encodeURIComponent(feed.url)}`, { signal: AbortSignal.timeout(6000) });
            const result = await response.json();
            
            // Отримуємо чистий XML контент
            let xmlText = result.contents || result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const items = xmlDoc.getElementsByTagName("item");

            if (items.length > 0) {
                for (let item of items) {
                    let title = item.getElementsByTagName("title")[0]?.textContent || "";
                    let link = item.getElementsByTagName("link")[0]?.textContent || "";
                    let desc = item.getElementsByTagName("description")[0]?.textContent || "Інформаційний пакет синхронізовано.";
                    
                    // Очищення від HTML тегів
                    desc = desc.replace(/<[^>]*>/g, '').substring(0, 180);

                    // Виключаємо дублікати
                    if (!loadedScrapedNews.some(n => n.link === link)) {
                        loadedScrapedNews.push({
                            title,
                            description: desc,
                            link,
                            category: feed.category,
                            source: "RSS_GATEWAY"
                        });
                    }
                }
                success = true;
                break; // Виходимо з циклу проксі, якщо отримали дані
            }
        } catch (err) {
            console.warn(`Проксі ${proxy} тимчасово недоступний. Переключення...`);
            currentProxyIndex = (currentProxyIndex + 1) % corsProxies.length;
        }
    }

    // Якщо всі проксі впали, завантажуємо резервний офлайн-пул новин
    if (!success && loadedScrapedNews.length === 0) {
        console.log("Зовнішні шлюзи недоступні. Активовано автономну базу даних.");
        loadedScrapedNews = [...offlineFallbackNews];
    }

    renderNewsFeed();
    if (loader) loader.innerText = "⚡ Потоки синхронізовано";
}

// Рендеринг та фільтрація новин у реальному часі
function renderNewsFeed() {
    const container = document.getElementById('itc-view');
    if (!container) return;
    container.innerHTML = "";

    // Застосовуємо фільтри категорії та живого пошуку
    const filtered = loadedScrapedNews.filter(news => {
        const matchesCategory = activeNewsCategory === "all" || news.category === activeNewsCategory;
        const matchesSearch = news.title.toLowerCase().includes(newsSearchQuery.toLowerCase()) || 
                              news.description.toLowerCase().includes(newsSearchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="insta-post" style="padding:20px; text-align:center;">Інформаційні пакети не знайдені. Спробуйте скинути фільтри.</div>`;
        return;
    }

    filtered.forEach(news => {
        let placeholderImg = `https://picsum.photos/seed/${encodeURIComponent(news.title.substring(0, 5))}/600/350`;
        
        container.innerHTML += `
            <div class="insta-post">
                <div class="post-author-bar">
                    <div class="author-info">
                        <div style="width:10px; height:10px; background:var(--neon-purple); border-radius:50%; box-shadow:0 0 10px var(--neon-purple);"></div>
                        <span class="author-name">IZUNAX // BOT_ПАРСЕР</span>
                    </div>
                    <span class="post-time" style="text-transform: uppercase; color: var(--neon-glow); font-size: 10px;">${news.category}</span>
                </div>
                <div class="post-media-container">
                    <img src="${placeholderImg}" alt="Медіа">
                </div>
                <div class="post-content-block" style="padding-top:15px;">
                    <div class="post-main-title" style="font-size:16px;">${news.title}</div>
                    <p class="post-desc" style="margin-bottom:15px;">${news.description}...</p>
                    
                    <div style="display:flex; gap:10px;">
                        <a href="${news.link}" target="_blank" class="btn-main" style="padding:8px 15px; font-size:11px; text-decoration:none; margin:0; border-radius:8px; width:auto;">Джерело ↗</a>
                        <button onclick="importToHubFeed('${escapeHtml(news.title)}', '${escapeHtml(news.description)}', '${placeholderImg}')" class="btn-main" style="padding:8px 15px; font-size:11px; margin:0; border-radius:8px; width:auto; background:linear-gradient(135deg, var(--accent-green) 0%, #059669 100%); box-shadow:none;">Імпорт в Ленту +</button>
                    </div>
                </div>
            </div>`;
    });
}

// Захист від ін'єкцій коду при імпорті
function escapeHtml(text) {
    return text
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Перемикання категорій новин
function filterNewsByCategory(category) {
    activeNewsCategory = category;
    document.querySelectorAll('.news-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderNewsFeed();
}

// Живий пошук
function handleNewsSearch(value) {
    newsSearchQuery = value;
    renderNewsFeed();
}

// Функція імпорту новини до загальної бази даних Firebase
function importToHubFeed(title, desc, imgUrl) {
    if (typeof window.importNewsToFirebase === 'function') {
        window.importNewsToFirebase(title, desc, imgUrl);
    } else {
        alert("Двигун авторизації не запущений. Увійдіть до термінала.");
    }
}
