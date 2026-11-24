/* ============================================================
   SUPER MARIO 64 — FAN SITE
   Interacciones: navegación, reveal, contadores, acordeón,
   búsqueda de estrellas ocultas y confeti.
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Navegación fija ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');

  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  menuBtn.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenu(false);
  });

  /* ---------- Animaciones de entrada ---------- */
  const revealEls = $$('[data-reveal]');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');

  function animateCount(el) {
    const target = Number(el.dataset.count) || 0;
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }

    if (prefersReduced) {
      el.textContent = String(target);
      return;
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------- Acordeón ---------- */
  $$('.acc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc-item');
      const willOpen = !item.classList.contains('open');

      $$('.acc-item.open').forEach((openItem) => {
        openItem.classList.remove('open');
        $('.acc-btn', openItem).setAttribute('aria-expanded', 'false');
      });

      if (willOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Enlace activo en la navegación ---------- */
  const navAnchors = $$('.nav-links a[href^="#"]');
  const sections = navAnchors
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        });
      },
      { rootMargin: '-38% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Tilt sutil en la imagen del hero ---------- */
  const heroArt = $('.hero-art');
  const heroFrame = $('.hero-art-frame');

  if (!prefersReduced && heroArt && heroFrame && window.matchMedia('(pointer: fine)').matches) {
    heroArt.addEventListener('mousemove', (e) => {
      const rect = heroArt.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroFrame.style.transform = `rotate(1.5deg) perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    });
    heroArt.addEventListener('mouseleave', () => {
      heroFrame.style.transform = '';
    });
  }

  /* ============================================================
     BÚSQUEDA DE ESTRELLAS OCULTAS
     ============================================================ */
  const STORAGE_KEY = 'm64-hidden-stars';
  const TOTAL = 5;
  const stars = $$('.star-pickup');
  const starPill = $('#starPill');
  const starCount = $('#starCount');
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const starProgress = $('#starProgress');
  const hintBtn = $('#hintBtn');
  const hintBtnText = $('#hintBtnText');
  const toast = $('#toast');
  const collected = new Set();
  let toastTimer = null;
  let hintTimer = null;

  function readStoredStars() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL) : [];
    } catch (err) {
      return [];
    }
  }

  function persistStars() {
    try {
      if (collected.size) localStorage.setItem(STORAGE_KEY, JSON.stringify([...collected]));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* almacenamiento no disponible: seguimos sin persistir */
    }
  }

  function showToast(message, duration = 2400) {
    toast.innerHTML = '<svg aria-hidden="true"><use href="#icon-star"/></svg><span></span>';
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function bumpPill() {
    starPill.classList.remove('bump');
    void starPill.offsetWidth;
    starPill.classList.add('bump');
  }

  function updateHuntUI(animate = true) {
    const count = collected.size;
    starCount.textContent = String(count);
    starPill.setAttribute('aria-label', `Estrellas encontradas: ${count} de ${TOTAL}`);
    progressFill.style.width = `${(count / TOTAL) * 100}%`;
    progressText.textContent = `${count} / ${TOTAL}`;
    starProgress.setAttribute('aria-valuenow', String(count));
    hintBtnText.textContent = count === TOTAL ? 'Volver a empezar' : 'Iluminar las pistas';
    hintBtn.setAttribute(
      'aria-label',
      count === TOTAL ? 'Reiniciar la búsqueda de estrellas' : 'Iluminar las estrellas que faltan'
    );
    if (animate && count > 0) bumpPill();
  }

  function spawnConfetti() {
    if (prefersReduced) return;
    const colors = ['#FFC531', '#E5342B', '#2F5BEA', '#FF7AA2', '#FFFFFF', '#9CC0FF'];
    const container = document.createElement('div');
    container.className = 'confetti';
    container.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('span');
      piece.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
      piece.style.setProperty('--size', `${Math.random() * 8 + 5}px`);
      piece.style.setProperty('--r', `${Math.random() * 360}deg`);
      piece.style.setProperty('--dur', `${Math.random() * 1.2 + 1}s`);
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.animationDelay = `${Math.random() * 0.45}s`;
      container.appendChild(piece);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3400);
  }

  function completeHunt() {
    setTimeout(() => {
      spawnConfetti();
      showToast('¡Encontraste las 5 estrellas! El castillo está orgulloso.', 4200);
    }, 280);
  }

  function collectStar(star, silent = false) {
    const id = Number(star.dataset.star);
    if (collected.has(id)) return;
    collected.add(id);
    star.classList.add('found');
    star.disabled = true;
    updateHuntUI(!silent);
    persistStars();

    if (silent) return;

    const count = collected.size;
    showToast(`Estrella encontrada · ${count} de ${TOTAL}`);
    if (count === TOTAL) completeHunt();
  }

  function resetHunt() {
    collected.clear();
    stars.forEach((star) => {
      star.classList.remove('found');
      star.disabled = false;
    });
    updateHuntUI(false);
    persistStars();
    showToast('Búsqueda reiniciada. ¡Otra vuelta al castillo!');
  }

  stars.forEach((star) => {
    star.addEventListener('click', () => collectStar(star));
  });

  hintBtn.addEventListener('click', () => {
    if (collected.size === TOTAL) {
      resetHunt();
      return;
    }
    document.body.classList.add('hinting');
    showToast('Mira bien: brillan en 5 rincones.');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => document.body.classList.remove('hinting'), 4200);

    const nextStar = stars.find((s) => !s.classList.contains('found'));
    if (nextStar) {
      setTimeout(() => {
        nextStar.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      }, 320);
    }
  });

  starPill.addEventListener('click', () => {
    const target = document.getElementById('estrellas');
    if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
  });

  // Restaurar progreso guardado
  readStoredStars().forEach((id) => {
    const star = stars.find((s) => Number(s.dataset.star) === id);
    if (star) collectStar(star, true);
  });
  updateHuntUI(false);
})();
