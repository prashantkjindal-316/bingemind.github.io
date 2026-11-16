import { initKit, initSeg, toast, downloadFile } from './kit.js';
import { encode, toSVG, payload, contrast } from './qr.js';

initKit();
const $ = (id) => document.getElementById(id);
const KEY = 'mt-qr-code-generator';
const TYPES = ['url', 'text', 'wifi', 'email', 'phone', 'sms', 'vcard'];
const FIELDS = { url: ['url'], text: ['text'], wifi: ['ssid', 'pass', 'enc', 'hidden'], email: ['to', 'subject', 'body'], phone: ['phone'], sms: ['phone2', 'message'], vcard: ['first', 'last', 'org', 'title', 'vphone', 'vemail', 'site'] };
const STYLE = ['fg', 'bg', 'ecl', 'round', 'size', 'margin'];
const HEX = /^#[0-9a-f]{6}$/i;
let type = 'url', logo = '', last = null;

// Restore saved settings (never the Wi-Fi password). Values are only ever set with .value / .checked.
try {
  const s = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (s && typeof s === 'object') {
    if (TYPES.includes(s.type)) type = s.type;
    Object.values(FIELDS).flat().concat(STYLE).forEach((k) => {
      const el = $(k); if (!el || !(k in s) || k === 'pass') return;
      if (el.type === 'checkbox') el.checked = s[k] === true;
      else if (el.tagName === 'SELECT') { if ([...el.options].some((o) => o.value === s[k])) el.value = s[k]; }
      else if (el.type === 'color') { if (HEX.test(s[k])) el.value = s[k]; }
      else if (typeof s[k] === 'string') el.value = s[k].slice(0, 1000);
    });
  }
} catch (e) { /* ignore */ }
const q = new URLSearchParams(location.search);
if (q.get('url') && /^https?:\/\//i.test(q.get('url'))) { type = 'url'; $('url').value = q.get('url').slice(0, 1000); }

const seg = initSeg($('type'), (v) => { type = v; render(); });
seg.select(type);

function values() {
  const v = {};
  Object.values(FIELDS).flat().forEach((k) => { const el = $(k); v[k] = el.type === 'checkbox' ? el.checked : el.value; });
  return { ...v, phone: type === 'sms' ? v.phone2 : type === 'vcard' ? v.vphone : v.phone, email: v.vemail };
}
function text() { return payload[type](values()); }

function render() {
  document.querySelectorAll('[data-type]').forEach((el) => { el.hidden = el.dataset.type !== type; });
  const fg = $('fg').value, bg = $('bg').value, t = text();
  const warn = [];
  if (!t.trim() || t === 'tel:' || t === 'mailto:' || /^SMSTO::?$/.test(t)) { $('qr').innerHTML = '<p class="hint qr-empty">Type something to make your QR code.</p>'; last = null; status(''); return save(); }
  if (type === 'url' && !/^[a-z][a-z0-9+.-]*:/i.test(t)) warn.push('Links work best with https:// at the start.');
  const c = contrast(fg, bg);
  if (c < 4) warn.push(`Low contrast (${c.toFixed(1)}:1). Some phones may not scan it. Aim for 4:1 or more.`);
  const lum = (h) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
  if (lum(fg) > lum(bg)) warn.push('Light dots on a dark background are not read by every scanner. Dark on light is safest.');
  try {
    last = encode(t, logo ? 'H' : $('ecl').value);
  } catch (e) { $('qr').innerHTML = `<p class="note warn">${e.message}</p>`; last = null; status(''); return save(); }
  const svg = toSVG(last, { fg, bg, margin: +$('margin').value, px: 8, round: $('round').checked });
  $('qr').innerHTML = svg;
  if (logo) {
    const s = $('qr').querySelector('svg'), n = last.size + +$('margin').value * 2, w = n * 0.22, x = (n - w) / 2;
    s.insertAdjacentHTML('beforeend', `<rect x="${x - 0.6}" y="${x - 0.6}" width="${w + 1.2}" height="${w + 1.2}" rx="1" fill="${bg}"/><image href="${logo}" x="${x}" y="${x}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`);
  }
  $('meta').textContent = `Version ${last.version} · ${last.size}×${last.size} modules · error correction ${last.ecl} (${{ L: '7%', M: '15%', Q: '25%', H: '30%' }[last.ecl]} can be damaged) · ${new TextEncoder().encode(t).length} bytes`;
  $('warn').hidden = !warn.length; $('warn').textContent = warn.join(' ');
  $('payload').textContent = t;
  scanCheck();
  save();
}

function save() {
  const s = { type };
  Object.values(FIELDS).flat().concat(STYLE).forEach((k) => { const el = $(k); if (k !== 'pass') s[k] = el.type === 'checkbox' ? el.checked : el.value; });
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

// Draw the code to a canvas at the chosen size (for PNG download, copy and the scan check).
async function toCanvas(px) {
  const svg = $('qr').querySelector('svg'); if (!svg) return null;
  const clone = svg.cloneNode(true); clone.setAttribute('width', px); clone.setAttribute('height', px);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  await img.decode();
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, px, px);
  return c;
}

// Where the browser can read QR codes (Chrome, Edge, Android), test the design actually scans.
let scanTimer;
function status(html, ok) { const el = $('scan'); el.innerHTML = html; el.dataset.ok = ok === undefined ? '' : String(ok); }
function scanCheck() {
  clearTimeout(scanTimer);
  if (!('BarcodeDetector' in window)) { status('Scan test: open on Chrome or Edge to test scanning in the browser, or scan it with your phone camera.'); return; }
  status('Checking it scans…');
  scanTimer = setTimeout(async () => {
    try {
      const det = new BarcodeDetector({ formats: ['qr_code'] });
      const r = await det.detect(await toCanvas(600));
      const okk = r.length && r[0].rawValue === text();
      status(okk ? '✓ Scan test passed: a scanner reads it exactly.' : '✗ Scan test failed. Increase contrast, remove the logo or use higher error correction.', !!okk);
    } catch (e) { status('Scan test unavailable in this browser. Scan it with your phone camera.'); }
  }, 350);
}

$('form').addEventListener('input', render);
$('form').addEventListener('submit', (e) => e.preventDefault());
$('logoFile').addEventListener('change', () => {
  const f = $('logoFile').files[0]; if (!f) return;
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) return toast('Use a PNG, JPG, WebP or SVG image');
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const s = Math.min(1, 256 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    logo = c.toDataURL('image/png'); URL.revokeObjectURL(url);
    $('noLogo').hidden = false; $('eclNote').hidden = false; render();
  };
  img.onerror = () => toast('That image could not be read');
  img.src = url;
});
$('noLogo').addEventListener('click', () => { logo = ''; $('logoFile').value = ''; $('noLogo').hidden = true; $('eclNote').hidden = true; render(); });
$('dlPng').addEventListener('click', async () => {
  const c = await toCanvas(+$('size').value); if (!c) return;
  c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'qr-code.png'; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }, 'image/png');
});
$('dlSvg').addEventListener('click', () => { const s = $('qr').querySelector('svg'); if (s) downloadFile('qr-code.svg', new XMLSerializer().serializeToString(s), 'image/svg+xml'); });
$('copyPng').addEventListener('click', async () => {
  try { const c = await toCanvas(+$('size').value); const b = await new Promise((r) => c.toBlob(r, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('QR code copied'); }
  catch (e) { toast('Copy is not supported here. Use Download PNG.'); }
});
$('printQr').addEventListener('click', () => window.print());
render();
