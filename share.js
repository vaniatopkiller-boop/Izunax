// IZUNAX — share.js

function shareArt(title, imageUrl, author) {
    const url = window.location.href.split('#')[0] + '#art=' + encodeURIComponent(title);
    const text = `🎨 ${title} by @${author} на IZUNAX`;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
        <div style="background:#0f0f1a;border:1px solid #ff3366;border-radius:16px;padding:24px;max-width:360px;width:100%;text-align:center;">
            <h3 style="font-family:'Cinzel',serif;margin-bottom:16px;">🔗 Поділитись</h3>
            <p style="color:#888;font-size:13px;margin-bottom:12px;">${title}</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <button onclick="shareTelegram('${text.replace(/'/g,"\\'")}','${url}')" style="padding:10px;background:#2AABEE;color:#fff;border:none;border-radius:8px;cursor:pointer;">📱 Telegram</button>
                <button onclick="shareTwitter('${text.replace(/'/g,"\\'")}','${url}')" style="padding:10px;background:#1DA1F2;color:#fff;border:none;border-radius:8px;cursor:pointer;">🐦 Twitter</button>
                <button onclick="copyLink('${url}')" style="padding:10px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;">📋 Копіювати посилання</button>
            </div>
            <button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:12px;background:transparent;border:1px solid #444;color:#888;padding:8px 20px;border-radius:8px;cursor:pointer;">Закрити</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function shareTelegram(text, url) {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

function shareTwitter(text, url) {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => alert('✅ Посилання скопійовано!'));
}