/* recipes.js — recipe viewer: dosha-adjusted spices and a tick-off cooking checklist.
   Uses globals from app.js / views.js (settings, store, esc, openOverlay, closeOverlay,
   typeLetters, startQuiz, render, toast). Ticks are saved in localStorage 'pd.cook'. */

const DOSHA_NAMES = { V: 'Vata', P: 'Pitta', K: 'Kapha' };

// { recipeId: { i0: true, s2: true } } — i = ingredient index, s = step index.
// Loaded on first use: app.js (which defines `store`) loads after this file.
let cook = null;
function loadCook() {
  if (cook) return cook;
  const raw = store.get('pd.cook', {});
  const out = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.keys(raw).forEach((id) => {
      const t = raw[id];
      if (!t || typeof t !== 'object' || Array.isArray(t)) return;
      const clean = {};
      Object.keys(t).forEach((k) => { if (/^[is]\d+$/.test(k) && t[k] === true) clean[k] = true; });
      out[id] = clean;
    });
  }
  cook = out;
  return cook;
}
const saveCook = () => store.set('pd.cook', cook);

// Recipes for a meal option name, filtered by the user's diet.
function recipesFor(name) {
  return RECIPES.filter((r) => r.match.test(name) && recipeAllowed(r));
}
function recipeAllowed(r) {
  if (settings.diet === 'veg') return r.type === 'veg';
  if (settings.diet === 'egg') return r.type !== 'nonveg';
  return true;
}

function recipeHtml(r, list) {
  const L = typeLetters();
  const ticks = loadCook()[r.id] || {};
  const letters = L.length ? L : ['V', 'P', 'K'];
  const adjust = letters.map((k) => `<li><strong>${DOSHA_NAMES[k]}:</strong> ${esc(r.adjust[k])}</li>`).join('');
  const check = (key, text) => `<li><label class="cook-check"><input type="checkbox" data-cook="${key}"${ticks[key] ? ' checked' : ''}><span>${esc(text)}</span></label></li>`;
  const done = Object.keys(ticks).length, total = r.ing.length + r.steps.length;
  const tabs = list.length > 1
    ? `<div class="chips" role="group" aria-label="Recipes in this meal">${list.map((x) => `<button class="chip${x.id === r.id ? ' on' : ''}" data-recipe-go="${x.id}" aria-pressed="${x.id === r.id}">${esc(x.name)}</button>`).join('')}</div>`
    : '';
  return `<div class="card stack" data-recipe-panel="${r.id}">
    ${tabs}
    <h2 class="card-title recipe-title">${esc(r.name)}</h2>
    <p class="small muted">Serves 2 · ${esc(r.time)}</p>
    <div class="recipe-adjust">
      <p class="card-title">${L.length ? 'Spices for your dosha (' + letters.map((k) => DOSHA_NAMES[k]).join('–') + ')' : 'Spices by dosha'}</p>
      <ul>${adjust}</ul>
      ${L.length ? '' : '<button class="btn ghost" type="button" data-recipe-quiz>Find your dosha (quiz)</button>'}
    </div>
    <div><p class="card-title">Ingredients</p><ul class="cook-list">${r.ing.map((x, i) => check('i' + i, x)).join('')}</ul></div>
    <div><p class="card-title">Steps</p><ol class="cook-list">${r.steps.map((x, i) => check('s' + i, (i + 1) + '. ' + x)).join('')}</ol></div>
    <p class="small muted" data-cook-count>${done} of ${total} ticked</p>
    <div class="btn-row">
      <button class="btn" type="button" data-cook-clear>Clear ticks</button>
      <button class="btn primary" type="button" data-recipe-close>Close</button>
    </div>
    <p class="small muted">Spice changes follow traditional Ayurvedic guidance. Not medical advice.</p>
  </div>`;
}

function openRecipes(list, id) {
  if (!list.length) return;
  const r = list.find((x) => x.id === id) || list[0];
  openOverlay(recipeHtml(r, list));
  const ov = $('#overlay'), panel = ov.querySelector('.overlay-panel');
  panel.scrollTop = 0;
  panel.onclick = (e) => {
    const go = e.target.closest('[data-recipe-go]');
    if (go) { openRecipes(list, go.dataset.recipeGo); return; }
    if (e.target.closest('[data-recipe-close]')) { closeOverlay(); return; }
    if (e.target.closest('[data-cook-clear]')) { delete cook[r.id]; saveCook(); openRecipes(list, r.id); toast('Ticks cleared.'); return; }
    if (e.target.closest('[data-recipe-quiz]')) { closeOverlay(); startQuiz(() => render('today')); }
  };
  ov.onchange = (e) => {
    const c = e.target.closest('[data-cook]');
    if (!c) return;
    const t = cook[r.id] || (cook[r.id] = {});
    if (c.checked) t[c.dataset.cook] = true; else delete t[c.dataset.cook];
    if (!Object.keys(t).length) delete cook[r.id];
    saveCook();
    const n = panel.querySelector('[data-cook-count]');
    if (n) n.textContent = `${Object.keys(cook[r.id] || {}).length} of ${r.ing.length + r.steps.length} ticked`;
  };
}

// ---------- Recipes tab ----------
// Which meal groups each recipe appears in, from the meal plan (SLOTS).
const RECIPE_GROUPS = [['all', 'All'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snacks & drinks']];
function recipeGroups(r) {
  const g = new Set();
  SLOTS.forEach((s) => {
    if (!s.options.some((o) => r.match.test(o.name))) return;
    g.add(['breakfast', 'lunch', 'dinner'].includes(s.id) ? s.id : 'snack');
  });
  return g;
}
const recipeView = { q: '', group: 'all' };

function renderRecipes(el) {
  const L = typeLetters();
  el.innerHTML = `
<div class="stack">
  <div class="card stack">
    <h2 class="card-title">Recipes by dosha</h2>
    <p class="small muted">Home recipes with spices adjusted for ${L.length ? 'your dosha (' + L.map((k) => DOSHA_NAMES[k]).join('–') + ')' : 'each dosha'}. Tick off ingredients and steps as you cook.</p>
    ${L.length ? '' : '<button class="btn ghost" type="button" data-recipes-quiz>Find your dosha (quiz)</button>'}
    <input class="search" type="search" placeholder="Search recipes — try 'dal' or 'chicken'" aria-label="Search recipes" value="${esc(recipeView.q)}" data-recipes-q autocomplete="off">
    <div class="chips" role="group" aria-label="Meal">${RECIPE_GROUPS.map(([k, l]) => `<button type="button" class="chip${k === recipeView.group ? ' on' : ''}" data-recipes-group="${k}" aria-pressed="${k === recipeView.group}">${l}</button>`).join('')}</div>
    <p class="small muted" data-recipes-count></p>
    <div class="recipe-list" data-recipes-list></div>
  </div>
</div>`;

  const draw = () => {
    const q = recipeView.q.toLowerCase();
    const list = RECIPES.filter(recipeAllowed).filter((r) =>
      (recipeView.group === 'all' || recipeGroups(r).has(recipeView.group)) &&
      (!q || r.name.toLowerCase().includes(q) || r.ing.some((i) => i.toLowerCase().includes(q))));
    el.querySelector('[data-recipes-count]').textContent = `${list.length} recipe${list.length === 1 ? '' : 's'}`;
    el.querySelector('[data-recipes-list]').innerHTML = list.map((r) => {
      const tip = L.length === 1 ? r.adjust[L[0]] : '';
      const done = Object.keys(loadCook()[r.id] || {}).length;
      return `<button type="button" class="recipe-row" data-open-recipe="${r.id}">
        <span class="recipe-row-name">${esc(r.name)}</span>
        <span class="small muted">${esc(r.time)}${done ? ` · ${done} ticked` : ''}</span>
        ${tip ? `<span class="small">${esc(tip)}</span>` : ''}
      </button>`;
    }).join('') || '<p class="muted">No recipes match. Try another word.</p>';
  };
  draw();

  el.querySelector('[data-recipes-q]').addEventListener('input', (e) => { recipeView.q = e.target.value; draw(); });
  // Listen on the tab's own root (recreated each render) so listeners never stack on #view.
  el.firstElementChild.addEventListener('click', (e) => {
    const g = e.target.closest('[data-recipes-group]');
    if (g) {
      recipeView.group = g.dataset.recipesGroup;
      el.querySelectorAll('[data-recipes-group]').forEach((b) => { const on = b === g; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      draw(); return;
    }
    const o = e.target.closest('[data-open-recipe]');
    if (o) { openRecipes([RECIPES.find((r) => r.id === o.dataset.openRecipe)]); return; }
    if (e.target.closest('[data-recipes-quiz]')) startQuiz(() => render('recipes'));
  });
}
