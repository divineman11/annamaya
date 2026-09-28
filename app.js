// Pitta Plate — all data stays on this device (localStorage).
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};

let settings = store.get('pd.settings', { diet: 'nonveg', gymTime: '17:00' });
let days = store.get('pd.days', {});
let weights = store.get('pd.weights', []);
let defaults = store.get('pd.defaults', {});
let bought = store.get('pd.bought', {});
const save = () => {
  store.set('pd.settings', settings); store.set('pd.days', days);
  store.set('pd.weights', weights); store.set('pd.defaults', defaults); store.set('pd.bought', bought);
};

const keyOf = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const todayKey = () => keyOf(new Date());
const addDays = (k, n) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return keyOf(d); };
const blankDay = () => ({ status: {}, pick: {}, gym: false, shift: 0, cheats: {} });
const getDay = (k) => days[k] || blankDay();
const editDay = (k) => (days[k] = days[k] || blankDay());
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = (min) => { const h = Math.floor(min / 60) % 24, m = min % 60; const ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`; };

const RANK = { veg: 0, egg: 1, nonveg: 2 };
function optionsFor(slot) {
  const max = slot.vegOnly ? 0 : RANK[settings.diet];
  return slot.options.filter((o) => RANK[o.type] <= max);
}
function slotsFor(k) {
  const d = getDay(k);
  return SLOTS.filter((s) => !s.gymOnly || d.gym)
    .map((s) => {
      const base = s.gymOnly ? toMin(settings.gymTime) + 60 : toMin(s.time);
      return { ...s, min: base + (d.shift || 0), baseMin: base };
    })
    .sort((a, b) => a.min - b.min);
}
function pickedOption(k, slot) {
  const opts = optionsFor(slot);
  const name = getDay(k).pick[slot.id] || defaults[slot.id];
  return opts.find((o) => o.name === name) || opts[0];
}

// Streak: consecutive days with every main meal eaten (on plan or cheat, not skipped).
function dayComplete(k) {
  const st = getDay(k).status;
  return SLOTS.filter((s) => s.main).every((s) => st[s.id] === 'done' || st[s.id] === 'cheat');
}
function streak() {
  let k = todayKey(), n = 0;
  if (!dayComplete(k)) k = addDays(k, -1);
  while (dayComplete(k) && n < 3650) { n++; k = addDays(k, -1); }
  return n;
}

// ---------- Today ----------
let viewKey = todayKey();
let cheatOpen = null;

function renderToday() {
  const d = getDay(viewKey);
  const isToday = viewKey === todayKey();
  const dt = new Date(viewKey + 'T12:00:00');
  $('#dateLabel').textContent = (isToday ? 'Today · ' : '') + dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  $('#goToday').hidden = isToday;
  $('#dietSel').value = settings.diet;
  $('#gymToggle').checked = !!d.gym;
  $('#shiftSel').value = String(d.shift || 0);

  const list = slotsFor(viewKey);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  let nextIdx = -1;
  if (isToday) nextIdx = list.findIndex((s) => !d.status[s.id] && s.min + 45 >= nowMin);

  $('#slots').innerHTML = list.map((s, i) => {
    const st = d.status[s.id];
    const opt = pickedOption(viewKey, s);
    const opts = optionsFor(s);
    const pill = st === 'done' ? '<span class="pill done">Eaten</span>'
      : st === 'skip' ? '<span class="pill skip">Skipped</span>'
      : st === 'cheat' ? '<span class="pill cheat">Ate out</span>'
      : i === nextIdx ? '<span class="pill now">Up next</span>' : '';
    const notes = [];
    if (s.note) notes.push(s.note);
    if (d.gym && s.gymNote) notes.push(s.gymNote);
    if (s.optional) notes.push('Optional.');
    if (st === 'cheat' && d.cheats[s.id]) notes.push('You had: ' + esc(d.cheats[s.id]));
    const cheatForm = cheatOpen === s.id ? `
      <form class="cheat-form" data-cheat="${s.id}">
        <input id="cheat-${s.id}" placeholder="What did you eat? e.g. fried rice" maxlength="80" required>
        <button class="btn primary" type="submit">Log</button>
      </form>` : '';
    return `<li class="slot${i === nextIdx ? ' now' : ''}${st ? ' done' : ''}">
      <div class="slot-time">${fmt(s.min)}${d.shift ? `<small>was ${fmt(s.baseMin)}</small>` : ''}</div>
      <div class="slot-body">
        <div class="slot-head"><span class="slot-label">${esc(s.label)}</span>${pill}</div>
        ${opts.length > 1
          ? `<select id="pick-${s.id}" data-pick="${s.id}" aria-label="${esc(s.label)} choice">${opts.map((o) => `<option${o.name === opt.name ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}</select>`
          : `<div>${esc(opt.name)}</div>`}
        ${notes.length ? `<p class="note">${notes.join(' ')}</p>` : ''}
        <div class="actions">
          <button class="btn${st === 'done' ? ' sel-done' : ''}" data-mark="done" data-slot="${s.id}">Eaten</button>
          <button class="btn${st === 'skip' ? ' sel-skip' : ''}" data-mark="skip" data-slot="${s.id}">Skipped</button>
          <button class="btn${st === 'cheat' ? ' sel-cheat' : ''}" data-mark="cheat" data-slot="${s.id}">Ate something else</button>
        </div>
        ${cheatForm}
      </div>
    </li>`;
  }).join('');

  renderBanner(list, d);
  const mains = SLOTS.filter((s) => s.main);
  const doneCount = list.filter((s) => d.status[s.id] === 'done').length;
  $('#daySummary').textContent = `${doneCount} of ${list.length} on plan · main meals ${mains.filter((s) => d.status[s.id]).length}/${mains.length} logged`;
  $('#streakNum').textContent = streak();
}

function renderBanner(list, d) {
  const b = $('#banner');
  const lastCheat = [...list].reverse().find((s) => d.status[s.id] === 'cheat');
  const skipped = list.filter((s) => s.main && d.status[s.id] === 'skip');
  if (lastCheat) {
    const next = list.slice(list.indexOf(lastCheat) + 1).find((s) => !d.status[s.id]);
    if (next) {
      const light = optionsFor(next).find((o) => o.light) || optionsFor(next)[0];
      b.innerHTML = `<strong>No stress about the ${esc(lastCheat.label.toLowerCase())}.</strong> Keep ${esc(next.label.toLowerCase())} at ${fmt(next.min)} light: ${esc(light.name)}. Have warm water, not a cold drink.`;
    } else {
      b.innerHTML = `<strong>Ate out today, that's fine.</strong> Warm milk before bed and back on plan tomorrow.`;
    }
    b.hidden = false;
  } else if (skipped.length) {
    b.innerHTML = `<strong>${esc(skipped[0].label)} skipped.</strong> Skipping meals raises pitta. Have a banana or a handful of nuts now if you can.`;
    b.hidden = false;
  } else {
    b.hidden = true;
  }
}

function mark(slotId, status) {
  const d = editDay(viewKey);
  if (status === 'cheat') {
    if (d.status[slotId] === 'cheat') { delete d.status[slotId]; delete d.cheats[slotId]; cheatOpen = null; }
    else { cheatOpen = slotId; renderToday(); $('#cheat-' + slotId)?.focus(); return; }
  } else {
    d.status[slotId] = d.status[slotId] === status ? undefined : status;
    if (!d.status[slotId]) delete d.status[slotId];
    delete d.cheats[slotId];
    cheatOpen = null;
  }
  save(); renderToday();
}

$('#slots').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-mark]');
  if (btn) mark(btn.dataset.slot, btn.dataset.mark);
});
$('#slots').addEventListener('change', (e) => {
  const sel = e.target.closest('[data-pick]');
  if (!sel) return;
  editDay(viewKey).pick[sel.dataset.pick] = sel.value;
  defaults[sel.dataset.pick] = sel.value;
  save(); renderToday();
});
$('#slots').addEventListener('submit', (e) => {
  const f = e.target.closest('[data-cheat]');
  if (!f) return;
  e.preventDefault();
  const id = f.dataset.cheat;
  const txt = $('#cheat-' + id).value.trim();
  if (!txt) return;
  const d = editDay(viewKey);
  d.status[id] = 'cheat'; d.cheats[id] = txt; cheatOpen = null;
  save(); renderToday();
});
$('#prevDay').onclick = () => { viewKey = addDays(viewKey, -1); cheatOpen = null; renderToday(); };
$('#nextDay').onclick = () => { viewKey = addDays(viewKey, 1); cheatOpen = null; renderToday(); };
$('#goToday').onclick = () => { viewKey = todayKey(); renderToday(); };
$('#dietSel').onchange = (e) => { settings.diet = e.target.value; save(); renderToday(); renderGrocery(); };
$('#gymToggle').onchange = (e) => { editDay(viewKey).gym = e.target.checked; save(); renderToday(); };
$('#shiftSel').onchange = (e) => { editDay(viewKey).shift = Number(e.target.value); save(); renderToday(); };

// ---------- Eat out ----------
let outKey = null;
function currentMealKey() {
  const m = new Date().getHours() * 60 + new Date().getMinutes();
  if (m < 10 * 60 + 30) return 'breakfast';
  if (m < 15 * 60 + 30) return 'lunch';
  if (m < 18 * 60 + 30) return 'snack';
  return 'dinner';
}
function renderOut() {
  outKey = outKey || currentMealKey();
  $('#outSeg').innerHTML = Object.entries(EAT_OUT).map(([k, v]) => `<button data-out="${k}" class="${k === outKey ? 'on' : ''}">${v.label}</button>`).join('');
  const g = EAT_OUT[outKey];
  let safe = g.safe;
  if (settings.diet === 'veg') safe = safe.filter((x) => !/chicken|egg/i.test(x));
  else if (settings.diet === 'egg') safe = safe.filter((x) => !/chicken/i.test(x));
  $('#outGrid').innerHTML = `
    <div class="out-card safe"><h3>Order this</h3><ul>${safe.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="out-card avoid"><h3>Skip this</h3><ul>${g.avoid.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}
$('#outSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-out]'); if (b) { outKey = b.dataset.out; renderOut(); } });

// ---------- Weight ----------
function renderWeight() {
  const w = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  $('#wList').innerHTML = [...w].reverse().map((x) => `<li><span>${new Date(x.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span><b>${x.kg.toFixed(1)} kg</b> <button data-del="${x.date}" aria-label="Delete ${x.date}">Delete</button></span></li>`).join('');
  if (!w.length) { $('#wStats').innerHTML = ''; $('#wChart').innerHTML = '<p class="muted" style="padding:8px">Log your first weigh-in to start the trend.</p>'; return; }
  const first = w[0], last = w[w.length - 1];
  const weeks = (Date.parse(last.date) - Date.parse(first.date)) / 6048e5;
  const change = last.kg - first.kg;
  const rate = weeks >= 1 ? change / weeks : null;
  const status = rate === null ? 'Need 1+ week of data' : rate < 0.25 ? 'Below target, eat a bit more' : rate > 0.5 ? 'Faster than target' : 'On track';
  $('#wStats').innerHTML = `
    <div class="stat"><span>Latest</span><b>${last.kg.toFixed(1)} kg</b></div>
    <div class="stat"><span>Change</span><b>${change >= 0 ? '+' : ''}${change.toFixed(1)} kg</b></div>
    <div class="stat"><span>Per week</span><b>${rate === null ? '–' : (rate >= 0 ? '+' : '') + rate.toFixed(2)}</b></div>
    <div class="stat"><span>Status</span><b style="font-size:1rem">${status}</b></div>`;
  $('#wChart').innerHTML = w.length < 2 ? '<p class="muted" style="padding:8px">Add one more weigh-in to see the trend line.</p>' : chartSvg(w);
}
function chartSvg(w) {
  const W = 340, H = 180, L = 40, R = 12, T = 14, B = 26;
  const t0 = Date.parse(w[0].date), t1 = Math.max(Date.parse(w[w.length - 1].date), t0 + 864e5);
  const weeks = (t1 - t0) / 6048e5;
  const bandHi = w[0].kg + 0.5 * weeks, bandLo = w[0].kg + 0.25 * weeks;
  const ks = w.map((x) => x.kg);
  const lo = Math.floor(Math.min(...ks, w[0].kg) - 0.5), hi = Math.ceil(Math.max(...ks, bandHi) + 0.5);
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const pts = w.map((p) => `${x(Date.parse(p.date)).toFixed(1)},${y(p.kg).toFixed(1)}`);
  const band = `${x(t0)},${y(w[0].kg)} ${x(t1)},${y(bandHi)} ${x(t1)},${y(bandLo)}`;
  const ticks = [lo, (lo + hi) / 2, hi];
  const end = w[w.length - 1];
  const fmtD = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${v.toFixed(1)}</text>`).join('')}
    <polygon points="${band}" fill="var(--jade-soft)" stroke="none"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="var(--jade)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(Date.parse(end.date))}" cy="${y(end.kg)}" r="4.5" fill="var(--ghee)"/>
    <text x="${L}" y="${H - 8}" font-size="10" fill="var(--muted)">${fmtD(t0)}</text>
    <text x="${W - R}" y="${H - 8}" font-size="10" fill="var(--muted)" text-anchor="end">${fmtD(t1)}</text>
  </svg>
  <p class="note" style="padding:4px 6px 0">Shaded area is the healthy gain range (0.25 to 0.5 kg a week).</p>`;
}
$('#wForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = $('#wDate').value, kg = parseFloat($('#wKg').value);
  const err = $('#wErr');
  if (!date || !(kg >= 30 && kg <= 150)) { err.textContent = 'Enter a date and a weight between 30 and 150 kg.'; err.hidden = false; return; }
  err.hidden = true;
  weights = weights.filter((x) => x.date !== date).concat({ date, kg: Math.round(kg * 10) / 10 });
  $('#wKg').value = '';
  save(); renderWeight();
});
$('#wKg').addEventListener('input', () => { $('#wErr').hidden = true; });
$('#wList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-del]');
  if (!b) return;
  weights = weights.filter((x) => x.date !== b.dataset.del);
  save(); renderWeight();
});

// ---------- Grocery ----------
function renderGrocery() {
  const need = new Set(['Ghee', 'Almonds', 'Milk', 'Banana']);
  const k = todayKey();
  SLOTS.forEach((s) => { const o = pickedOption(k, s); if (o) o.ing.forEach((i) => need.add(i)); });
  const rows = Object.entries(CATEGORY).map(([cat, items]) => {
    const inCat = items.filter((i) => need.has(i));
    if (!inCat.length) return '';
    return `<div class="gcat"><h3>${cat}</h3>${inCat.map((i) => `
      <label class="gitem${bought[i] ? ' got' : ''}"><input type="checkbox" id="g-${i.replace(/\W/g, '')}" data-g="${esc(i)}"${bought[i] ? ' checked' : ''}><span>${esc(i)}</span></label>`).join('')}</div>`;
  }).join('');
  $('#groceryList').innerHTML = rows;
}
$('#groceryList').addEventListener('change', (e) => {
  const c = e.target.closest('[data-g]');
  if (!c) return;
  if (c.checked) bought[c.dataset.g] = true; else delete bought[c.dataset.g];
  save(); renderGrocery();
});
$('#resetGrocery').onclick = () => { bought = {}; save(); renderGrocery(); };

// ---------- Rules ----------
$('#rulesList').innerHTML = RULES.map((r) => `<li>${esc(r)}</li>`).join('');

// ---------- Tabs ----------
const renders = { today: renderToday, out: renderOut, weight: renderWeight, grocery: renderGrocery, rules: () => {} };
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== 'tab-' + b.dataset.tab; });
  renders[b.dataset.tab]();
  window.scrollTo(0, 0);
});

$('#wDate').value = todayKey();
renderToday();
// Refresh "up next" every minute, but never while a cheat-meal note is being typed.
setInterval(() => { if (!document.hidden && !cheatOpen && viewKey === todayKey()) renderToday(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !cheatOpen) renderToday(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
