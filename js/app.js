// IZUNAX — app.js

// --- Burger меню ---
const burgerBtn = document.getElementById('burgerBtn');
const mobileNav = document.getElementById('mobileNav');
if (burgerBtn && mobileNav) {
  burgerBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
}

// --- Счётчики статов ---
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

// Запускаем счётчик когда stats-bar попадает во viewport
const statNums = document.querySelectorAll('.stat-num');
const targets = [0, 0, 0]; // Заполни когда будут юзеры

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      statNums.forEach((el, i) => {
        animateCounter(el, targets[i]);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// --- Загрузка последних постов из demo-posts.json ---
async function loadRecentPosts() {
  const grid = document.getElementById('postsGrid');
  if (!grid) return;

  try {
    const res = await fetch('data/demo-posts.json');
    if (!res.ok) return; // если файл не найден — оставляем плейсхолдеры
    const posts = await res.json();

    grid.innerHTML = '';
    posts.slice(0, 6).forEach((post, i) => {
      const card = document.createElement('div');
      card.className = 'post-card';
      card.style.cssText = `
        background: var(--bg2);
        border: 1px solid var(--border);
        overflow: hidden;
        position: relative;
        cursor: pointer;
        animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        animation-delay: ${i * 0.07}s;
      `;
      card.innerHTML = `
        <div style="aspect-ratio:3/4;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:2rem;">
          ${post.emoji || '✦'}
        </div>
        <div style="padding:0.8rem 1rem;">
          <div style="font-family:'Cinzel',serif;font-size:0.85rem;letter-spacing:0.1em;margin-bottom:0.2rem;">${post.title}</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">@${post.author}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    // плейсхолдеры остаются
  }
}

loadRecentPosts();
