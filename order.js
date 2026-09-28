/* order.js — "Eating out or ordering in?" on Today: meal picker, dish-by-dish advice
   for the user's dosha, restaurant note to copy, and Swiggy / Zomato search links.
   Uses globals from app.js (settings, esc, typeLetters, swiggyUrl, zomatoUrl, orderCity). */

const OUT_MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['snack', 'Evening'], ['dinner', 'Dinner']];
const VERDICT = { 1: 'Good choice', 0: 'Okay in moderation', '-1': 'Better to limit' };
// Short add-ons per dosha for a dish-specific restaurant note.
const NOTE_ADDON = { V: 'Serve it hot and fresh.', P: 'No extra chilli.', K: 'Less oil, please.' };

// Survives Today's re-renders (every minute, and on returning from the ordering app).
const eatOutState = { open: false, meal: null, q: '' };

const orderLetters = () => (typeLetters().length ? typeLetters() : ['V', 'P', 'K']);

function orderLinksHtml(q) {
  return `<span class="order-links">
    <a class="order-btn" href="${esc(swiggyUrl(q))}" target="_blank" rel="noopener" aria-label="Find ${esc(q)} on Swiggy">Swiggy</a>
    <a class="order-btn" data-zomato="${esc(q)}" href="${esc(zomatoUrl(q))}" target="_blank" rel="noopener" aria-label="Find ${esc(q)} on Zomato">Zomato</a>
  </span>`;
}

// Safe / avoid lists from EAT_OUT for one meal, merged across the user's doshas.
function outListHtml(mealKey) {
  const merge = (which) => {
    const seen = new Set(), out = [];
    orderLetters().forEach((k) => ((EAT_OUT[k] && EAT_OUT[k][mealKey]) ? EAT_OUT[k][mealKey][which] : []).forEach((x) => {
      if (!seen.has(x)) { seen.add(x); out.push(x); }
    }));
    return out;
  };
  const hideRe = settings.diet === 'veg' ? /chicken|egg|fish|prawn|mutton|meat|keema|crab|kebab|biryani/i
    : settings.diet === 'egg' ? /chicken|fish|prawn|mutton|meat|keema|crab|kebab|biryani/i : null;
  const keep = (x) => !hideRe || !hideRe.test(x);
  const safe = merge('safe').filter(keep), avoid = merge('avoid').filter(keep);
  const item = (x) => (ORDER_SEARCH[x]
    ? `<li class="order-item"><span>${esc(x)}</span>${orderLinksHtml(ORDER_SEARCH[x])}</li>`
    : `<li>${esc(x)}</li>`);
  return `<div><p class="card-title">Good to order</p><ul class="order-list">${safe.map(item).join('') || '<li class="muted">–</li>'}</ul></div>
    <div><p class="card-title">Skip this</p><ul>${avoid.map((x) => `<li>${esc(x)}</li>`).join('') || '<li class="muted">–</li>'}</ul></div>`;
}

// Find the best-matching dish: the longest alias found as whole words in the query,
// or (for partly typed words) an alias that starts with the query.
function findDish(query) {
  const q = ' ' + String(query).toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim() + ' ';
  if (q.trim().length < 2) return null;
  let best = null, score = 0;
  DISHES.forEach((d) => [d.n.toLowerCase(), ...d.a].forEach((al) => {
    let s = 0;
    if (q.includes(' ' + al + ' ')) s = al.length + 100;
    else if (q.trim().length >= 3 && al.startsWith(q.trim())) s = q.trim().length;
    if (s > score) { score = s; best = d; }
  }));
  return best;
}

// Ratings for a dish not in DISHES, from keyword hints. null if nothing matched.
function hintRatings(query) {
  const hits = DISH_HINTS.filter((h) => h.re.test(query));
  if (!hits.length) return null;
  const r = [0, 1, 2].map((i) => {
    const v = hits.map((h) => h.r[i]);
    return v.includes(-1) ? -1 : v.includes(1) ? 1 : 0;
  });
  return { r, why: hits.map((h) => h.why) };
}

function dishAdviceHtml(query, mealKey) {
  const raw = String(query).trim().slice(0, 60);
  if (!raw) return '';
  const L = orderLetters();
  const idx = { V: 0, P: 1, K: 2 };
  const dish = findDish(raw);
  const hint = dish ? null : hintRatings(raw);
  const r = dish ? dish.r : hint ? hint.r : null;
  const title = dish ? dish.n : raw;
  const searchQ = dish ? (dish.a.find((a) => (' ' + raw.toLowerCase() + ' ').includes(' ' + a + ' ')) || dish.n) : raw;
  const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const warn = [];
  if (dish && dish.t === 'nonveg' && settings.diet === 'veg') warn.push('This is a non-veg dish, and your setting is vegetarian.');
  if (dish && dish.t === 'nonveg' && settings.diet === 'egg') warn.push('This is a non-veg dish, and your setting is veg + egg.');
  if (mealKey === 'dinner' && ((dish && dish.t === 'nonveg') || /chicken|mutton|fish|prawn|meat|keema/i.test(raw))) warn.push('Traditionally, non-veg is kept for lunch rather than dinner.');
  if (mealKey === 'dinner' && ((dish && dish.curd) || /curd|raita|lassi|dahi|buttermilk|chaas/i.test(raw))) warn.push('Curd is traditionally avoided at night.');

  const verdicts = r ? L.map((k) => {
    const v = r[idx[k]];
    return `<li class="verdict v${v < 0 ? 'bad' : v > 0 ? 'good' : 'ok'}"><strong>${DOSHA_NAMES[k]}:</strong> ${VERDICT[v]}</li>`;
  }).join('') : '';
  const worst = r ? Math.min(...L.map((k) => r[idx[k]])) : 0;

  let note;
  if (dish) {
    const extra = L.map((k) => NOTE_ADDON[k]).filter((x) => {
      const a = dish.ask.toLowerCase();
      return !(x.includes('chilli') && a.includes('chilli')) && !(x.includes('oil') && a.includes('oil')) && !(x.includes('hot') && a.includes('hot'));
    });
    note = [dish.ask, ...new Set(extra)].join(' ');
  } else {
    note = ORDER_NOTES[settings.type] || ORDER_NOTES.VPK;
  }

  const swap = dish && dish.swap && worst < 0
    ? `<div class="swap"><p class="card-title">Better choice for you</p>
        <div class="order-item"><span>${esc(dish.swap)}</span>${orderLinksHtml(dish.swapQ)}</div></div>`
    : '';

  return `<div class="dish-advice stack" aria-live="polite">
    <div class="order-item"><p class="card-title dish-name">${esc(titleCase(title))}</p>${orderLinksHtml(searchQ)}</div>
    ${r ? `<ul class="verdicts">${verdicts}</ul>` : '<p class="small muted">This dish isn\'t in our list yet, so here is the general advice for your dosha.</p>'}
    ${hint ? `<ul class="small">${hint.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    ${warn.map((w) => `<p class="banner warn small">${esc(w)}</p>`).join('')}
    <div class="order-note">
      <p class="card-title">How to order it</p>
      <p class="small muted">Copy this and paste it in the "cooking instructions" box.</p>
      <p class="order-note-text" id="dishNote">${esc(note)}</p>
      <button class="btn primary" type="button" data-copy-note="dishNote">Copy note</button>
    </div>
    ${swap}
  </div>`;
}

function eatOutHtml(nowMeal) {
  const mealKey = eatOutState.meal || nowMeal;
  const L = typeLetters();
  const tips = [...new Set(orderLetters().flatMap((k) => (L.length ? ORDER_TIPS[k] : ORDER_TIPS[k].slice(0, 1))))];
  const city = orderCity();
  const dishNames = DISHES.filter((d) => settings.diet === 'nonveg' || d.t === 'veg' || (settings.diet === 'egg' && d.t === 'egg')).map((d) => d.n);
  return `<details class="details" data-eatout${eatOutState.open ? ' open' : ''}>
    <summary>Eating out or ordering in?</summary>
    <div class="stack">
      <form class="stack" data-dish-form>
        <label class="card-title" for="dishQ">What do you want to order?</label>
        <div class="form-row">
          <input class="search" id="dishQ" list="dishList" placeholder="e.g. biryani, dosa, pizza" maxlength="60" autocomplete="off" value="${esc(eatOutState.q)}">
          <button class="btn primary" type="submit">Check</button>
        </div>
        <datalist id="dishList">${dishNames.map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>
        <p class="small muted">We'll tell you if it suits your dosha, how to order it, and a better choice if needed.</p>
      </form>
      <div id="dishAdvice">${dishAdviceHtml(eatOutState.q, mealKey)}</div>
      <div class="chips" role="group" aria-label="Meal">${OUT_MEALS.map(([k, l]) => `<button type="button" class="chip${k === mealKey ? ' on' : ''}" data-out-meal="${k}" aria-pressed="${k === mealKey}">${l}</button>`).join('')}</div>
      <div id="outList" class="stack" data-meal="${mealKey}">${outListHtml(mealKey)}</div>
      <div class="order-note">
        <p class="card-title">General note for the restaurant</p>
        <p class="order-note-text" id="orderNote">${esc(ORDER_NOTES[settings.type] || ORDER_NOTES.VPK)}</p>
        <button class="btn" type="button" data-copy-note="orderNote">Copy note</button>
      </div>
      <div class="form-row field">
        <label for="citySel">Your city (for Zomato)</label>
        <select id="citySel">${ORDER_CITIES.map(([v, l]) => `<option value="${v}"${v === city ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
      </div>
      <div><p class="card-title">When you order online</p><ul>${tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <p class="small muted">Traditional guidance only. Choose what suits your body today. The Swiggy and Zomato buttons just open a search; Annamaya is not linked to either app.</p>
    </div>
  </details>`;
}
