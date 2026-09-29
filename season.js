/* season.js — Ritucharya: "This season" card on Today and Learn, and a full season screen.
   Uses SEASONS / seasonFor (data-seasons.js) and speak.js. */

function seasonSpeech(s, full) {
  const L = typeLetters();
  const parts = [`This season is ${s.name}, ${s.english}, ${s.months}.`, s.dosha];
  L.forEach((k) => parts.push(`For ${DOSHA_NAMES[k]}: ${s.tips[k]}`));
  if (full) {
    parts.push('Favour: ' + s.favour.join(', ') + '.');
    parts.push('Limit: ' + s.limit.join(', ') + '.');
  }
  return parts.join(' ');
}

function seasonCardHtml() {
  const s = seasonFor();
  const L = typeLetters();
  speechTexts.season = seasonSpeech(s, false);
  return `<div class="card stack season-card">
    <p class="small muted">This season · Ritucharya</p>
    <h2 class="card-title">${esc(s.name)} · ${esc(s.english)}</h2>
    <p class="small muted">${esc(s.months)}</p>
    <p>${esc(s.dosha)}</p>
    ${L.map((k) => `<p class="season-tip"><strong>For ${DOSHA_NAMES[k]}:</strong> ${esc(s.tips[k])}</p>`).join('')}
    <div class="btn-row">
      <button class="btn ghost" type="button" data-season-more="${esc(s.id)}">What to eat this season</button>
      ${speakBtnHtml('season')}
    </div>
  </div>`;
}

function seasonFullHtml(s) {
  const L = typeLetters();
  const now = seasonFor();
  const shown = L.length ? L : ['V', 'P', 'K'];
  speechTexts.seasonfull = seasonSpeech(s, true);
  return `<div class="stack">
    <p class="small muted">${s.id === now.id ? 'This season' : 'Season'} · Ritucharya</p>
    <h2 class="card-title">${esc(s.name)} · ${esc(s.english)}</h2>
    <p class="small muted">${esc(s.months)}</p>
    <p>${esc(s.dosha)}</p>
    <div><p class="card-title">Favour</p><ul>${s.favour.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><p class="card-title">Limit</p><ul>${s.limit.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><p class="card-title">By dosha</p>${shown.map((k) => `<p class="season-tip"><strong>${DOSHA_NAMES[k]}:</strong> ${esc(s.tips[k])}</p>`).join('')}</div>
    <p class="source small muted">Source: ${esc(s.source)}. Months are approximate and shift with local weather. Traditional guidance, not medical advice.</p>
    <div class="chips" role="group" aria-label="All seasons">${SEASONS.map((x) => `<button type="button" class="chip${x.id === s.id ? ' on' : ''}" aria-pressed="${x.id === s.id}" data-season-go="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>
  </div>`;
}

function openSeason(id) {
  const s = SEASONS.find((x) => x.id === id) || seasonFor();
  openOverlay(`<div class="card stack">${seasonFullHtml(s)}<div class="btn-row">${speakBtnHtml('seasonfull')}<button class="btn primary" type="button" data-season-close>Close</button></div></div>`);
}

document.addEventListener('click', (e) => {
  const more = e.target.closest('[data-season-more]');
  if (more) { openSeason(more.dataset.seasonMore); return; }
  const go = e.target.closest('[data-season-go]');
  if (go) { if (typeof stopSpeaking === 'function') stopSpeaking(); openSeason(go.dataset.seasonGo); return; }
  if (e.target.closest('[data-season-close]')) closeOverlay();
});
