/* order.js — "Eating out or ordering in?" on Today: meal picker, dish-by-dish advice
   for the user's dosha, restaurant note to copy, and Swiggy / Zomato search links.
   Uses globals from app.js (settings, esc, typeLetters, swiggyUrl, zomatoUrl, orderCity). */

const OUT_MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['snack', 'Evening'], ['dinner', 'Dinner']];
const VERDICT = { 1: 'Good choice', 0: 'Okay in moderation', '-1': 'Better to limit', '-2': 'Avoid' };
// Short add-ons per dosha for a dish-specific restaurant note.
const NOTE_ADDON = { V: 'Serve it hot and fresh.', P: 'No extra chilli.', K: 'Less oil, please.' };

// Survives Today's re-renders (every minute, and on returning from the ordering app).
const eatOutState = { meal: null, q: '', loading: null };

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

// All dishes named in the query, ignoring aliases that sit inside a longer match
// ("veg biryani" is not also "biryani"). Longest match first.
function findDishes(query) {
  const q = ' ' + String(query).toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim() + ' ';
  const hits = [];
  DISHES.forEach((d) => [d.n.toLowerCase(), ...d.a].forEach((al) => {
    const at = q.indexOf(' ' + al + ' ');
    if (at >= 0) hits.push({ d, start: at, end: at + al.length + 1 });
  }));
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start));
  const kept = [];
  hits.forEach((h) => {
    if (kept.some((k) => h.start >= k.start && h.end <= k.end)) return;
    if (!kept.some((k) => k.d === h.d)) kept.push(h);
  });
  return kept.map((h) => h.d);
}

// Ratings for a dish not in DISHES, from keyword hints. null if nothing matched.
function hintRatings(query) {
  const hits = DISH_HINTS.filter((h) => h.re.test(query));
  if (!hits.length) return null;
  const r = [0, 1, 2].map((i) => {
    const v = hits.map((h) => h.r[i]);
    const low = Math.min(...v);
    if (low > -2 && v.filter((x) => x === -1).length >= 2) return -2; // two strong problems for this dosha
    return low < 0 ? low : v.includes(1) ? 1 : 0;
  });
  return { r, why: hits.map((h) => h.why), notes: hits.map((h) => h.note).filter(Boolean) };
}

function dishAdviceHtml(query, mealKey) {
  const raw = String(query).trim().slice(0, 60);
  if (!raw) return '';
  const L = orderLetters();
  const idx = { V: 0, P: 1, K: 2 };
  const dish = findDish(raw);
  // Other dishes/ingredients named alongside the main one (e.g. "chicken 65 and beer" = chicken 65 + alcohol).
  const extras = dish ? findDishes(raw).filter((d) => d !== dish) : [];
  const allDishes = dish ? [dish, ...extras] : [];
  // Ingredients from the food library named in the typed text (e.g. "horse gram", "ulavalu charu").
  const typedFoods = analyseDescription(raw);
  // For an unlisted dish, the typed words (keywords + ingredients) are the first guess.
  const hint = dish ? null : (typedFoods ? { r: typedFoods.r, why: typedFoods.reasons, notes: typedFoods.noteBits } : null);
  // Online lookup result (only exists after the user tapped "Look it up online").
  const lk = dish ? null : lookupCache.get(raw.toLowerCase());
  const online = lk && lk.status === 'ok' ? lk.analysis : null;
  const r = dish ? [0, 1, 2].map((i) => Math.min(...allDishes.map((d) => d.r[i]))) : online ? [...online.r] : hint ? [...hint.r] : null;
  // A known dish that names an ingredient to avoid for a dosha (e.g. "horse gram soup") is Avoid for that dosha.
  if (dish && r && typedFoods) [0, 1, 2].forEach((i) => { if (typedFoods.foods.some((f) => f['VPK'[i]] <= -2)) r[i] = -2; });
  // Foods that don't go together override everything: Avoid for every dosha.
  const combo = findCombo(raw + ' ' + (online && lk.page ? lk.page.extract : ''));
  if (combo && r) r.splice(0, 3, -2, -2, -2);
  const rr = combo && !r ? [-2, -2, -2] : r;
  const title = dish ? dish.n : raw;
  const searchQ = dish ? (dish.a.find((a) => (' ' + raw.toLowerCase() + ' ').includes(' ' + a + ' ')) || dish.n) : raw;
  const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const isNonveg = allDishes.some((d) => d.t === 'nonveg') || (online && online.nonveg) || /chicken|mutton|fish|prawn|meat|keema/i.test(raw);
  const isEgg = (allDishes.some((d) => d.t === 'egg') && !allDishes.some((d) => d.t === 'nonveg')) || (online && online.egg && !online.nonveg);
  const isCurd = allDishes.some((d) => d.curd) || (online && online.curd) || /curd|raita|lassi|dahi|buttermilk|chaas/i.test(raw);
  const warn = [];
  if (isNonveg && settings.diet === 'veg') warn.push('This looks like a non-veg dish, and your setting is vegetarian.');
  else if (isNonveg && settings.diet === 'egg') warn.push('This looks like a non-veg dish, and your setting is veg + egg.');
  else if (isEgg && settings.diet === 'veg') warn.push('This dish may contain egg, and your setting is vegetarian.');
  if (mealKey === 'dinner' && isNonveg) warn.push('Traditionally, non-veg is kept for lunch rather than dinner.');
  if (mealKey === 'dinner' && isCurd) warn.push('Curd is traditionally avoided at night.');

  const verdicts = rr ? L.map((k) => {
    const v = rr[idx[k]];
    return `<li class="verdict v${v <= -2 ? 'avoid' : v < 0 ? 'bad' : v > 0 ? 'good' : 'ok'}"><strong>${DOSHA_NAMES[k]}:</strong> ${VERDICT[v]}</li>`;
  }).join('') : '';
  const worst = rr ? Math.min(...L.map((k) => rr[idx[k]])) : 0;

  // Restaurant note: dish-specific requests first, then short per-dosha add-ons (no repeats).
  const asks = dish ? [...new Set(allDishes.map((d) => d.ask))] : online ? online.noteBits : hint ? hint.notes : [];
  let note;
  if (asks.length) {
    const a = asks.join(' ').toLowerCase();
    const extra = L.map((k) => NOTE_ADDON[k]).filter((x) =>
      !(x.includes('chilli') && a.includes('chilli')) && !(x.includes('oil') && a.includes('oil')) && !(x.includes('hot') && a.includes('hot')));
    note = [...new Set([...asks, ...extra])].join(' ');
  } else {
    note = ORDER_NOTES[settings.type] || ORDER_NOTES.VPK;
  }

  const swapDish = allDishes.filter((d) => d.swap).sort((a, b) => Math.min(...a.r) - Math.min(...b.r))[0];
  const swap = swapDish && worst < 0
    ? `<div class="swap"><p class="card-title">Better choice for you</p>
        <div class="order-item"><span>${esc(swapDish.swap)}</span>${orderLinksHtml(swapDish.swapQ)}</div></div>`
    : '';

  // What we know about an unlisted dish, and the online lookup button / result.
  let about = '';
  if (!dish) {
    const reasons = online ? online.reasons : hint ? hint.why : [];
    if (online) {
      const excerpt = lk.page.extract.split(/(?<=\.)\s+/).slice(0, 2).join(' ').slice(0, 320);
      about = `<div class="lookup-result">
        <p class="small"><strong>From Wikipedia:</strong> ${esc(excerpt)}</p>
        ${online.found.length ? `<p class="small"><strong>Ingredients we recognised:</strong> ${esc(online.found.join(', '))}</p>` : ''}
        <p class="small muted">Source: <a href="${esc(lk.page.url)}" target="_blank" rel="noopener">${esc(lk.page.title)} on Wikipedia</a>. This is an automatic best guess from a general description, so check the real ingredients with the restaurant.</p>
      </div>`;
    } else if (eatOutState.loading === raw.toLowerCase()) {
      about = '<p class="small muted" role="status">Looking it up online…</p>';
    } else {
      const msg = !lk ? (r ? 'This dish isn\'t in our list yet. The advice below is based on its name only.' : 'This dish isn\'t in our list yet, so here is the general advice for your dosha.')
        : lk.status === 'notfound' ? 'We couldn\'t find this dish online. Try another spelling or a more common name.'
        : lk.status === 'unclear' ? 'We found a description online but couldn\'t tell much about the ingredients.'
        : 'Couldn\'t look it up. Check your internet connection and try again.';
      about = `<p class="small muted">${msg}</p>
        ${!lk || lk.status === 'error' ? `<button class="btn ghost" type="button" data-dish-lookup>Look it up online</button>
        <p class="small muted">Sends only the dish name to Wikipedia. Nothing else leaves your phone.</p>` : ''}`;
    }
    if (reasons.length) about += `<ul class="small">${reasons.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`;
  }

  return `<div class="dish-advice stack" aria-live="polite">
    <div class="order-item"><p class="card-title dish-name">${esc(titleCase(title))}</p>${orderLinksHtml(searchQ)}</div>
    ${rr ? `<ul class="verdicts">${verdicts}</ul>` : ''}
    ${combo ? `<p class="banner warn small"><strong>Foods that don't go together:</strong> ${esc(combo.pair)}. ${esc(combo.concern)} <span class="muted">(${esc(combo.source)})</span></p>` : ''}
    ${allDishes.some((d) => d.why) ? `<ul class="small">${[...new Set(allDishes.filter((d) => d.why).map((d) => d.why))].map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    ${typedFoods && typedFoods.foods.some((f) => L.some((k) => f[k] < 0)) ? `<ul class="small">${typedFoods.foods.filter((f) => L.some((k) => f[k] < 0)).map((f) => `<li><strong>${esc(f.name.replace(/\(.*?\)/g, '').trim())}:</strong> ${esc(f.why)}</li>`).join('')}</ul>` : ''}
    ${about}
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

function renderEatOut(el) {
  el.innerHTML = `<div class="stack"><div class="card stack">${eatOutHtml(currentMealKey())}</div></div>`;
}

function eatOutHtml(nowMeal) {
  const mealKey = eatOutState.meal || nowMeal;
  const L = typeLetters();
  const tips = [...new Set(orderLetters().flatMap((k) => (L.length ? ORDER_TIPS[k] : ORDER_TIPS[k].slice(0, 1))))];
  const city = orderCity();
  const dishNames = DISHES.filter((d) => settings.diet === 'nonveg' || d.t === 'veg' || (settings.diet === 'egg' && d.t === 'egg')).map((d) => d.n);
  return `<div class="stack" data-eatout>
    <h2 class="card-title">Eating out or ordering in?</h2>
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
  </div>`;
}
