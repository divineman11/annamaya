/* lookup.js — "Look it up online" for dishes not in DISHES.
   Only runs when the user taps the button, and sends only the dish name to Wikipedia
   (free, no key, CORS-enabled). The description is scanned for ingredients from the
   FOODS library and cooking words from DISH_HINTS to make a traditional, best-guess
   recommendation. Uses globals: FOODS, DISH_HINTS, settings, typeLetters. */

const LOOKUP_API = 'https://en.wikipedia.org/w/api.php';
const FOOD_WORDS = /\b(dish|cuisine|food|curry|served|cooked|recipe|snack|dessert|sweet|drink|beverage|bread|rice|fried|baked|stew|soup|sauce|made (with|from|of)|prepared|eaten|meal|street food|delicacy)\b/i;
const MEAT_RE = /\b(chicken|beef|pork|mutton|lamb|goat|meat|fish|prawns?|shrimps?|crab|seafood|bacon|ham|sausage)\b/i;
const EGG_RE = /\beggs?\b/i;
const CURD_RE = /\b(yogh?urt|curd|dahi|raita)\b/i;
const RED_MEAT_RE = /\b(mutton|lamb|goat|beef|pork|red meat)\b/i;
// Everyday English words for FOODS entries that descriptions often use.
const FOOD_SYNONYMS = { 'curd-yogurt': ['yogurt', 'yoghurt'], 'broiler-chicken': ['chicken'], 'kabuli-chana': ['chickpeas', 'chickpea'], 'red-chilli': ['chilli', 'chili', 'chillies', 'chilies'], 'wheat': ['flour', 'wheat'], 'mutton-goat': ['mutton', 'goat'] };
const lookupCache = new Map();

let foodTermsCache = null;
function foodTerms() {
  if (foodTermsCache) return foodTermsCache;
  const skip = new Set(['warm water', 'water', 'old rice', 'milk']);
  foodTermsCache = FOODS.map((f) => {
    const words = new Set();
    const base = f.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
    words.add(base);
    (f.name.match(/\((.*?)\)/) || [, ''])[1].split(/[\/,]/).forEach((w) => words.add(w.trim().toLowerCase()));
    (f.aka || []).forEach((w) => words.add(String(w).toLowerCase()));
    (FOOD_SYNONYMS[f.id] || []).forEach((w) => words.add(w));
    const list = [...words].filter((w) => w.length >= 4 && !skip.has(w));
    if (!list.length) return null;
    const re = new RegExp('\\b(' + list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');
    return { re, food: f };
  }).filter(Boolean);
  return foodTermsCache;
}

// Score a description. Returns null if nothing useful was recognised.
function analyseDescription(text) {
  const hints = DISH_HINTS.filter((h) => h.re.test(text));
  const seen = new Set();
  const foods = [];
  foodTerms().forEach(({ re, food }) => {
    const label = food.name.replace(/\(.*?\)/g, '').trim();
    if (re.test(text) && !seen.has(label)) { seen.add(label); foods.push(food); }
  });
  const top = foods.slice(0, 10);
  if (!hints.length && !top.length) return null;
  const r = [0, 1, 2].map((i) => {
    const key = 'VPK'[i];
    const worstHint = Math.min(0, ...hints.map((h) => h.r[i]));
    if (worstHint < 0) return worstHint;
    const vals = top.map((f) => f[key]).concat(hints.filter((h) => h.r[i] === 1).map(() => 1));
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return avg >= 0.34 ? 1 : avg <= -0.34 ? -1 : 0;
  });
  // Red meat is traditionally heavy (Kapha) and heating (Pitta): never rate it a "good choice" for them.
  if (RED_MEAT_RE.test(text)) { r[1] = Math.min(r[1], 0); r[2] = Math.min(r[2], 0); }
  return {
    r,
    reasons: hints.map((h) => h.why),
    found: top.map((f) => f.name.replace(/\(.*?\)/g, '').trim()),
    nonveg: MEAT_RE.test(text) || top.some((f) => f.type === 'nonveg'),
    egg: EGG_RE.test(text),
    curd: CURD_RE.test(text),
    noteBits: hints.map((h) => h.note).filter(Boolean),
  };
}

// Search Wikipedia and return { title, extract, url } for the first food-related page.
async function wikiLookup(q) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', redirects: '1',
    generator: 'search', gsrsearch: q, gsrlimit: '5',
    prop: 'extracts|info', inprop: 'url', exintro: '1', explaintext: '1', exsentences: '5',
  });
  const res = await fetch(LOOKUP_API + '?' + params.toString());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const pages = Object.values((data.query && data.query.pages) || {}).sort((a, b) => a.index - b.index);
  const page = pages.find((p) => p.extract && FOOD_WORDS.test(p.extract));
  if (!page) return null;
  return { title: page.title, extract: page.extract, url: page.fullurl || ('https://en.wikipedia.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_'))) };
}

// Returns { status: 'ok'|'notfound'|'unclear'|'error', page?, analysis? }. Cached per dish name.
async function lookupDish(q) {
  const key = q.toLowerCase();
  if (lookupCache.has(key)) return lookupCache.get(key);
  let out;
  try {
    const page = await wikiLookup(q);
    if (!page) out = { status: 'notfound' };
    else {
      const analysis = analyseDescription(page.title + '. ' + page.extract);
      out = analysis ? { status: 'ok', page, analysis } : { status: 'unclear', page };
    }
    lookupCache.set(key, out);
  } catch (err) {
    out = { status: 'error' }; // cached so the message shows; cleared on retry
    lookupCache.set(key, out);
  }
  return out;
}
