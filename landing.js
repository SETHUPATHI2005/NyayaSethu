// ── SCROLL REVEAL ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.step, .law-card').forEach(el => revealObserver.observe(el));

// ── COUNTER ANIMATION ──
function animateCount(el, target) {
  let current = 0;
  const suffix = el.textContent.replace(/[0-9]/g, '');
  const step = target / 55;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + suffix;
    if (current >= target) clearInterval(timer);
  }, 22);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('strong').forEach(strong => {
        const text = strong.textContent.trim();
        const num = parseInt(text);
        if (!isNaN(num)) animateCount(strong, num);
      });
      statObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero-stats');
if (statsEl) statObserver.observe(statsEl);

// ── 3D CARD TILT ──
document.querySelectorAll('.law-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `translateY(-8px) rotateX(${-y / rect.height * 7}deg) rotateY(${x / rect.width * 7}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
