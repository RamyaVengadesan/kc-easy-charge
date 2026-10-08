/* =========================================================
   KC Easy Chargz — Landing page behaviour
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Config ------------------------------------------------ */
  const WHATSAPP_NUMBER = ''; // country code + number, no "+" or spaces

  /* ---- Header, progress bar, back-to-top --------------------- */
  const header   = $('#header');
  const progress = $('#progress');
  const toTop    = $('#toTop');

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 10);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    toTop.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---- Mobile menu ------------------------------------------- */
  const burger = $('#burger');
  const nav    = $('#nav');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  // tap outside the menu (on the dimmed page) closes it
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) closeMenu();
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

  /* ---- Active nav link on scroll ----------------------------- */
  const links = $$('.nav__link:not([data-nospy])');
  const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---- Reveal on scroll -------------------------------------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ---- Count-up numbers -------------------------------------- */
  const animateCount = el => {
    const to = +el.dataset.to;
    const dur = 1600;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { animateCount(en.target); obs.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(el => countObs.observe(el));

  /* ---- Pre-select plan in the form from plan buttons ---------- */
  const planSelect = $('#plan');
  $$('[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      planSelect.value = btn.dataset.plan;
      planSelect.closest('.field').classList.remove('has-error');
    });
  });

  /* ---- Toast ------------------------------------------------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 3200);
  };

  /* ---- WhatsApp contact form --------------------------------- */
  const form = $('#waForm');

  const validators = {
    name:  v => v.trim().length >= 2,
    phone: v => /^(\+?91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')),
    email: v => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    city:  v => v.trim().length >= 2,
    plan:  v => v !== ''
  };

  const check = input => {
    const rule = validators[input.name];
    if (!rule) return true;
    const ok = rule(input.value);
    input.closest('.field').classList.toggle('has-error', !ok);
    return ok;
  };

  $$('input, select', form).forEach(input => {
    input.addEventListener('blur', () => check(input));
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) check(input);
    });
    input.addEventListener('change', () => check(input));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const fields = $$('input, select', form);
    const results = fields.map(check);
    if (results.includes(false)) {
      const firstBad = $('.has-error input, .has-error select', form);
      if (firstBad) firstBad.focus();
      showToast('Please fix the highlighted fields');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const lines = [
      '*New Easy Chargz Enquiry*',
      '',
      `*Name:* ${data.name.trim()}`,
      `*Phone:* ${data.phone.trim()}`,
      data.email.trim()   ? `*Email:* ${data.email.trim()}` : '',
      `*Location:* ${data.city.trim()}`,
      `*Plan:* ${data.plan}`,
      data.land.trim()    ? `*Land available:* ${data.land.trim()} sq.ft` : '',
      data.message.trim() ? `*Message:* ${data.message.trim()}` : ''
    ].filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''));

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;

    showToast('Thank you! Your enquiry has been submitted.');
    // Open in a new tab; fall back to same tab if popups are blocked
    const win = window.open(url, '_blank', 'noopener');
    if (!win) window.location.href = url;
    form.reset();
  });

  /* ---- Parallax photos (desktop mouse devices only) ----------- */
  const par = $$('[data-parallax]');
  if (par.length) {
    const canParallax = () =>
      matchMedia('(min-width: 901px) and (hover: hover)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticking = false;
    const update = () => {
      ticking = false;
      const on = canParallax();
      par.forEach(p => {
        if (!on) { p.style.transform = ''; return; }
        const r = p.parentElement.getBoundingClientRect();
        p.style.transform = `translateY(${(r.top * -0.12).toFixed(1)}px) scale(1.15)`;
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---- Services carousel dots (phones) ------------------------- */
  const track = $('.solutions');
  if (track) {
    const cards = $$('.sol', track);
    const dots = document.createElement('div');
    dots.className = 'dots';
    dots.setAttribute('aria-hidden', 'true');
    cards.forEach(() => dots.appendChild(document.createElement('i')));
    track.after(dots);
    const dotEls = $$('i', dots);
    const setDot = () => {
      const left = track.getBoundingClientRect().left;
      let best = 0, min = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - left);
        if (d < min) { min = d; best = i; }
      });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = cards.length - 1;
      dotEls.forEach((d, i) => d.classList.toggle('is-on', i === best));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(setDot), { passive: true });
    window.addEventListener('resize', setDot);
    setDot();
  }

/* ---- Footer year ------------------------------------------- */
  $('#year').textContent = new Date().getFullYear();
})();

/* =========================================================
   MOTION ADD-ON — effects only (no content changes)
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Index vars used by the CSS stagger rules */
  $$('.plan__list').forEach(ul => $$('li', ul).forEach((li, i) => li.style.setProperty('--i', i)));
  $$('.form > *').forEach((el, i) => el.style.setProperty('--k', i));

  /* Mark reveal cards as "settled" once their entrance has finished */
  document.addEventListener('transitionend', e => {
    const t = e.target;
    if (e.propertyName === 'opacity' && t.classList && t.classList.contains('reveal') && t.classList.contains('is-visible')) {
      t.classList.add('is-settled');
    }
  });

  /* Stagger-in for blocks that have no .reveal class */
  const fxGroups = ['.contact__list > li', '.footer__grid > *', '.footer__bottom'];
  const fxObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
  fxGroups.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('fx');
      el.style.setProperty('--fx-d', (i % 6) * 90 + 'ms');
      fxObs.observe(el);
    });
  });

  if (reduce) return;

  /* Button ripple (click / tap) */
  $$('.ripple').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const dot = document.createElement('span');
      dot.className = 'ripple-dot';
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  });

  /* Soft floating blobs behind the hero */
  const hero = $('#home');
  if (hero) {
    hero.insertAdjacentHTML('afterbegin',
      '<span class="blob blob--1" aria-hidden="true"></span><span class="blob blob--2" aria-hidden="true"></span>');
  }

  if (!fine) return; // hover-based effects below are for mouse devices only

  /* Hero card follows the mouse in 3D */
  const card = $('.charger-card');
  if (hero && card) {
    let raf;
    hero.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--hx', (x * 8).toFixed(2) + 'deg');
        card.style.setProperty('--hy', (-y * 6).toFixed(2) + 'deg');
      });
    });
    hero.addEventListener('pointerleave', () => {
      card.style.setProperty('--hx', '0deg');
      card.style.setProperty('--hy', '0deg');
    });
  }

  /* Plan cards: tilt + cursor glow. Why-us cards: cursor glow */
  $$('.tilt, .why__item').forEach(el => {
    const tilt = el.classList.contains('tilt');
    let raf;
    el.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        if (tilt) {
          el.style.setProperty('--ry', ((x - .5) * 8).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        }
      });
    });
    el.addEventListener('pointerleave', () => {
      if (tilt) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
    });
  });

  /* Magnetic buttons */
  $$('.hero__actions .btn, .nav__cta').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .25).toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
})();