// Модуль атмосферных эффектов и игровых механик IZUNAX

// Расчет рангов
function calculateRank(xp) {
    if (xp < 30) return "Скрипт-кидди";
    if (xp < 100) return "Нетраннер";
    if (xp < 300) return "Призрак Сети";
    return "Архитектор Виртуальности";
}

// Кибер-звук кликов
const clickSound = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3');
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('tab-btn') || e.target.classList.contains('nav-btn')) {
        clickSound.play().catch(() => {});
    }
});

// Матричный бэкграунд
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = "IZUNAX0101";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(5, 5, 10, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#0ff";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 33);
}

document.addEventListener("DOMContentLoaded", () => {
    initMatrix();
});
