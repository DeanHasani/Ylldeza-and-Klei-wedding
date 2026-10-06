/* Ylldëza & Klei — envelope, love-story path, save-the-date sequence, countdown, RSVP */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 14 November 2026, 16:00 in Kukës (CET, UTC+1) — fixed offset so guests abroad see the right countdown
  const WEDDING = new Date('2026-11-14T16:00:00+01:00');
  const WEDDING_DAY = 14;
  // The love story and calendar only start once the guest has actually scrolled
  const SCROLL_START = 40;

  /* ---------- 01 Envelope ---------- */
  const envelope = $('[data-envelope]');
  const loaded = img => img.decode
    ? img.decode().catch(() => {})
    : img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; });

  // Hold the sequence until the envelope art and handwriting font are in, so on a slow
  // mobile connection the flap never opens before the pieces have painted.
  const envReady = Promise.all([
    ...$$('.env-back, .env-flap, .env-lace', envelope).map(loaded),
    document.fonts ? document.fonts.load('34px "Great Vibes"').catch(() => {}) : null
  ]);
  Promise.race([envReady, wait(4000)]).then(() => {
    envelope.classList.add('is-ready');
    [[900, 's1'], [1450, 's2'], [2100, 's3'], [5300, 'opened']]
      .forEach(([t, cls]) => setTimeout(() => envelope.classList.add(cls), t));
  });

  const toggleEnvelope = () => envelope.classList.toggle('opened');
  envelope.addEventListener('click', toggleEnvelope);
  envelope.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEnvelope(); }
  });

  /* ---------- Scroll reveal ---------- */
  const revealIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    revealIO.unobserve(el);
    const delay = +el.dataset.delay || 0;
    if (el.hasAttribute('data-cal')) watchCal(el);
    el.style.transitionDelay = delay + 'ms';
    el.classList.add('is-in');
    // drop the stagger afterwards so hover/press transitions respond instantly
    setTimeout(() => { el.style.transitionDelay = ''; }, 2600 + delay);
  }), { threshold: 0.25 });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  /* ---------- 02 Our Love Story ---------- */
  const timeline = $('[data-timeline]');
  const tlSvg = $('svg', timeline);
  const paths = $$('[data-path]', timeline);
  const mover = $('[data-mover]', timeline);
  const items = $$('[data-item]', timeline);
  const years = $$('[data-year]', timeline);

  // Each line leaves the right side of one year and lands on the left side of the next.
  // Built from layout offsets (not bounding boxes) so the items' pre-reveal nudge doesn't skew it.
  const yearAnchor = (item, year) => {
    const range = document.createRange();
    range.selectNodeContents(year);
    const half = range.getBoundingClientRect().width / 2;
    const cx = item.offsetLeft; // items are centred on their left: N% via translate(-50%)
    return { left: cx - half, right: cx + half, y: item.offsetTop + year.offsetTop + year.offsetHeight / 2 };
  };
  let laidOutWidth = 0;
  function layoutPaths() {
    const w = timeline.clientWidth, h = timeline.clientHeight;
    if (!w || w === laidOutWidth) return;
    laidOutWidth = w;
    tlSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    paths.forEach((p, i) => {
      const a = yearAnchor(items[i], years[i]), b = yearAnchor(items[i + 1], years[i + 1]);
      const x0 = a.right + 4, x1 = b.left - 4, k = (x1 - x0) * .78;
      p.setAttribute('d', `M${x0} ${a.y} C ${x0 + k} ${a.y}, ${x1 - k} ${b.y}, ${x1} ${b.y}`);
    });
  }
  layoutPaths();
  if (document.fonts) document.fonts.ready.then(() => { laidOutWidth = 0; layoutPaths(); });
  let layoutFrame;
  window.addEventListener('resize', () => { cancelAnimationFrame(layoutFrame); layoutFrame = requestAnimationFrame(layoutPaths); });

  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const tween = (dur, fn) => new Promise(r => {
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      fn(t);
      t < 1 ? requestAnimationFrame(step) : r();
    };
    requestAnimationFrame(step);
  });

  // The heart rides along the path while the line draws in behind it
  const travel = async (path, dur) => {
    const L = path.getTotalLength();
    path.style.strokeDasharray = L;
    path.style.strokeDashoffset = L;
    const p0 = path.getPointAtLength(0);
    mover.setAttribute('transform', `translate(${p0.x},${p0.y})`);
    mover.style.opacity = '1';
    await tween(dur, t => {
      const e = ease(t);
      const p = path.getPointAtLength(L * e);
      mover.setAttribute('transform', `translate(${p.x},${p.y})`);
      path.style.strokeDashoffset = L * (1 - e);
    });
  };

  let storyRan = false;
  async function runStory() {
    if (storyRan) return;
    storyRan = true;
    laidOutWidth = 0; layoutPaths();
    const pause = [1000, 1100], draw = [1700, 1400];
    items[0].classList.add('is-in');
    for (let i = 0; i < paths.length; i++) {
      await wait(pause[i]);
      await travel(paths[i], draw[i]);
      paths[i].style.strokeDasharray = 'none'; // stays fully drawn if the layout changes later
      mover.style.opacity = '0';
      items[i + 1].classList.add('is-in');
    }
  }

  const storyIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { storyIO.disconnect(); runStory(); }
  }), { threshold: 0.35 });

  const onFirstScroll = () => {
    if (window.scrollY < SCROLL_START) return;
    window.removeEventListener('scroll', onFirstScroll);
    storyIO.observe(timeline);
  };
  window.addEventListener('scroll', onFirstScroll, { passive: true });
  onFirstScroll();

  /* ---------- 04 Save the Date ---------- */
  const calWrap = $('[data-cal]');
  const calLayer = $('[data-cal-layer]', calWrap);
  const calWeek = $('[data-cal-week]', calWrap);
  const calGrid = $('[data-cal-grid]', calWrap);
  const dateHeart = $('[data-date-heart]', calWrap);
  const dateText = $('[data-date-text]', calWrap);
  const smoke = $('[data-smoke]', calWrap);
  const units = $$('[data-unit]', calWrap);
  const colons = $$('[data-colon]', calWrap);

  // One heart shape for the whole sequence: drawn in the calendar, then carried into the date line
  const HEART = 'M50 86 C24 68 4 52 5 31 C6 14 22 5 36 9 C44 12 48 19 50 25 C52 19 56 12 64 9 C78 5 94 14 95 31 C96 52 76 68 50 86 Z';
  // The calendar 14 is scaled so it matches the date-line 14 at the moment the heart is handed over
  const DAY_SCALE = 1.46;

  // Month grid (Monday first)
  const year = WEDDING.getFullYear(), month = 10; // November
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  let calHeart, calHeartPath;
  const cell = () => { const c = document.createElement('div'); c.className = 'cal-cell'; return c; };
  for (let i = 0; i < leading; i++) calGrid.appendChild(cell());
  for (let d = 1; d <= daysInMonth; d++) {
    const c = cell();
    const span = document.createElement('span');
    span.className = 'cal-day';
    span.textContent = d;
    c.appendChild(span);
    if (d === WEDDING_DAY) {
      c.insertAdjacentHTML('beforeend', `<svg class="cal-heart" viewBox="0 0 100 92"><path d="${HEART}"/></svg>`);
      calHeart = c.lastElementChild;
      calHeartPath = calHeart.firstElementChild;
    }
    days.push(span);
    calGrid.appendChild(c);
  }

  // Dash = exact outline length, gap a little longer so no stray round cap shows before drawing starts
  const heartLen = calHeartPath.getTotalLength();
  const heartHidden = String(heartLen + 5);
  calHeartPath.style.strokeDasharray = `${heartLen} ${heartLen + 10}`;
  calHeartPath.style.strokeDashoffset = heartHidden;

  'Ruajeni Datën'.split('').forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch === ' ' ? ' ' : ch;
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', i);
    s.style.setProperty('--dx', (i % 2 ? 10 : -10) + 'px');
    smoke.appendChild(s);
  });

  // step: days counted so far · sd: sequence stage · heart: 14 circled & filled
  // flip/moved: the 14+heart travelling from the grid into the date line
  const cal = { step: 0, sd: 0, heart: false, flip: null, moved: false };

  function renderCal() {
    const { step, sd, heart, flip, moved } = cal;
    for (let d = 1; d <= WEDDING_DAY; d++) {
      const s = days[d - 1].style;
      const isDay = d === WEDDING_DAY;
      const shown = step >= d && (isDay ? sd < 3 : sd < 2);
      s.transition = isDay && sd >= 3 ? 'none'
        : !isDay && sd >= 2 ? 'opacity .8s ease, transform .8s ease'
        : 'opacity .4s ease, transform .6s cubic-bezier(.3,1.5,.5,1), color .9s ease 1.7s';
      s.opacity = shown ? '1' : '0';
      s.transform = shown ? (isDay ? `scale(${DAY_SCALE})` : 'none') : 'translateY(6px)';
      s.color = isDay && heart ? '#F3ECDD' : '';
    }
    calWeek.style.opacity = sd >= 2 ? '0' : '';
    calWeek.style.borderBottomColor = sd >= 2 ? 'rgba(205,191,165,0)' : '';
    calLayer.style.visibility = sd >= 4 ? 'hidden' : '';
    calHeart.style.opacity = sd >= 3 ? '0' : '';
    calHeartPath.style.strokeDashoffset = heart ? '0' : heartHidden;
    calHeartPath.style.fill = heart ? '#1d2922' : '';

    const h = dateHeart.style;
    if (sd < 3 || !flip) {
      h.opacity = ''; h.transform = ''; h.transition = '';
    } else {
      h.opacity = '1';
      h.transform = moved ? 'none' : `translate(${flip.dx}px,${flip.dy}px) scale(${flip.s})`;
      h.transition = moved ? 'transform 1.4s cubic-bezier(.65,0,.25,1)' : 'none';
    }
    dateText.classList.toggle('is-in', moved);
    smoke.classList.toggle('is-in', sd >= 4);
    units.forEach((u, i) => u.classList.toggle('is-in', sd >= 5 + i));
    colons.forEach((c, i) => c.classList.toggle('is-in', sd >= 6 + i)); // arrives with the unit after it
  }

  // FLIP: drop the big heart exactly over the calendar's 14, then let it glide home
  function flipHeart() {
    const r1 = calHeart.getBoundingClientRect();
    const r2 = dateHeart.getBoundingClientRect();
    cal.flip = {
      dx: r1.left + r1.width / 2 - (r2.left + r2.width / 2),
      dy: r1.top + r1.height / 2 - (r2.top + r2.height / 2),
      s: r1.width / r2.width
    };
    cal.sd = 3; cal.moved = false;
    renderCal();
    requestAnimationFrame(() => requestAnimationFrame(() => { cal.moved = true; renderCal(); }));
  }

  let calIO = null, calTimer = null, onCalScroll = null;

  function watchCal(el) {
    if (calIO) return;
    const go = () => {
      if (calTimer) return;
      calIO.disconnect();
      window.removeEventListener('scroll', onCalScroll);
      startCal();
    };
    calIO = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && window.scrollY > SCROLL_START) go();
    }), { threshold: 0.7 });
    calIO.observe(el);
    onCalScroll = () => {
      const r = el.getBoundingClientRect();
      if (window.scrollY > SCROLL_START && r.top < window.innerHeight * 0.6 && r.bottom > 0) go();
    };
    window.addEventListener('scroll', onCalScroll, { passive: true });
  }

  function startCal() {
    calTimer = setInterval(() => {
      cal.step += 1;
      renderCal();
      if (cal.step < WEDDING_DAY) return;
      clearInterval(calTimer);
      setTimeout(() => { cal.heart = true; renderCal(); }, 450);
      [[3300, 2], [4300, 'flip'], [6400, 4], [8000, 5], [8400, 6], [8800, 7], [9200, 8]]
        .forEach(([t, v]) => setTimeout(() => {
          if (v === 'flip') flipHeart();
          else { cal.sd = v; renderCal(); }
        }, t));
    }, 130);
  }

  /* ---------- Countdown ---------- */
  const cdEls = Object.fromEntries($$('[data-cd]').map(el => [el.dataset.cd, el]));
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    const s = Math.max(0, Math.floor((WEDDING - Date.now()) / 1000));
    const v = {
      days: pad(Math.floor(s / 86400)),
      hours: pad(Math.floor(s % 86400 / 3600)),
      minutes: pad(Math.floor(s % 3600 / 60)),
      seconds: pad(s % 60)
    };
    for (const k in v) if (cdEls[k].textContent !== v[k]) cdEls[k].textContent = v[k];
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 06 RSVP ---------- */
  const form = $('[data-rsvp-form]');
  const rsvpTitle = $('[data-rsvp-title]');
  const thanks = $('[data-thanks]');
  const sendBtn = $('.btn-send', form);
  const sendError = $('[data-send-error]', form);
  const nameInput = $('input[name="name"]', form);
  const guestInput = $('input[name="guest"]', form);
  const optButtons = $$('[data-attending]', form);
  const addGuestBtn = $('[data-add-guest]', form);
  const guestField = $('[data-guest-field]', form);
  const removeGuestBtn = $('[data-remove-guest]', form);
  let attending = 'yes', plusOne = false;

  function renderForm() {
    optButtons.forEach(b => {
      const on = b.dataset.attending === attending;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    addGuestBtn.hidden = !(attending === 'yes' && !plusOne);
    guestField.hidden = !(attending === 'yes' && plusOne);
  }

  // Albanian message instead of the browser's own "please fill out this field"
  nameInput.addEventListener('invalid', () => nameInput.setCustomValidity('Ju lutemi shkruani emrin tuaj.'));
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));

  optButtons.forEach(b => b.addEventListener('click', () => { attending = b.dataset.attending; renderForm(); }));
  addGuestBtn.addEventListener('click', () => { plusOne = true; renderForm(); });
  removeGuestBtn.addEventListener('click', () => { plusOne = false; guestInput.value = ''; renderForm(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) { nameInput.value = ''; nameInput.reportValidity(); return; } // spaces only
    const rsvp = { name, attending, guest: attending === 'yes' && plusOne ? guestInput.value.trim() : '' };
    if (document.activeElement) document.activeElement.blur(); // close the mobile keyboard

    if (RSVP_URL) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'DUKE DËRGUAR…';
      sendError.hidden = true;
      try {
        // no-cors: Apps Script doesn't send CORS headers, so the reply is opaque — only network failures reject
        await fetch(RSVP_URL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(rsvp) });
      } catch {
        sendBtn.disabled = false;
        sendBtn.textContent = 'DËRGO';
        sendError.hidden = false;
        return;
      }
    }

    rsvpTitle.textContent = attending === 'yes' ? 'Faleminderit!' : 'Do të na mungoni';
    thanks.textContent = attending === 'yes'
      ? `Faleminderit, ${name}! Mezi presim të festojmë së bashku më 14 nëntor.`
      : `Na vjen keq që nuk do të jeni me ne, ${name}. Faleminderit që na njoftuat.`;
    form.hidden = true;
    thanks.hidden = false;
  });

  renderCal();
  renderForm();
})();
