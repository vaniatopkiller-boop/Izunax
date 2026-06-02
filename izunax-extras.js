// Модуль фонового рендерингу та аудіосигналів

const feedbackSounds = {
    click: new Audio('[https://www.soundjay.com/buttons/sounds/button-3.mp3](https://www.soundjay.com/buttons/sounds/button-3.mp3)'),
    hover: new Audio('[https://www.soundjay.com/buttons/sounds/button-16.mp3](https://www.soundjay.com/buttons/sounds/button-16.mp3)'),
    success: new Audio('[https://www.soundjay.com/communication/sounds/beep-09.mp3](https://www.soundjay.com/communication/sounds/beep-09.mp3)'),
    error: new Audio('[https://www.soundjay.com/communication/sounds/beep-10.mp3](https://www.soundjay.com/communication/sounds/beep-10.mp3)')
};

feedbackSounds.click.volume = 0.25;
feedbackSounds.hover.volume = 0.1;
feedbackSounds.success.volume = 0.35;
feedbackSounds.error.volume = 0.4;

function triggerInterfaceSound(type) {
    const sound = feedbackSounds[type];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}
window.triggerSound = triggerInterfaceSound;

document.addEventListener('click', (e) => {
    if (e.target.closest('button, .tab-btn, .nav-btn, .action-link')) triggerInterfaceSound('click');
});
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, .tab-btn, .nav-btn, .action-link, .post-card, input, select, textarea')) triggerInterfaceSound('hover');
});

// Рідкий неоновий фон
function initNeonBackground() {
    const canvas = document.getElementById('fluid-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let blobs = [
        { x: canvas.width * 0.3, y: canvas.height * 0.4, vx: 0.6, vy: 0.4, r: 280, color: 'rgba(147, 51, 234, 0.25)' },
        { x: canvas.width * 0.7, y: canvas.height * 0.6, vx: -0.4, vy: -0.5, r: 320, color: 'rgba(192, 132, 252, 0.18)' }
    ];

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        blobs.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;

            if (b.x - b.r < 0 || b.x + b.r > canvas.width) b.vx *= -1;
            if (b.y - b.r < 0 || b.y + b.r > canvas.height) b.vy *= -1;

            let grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
            grad.addColorStop(0, b.color);
            grad.addColorStop(1, 'rgba(5, 2, 12, 0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

document.addEventListener("DOMContentLoaded", initNeonBackground);
