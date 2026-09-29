/* speak.js — "Read aloud" with the phone's own voice (Web Speech API).
   Works offline on most phones; nothing is sent anywhere. Renderers put the text to read in
   speechTexts[key] and show speakBtnHtml(key); one document-level listener handles every button. */

const canSpeak = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
const speechTexts = {};
let speakingBtn = null;

function pickVoice() {
  const vs = window.speechSynthesis.getVoices();
  return vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}

function setSpeakBtn(btn, on) {
  if (!btn) return;
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  const l = btn.querySelector('.spk-lbl');
  if (l) l.textContent = on ? 'Stop' : 'Read aloud';
}

function stopSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  setSpeakBtn(speakingBtn, false);
  speakingBtn = null;
}

// Tap once to read, tap the same button again to stop.
function speakText(text, btn) {
  if (!canSpeak() || !text) return;
  const same = btn && speakingBtn === btn;
  stopSpeaking();
  if (same) return;
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
  u.rate = (settings.textSize && settings.textSize !== 'normal') ? 0.85 : 0.95;
  u.onend = u.onerror = () => { if (speakingBtn === btn) { setSpeakBtn(btn, false); speakingBtn = null; } };
  speakingBtn = btn || null;
  setSpeakBtn(btn, true);
  window.speechSynthesis.speak(u);
}

function speakBtnHtml(key) {
  if (!canSpeak()) return '';
  return `<button class="btn ghost speak-btn" type="button" data-speak="${esc(key)}" aria-pressed="false"><span aria-hidden="true">🔊</span> <span class="spk-lbl">Read aloud</span></button>`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-speak]');
  if (b) speakText(speechTexts[b.dataset.speak] || '', b);
});
