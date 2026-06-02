// Модуль атмосферных эффектов и аудио-синтезатора IZUNAX

// 1. Расчет рангов
function calculateRank(xp) {
    if (xp < 30) return "Скрипт-кидди";
    if (xp < 100) return "Нетраннер";
    if (xp < 300) return "Призрак Сети";
    return "Архитектор Виртуальности";
}

// 2. Кибер-синтезатор звука (Web Audio API)
let audioCtx = null;

function playCyberSound(type) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            // Короткий механический щелчок терминала
            osc.type = 'square';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } 
        else if (type === 'hover') {
            // Тонкий цифровой blip при наведении
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, now);
            gain.gain.setValueAtTime(0.008, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.02);
            osc.start(now);
            osc.stop(now + 0.02);
        } 
        else if (type === 'success') {
            // Восходящий аккорд успешного подключения
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.setValueAtTime(520, now + 0.06);
            osc.frequency.setValueAtTime(780, now + 0.12);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } 
        else if (type === 'error') {
            // Низкий и жесткий гул системной ошибки
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.3);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.log("Audio Context Error:", e);
    }
}

// Экспортируем функцию в глобальную видимость для Firebase скриптов
window.triggerSound = playCyberSound;

// Авто-назначение аудио-триггеров на элементы
document.addEventListener('click', (e) => {
    if (e.target.closest('button, .tab-btn, .nav-btn, .action-link')) {
        playCyberSound('click');
    }
});

document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, .tab-btn, .nav-btn, .action-link, .post-card, input, select, textarea')) {
        playCyberSound('hover');
    }
});

// 3. Матричный бэкграунд (Переведен в монохромный синий цвет под новый стиль)
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
        ctx.fillStyle = "rgba(3, 3, 5, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#00a2ff"; // Глубокий синий цвет матрицы под брутализм
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.985) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 35);
}

document.addEventListener("DOMContentLoaded", () => {
    initMatrix();
});
