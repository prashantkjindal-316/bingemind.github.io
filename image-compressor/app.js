import { initKit, initSeg, toast } from './kit.js';
import { fit, fmtBytes, searchQuality, outName, zip } from './compress.js';

initKit();
const $ = (id) => document.getElementById(id);
const KEY = 'mt-image-compressor';
const MAX_FILES = 50, MAX_BYTES = 60 * 1024 * 1024;
let mode = 'target', items = [], busy = false, run = 0;

try {
  const s = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (s) {
    if (s.mode === 'quality' || s.mode === 'target') mode = s.mode;
    if (/^\d{1,3}$/.test(String(s.quality)) && s.quality >= 10 && s.quality <= 100) $('quality').value = s.quality;
    if (/^\d{1,6}$/.test(String(s.kb)) && s.kb >= 5) $('kb').value = s.kb;
    ['format', 'maxDim'].forEach((k) => { const el = $(k); if ([...el.options].some((o) => o.value === s[k])) el.value = s[k]; });
  }
} catch (e) { /* ignore */ }
const q = new URLSearchParams(location.search).get('kb');
if (q && /^\d{1,6}$/.test(q) && +q >= 5) { mode = 'target'; $('kb').value = q; }

const seg = initSeg($('mode'), (v) => { mode = v; sync(); recompress(); });
seg.select(mode);
function sync() {
  $('qualityF').hidden = mode !== 'quality'; $('targetF').hidden = mode !== 'target';
  $('qOut').textContent = $('quality').value + '%';
  try { localStorage.setItem(KEY, JSON.stringify({ mode, quality: +$('quality').value, kb: +$('kb').value, format: $('format').value, maxDim: $('maxDim').value })); } catch (e) { /* ignore */ }
}

function outType(file) {
  const f = $('format').value;
  if (f !== 'same') return f;
  // Automatic: photos stay JPG; PNG, WebP and GIF become WebP, which keeps transparency and is far smaller than PNG.
  return file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
}
const toBlob = (canvas, type, quality) => new Promise((r) => canvas.toBlob(r, type, quality));

async function compressOne(it, token) {
  const bmp = it.bitmap;
  let [w, h] = fit(bmp.width, bmp.height, +$('maxDim').value);
  const type = outType(it.file);
  const draw = (W, H) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    if (type === 'image/jpeg') { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); } // JPEG has no transparency
    g.imageSmoothingQuality = 'high'; g.drawImage(bmp, 0, 0, W, H);
    return c;
  };
  let canvas = draw(w, h), blob, note = '';
  if (mode === 'quality' || type === 'image/png') {
    it.q = type === 'image/png' ? null : +$('quality').value / 100;
    blob = await toBlob(canvas, type, +$('quality').value / 100);
    if (type === 'image/png' && mode === 'target') note = 'PNG is lossless, so only resizing reduces it. Choose WebP or JPEG to reach a size.';
  } else {
    const target = Math.max(1, +$('kb').value) * 1024;
    let cache = new Map();
    const enc = async (qq) => { const b = await toBlob(canvas, type, qq); cache.set(qq, b); return b.size; };
    let r = await searchQuality(enc, target);
    // Below about 40% quality JPEG and WebP turn blocky. A slightly smaller image at decent quality looks
    // better, so shrink step by step (down to 640 px) before letting quality fall further.
    for (let i = 0; i < 14 && w > 16 && h > 16 && (!r.ok || (r.q < 0.4 && Math.max(w, h) > 640)); i++) {
      if (token !== run) return;
      w = Math.round(w * 0.85); h = Math.round(h * 0.85); canvas = draw(w, h); cache = new Map();
      r = await searchQuality(enc, target, Math.max(Math.max(w, h) > 640 ? 0.4 : 0.05, 0.05), 0.92, 7);
      note = 'Resized slightly so it stays sharp at this file size.';
    }
    blob = cache.get(r.q) || (await toBlob(canvas, type, r.q));
    if (!r.ok) note = 'Could not reach the target without making the image tiny. Showing the smallest result.';
    it.q = r.q;
  }
  if (token !== run) return;
  if (it.url) URL.revokeObjectURL(it.url);
  Object.assign(it, { blob, w, h, type, note, url: URL.createObjectURL(blob), name: outName(it.file.name, type) });
}

async function recompress() {
  sync();
  if (!items.length) return;
  const token = ++run; busy = true; $('status').textContent = 'Compressing…';
  for (const it of items) { if (token !== run) return; await compressOne(it, token); renderList(); }
  busy = false; renderSummary();
}

function renderList() {
  $('list').replaceChildren(...items.map((it, i) => {
    const li = document.createElement('li'); li.className = 'ic-item';
    const img = document.createElement('img'); img.alt = ''; img.src = it.url || it.srcUrl; img.loading = 'lazy';
    const mid = document.createElement('div'); mid.style.minWidth = '0';
    const nm = document.createElement('div'); nm.className = 'ic-name'; nm.textContent = it.file.name;
    const info = document.createElement('div'); info.className = 'hint';
    const save = it.blob ? 1 - it.blob.size / it.file.size : 0;
    info.textContent = it.blob ? `${fmtBytes(it.file.size)} → ${fmtBytes(it.blob.size)} · ${it.w}×${it.h} · ${it.type.split('/')[1].toUpperCase()}${it.q ? ` · quality ${Math.round(it.q * 100)}%` : ''}` : `${fmtBytes(it.file.size)} · working…`;
    mid.append(nm, info);
    if (it.note) { const n = document.createElement('div'); n.className = 'hint'; n.textContent = it.note; mid.append(n); }
    const right = document.createElement('div'); right.style.textAlign = 'right';
    const s = document.createElement('div'); s.className = 'ic-save' + (save < 0 ? ' bad' : ''); s.textContent = it.blob ? (save >= 0 ? `−${Math.round(save * 100)}%` : `+${Math.round(-save * 100)}%`) : '';
    const b = document.createElement('a'); b.className = 'btn small'; b.textContent = 'Download';
    if (it.blob) { b.href = it.url; b.download = it.name; } else b.setAttribute('aria-disabled', 'true');
    const v = document.createElement('button'); v.type = 'button'; v.className = 'btn small'; v.textContent = 'Compare';
    v.addEventListener('click', () => compare(i));
    right.append(s, b, v);
    li.append(img, mid, right);
    return li;
  }));
}

function renderSummary() {
  const done = items.filter((x) => x.blob);
  const before = done.reduce((s, x) => s + x.file.size, 0), after = done.reduce((s, x) => s + x.blob.size, 0);
  $('big').textContent = before ? `−${Math.max(0, Math.round((1 - after / before) * 100))}%` : '—';
  $('status').textContent = done.length ? `${done.length} image${done.length > 1 ? 's' : ''}: ${fmtBytes(before)} → ${fmtBytes(after)}` : 'Add images to start';
  $('zipAll').hidden = done.length < 2;
  if (done.length && !$('cmp').dataset.on) compare(0);
}

function compare(i) {
  const it = items[i]; if (!it || !it.blob) return;
  $('cmp').hidden = false; $('cmp').dataset.on = '1';
  $('cmpBefore').src = it.srcUrl; $('cmpAfter').src = it.url;
  $('cmpLabel').textContent = `${it.file.name}: ${fmtBytes(it.file.size)} → ${fmtBytes(it.blob.size)}`;
}
$('cmpRange').addEventListener('input', () => { $('cmpAfter').style.clipPath = `inset(0 0 0 ${$('cmpRange').value}%)`; });

async function add(files) {
  const list = [...files].filter((f) => /^image\//.test(f.type));
  if (!list.length) return toast('Choose JPG, PNG, WebP or GIF images');
  for (const f of list.slice(0, MAX_FILES - items.length)) {
    if (f.size > MAX_BYTES) { toast(`${f.name} is over 60 MB`); continue; }
    try {
      const bitmap = await createImageBitmap(f);
      items.push({ file: f, bitmap, srcUrl: URL.createObjectURL(f) });
    } catch (e) { toast(`${f.name} could not be opened in this browser`); }
  }
  if (list.length > MAX_FILES) toast(`Up to ${MAX_FILES} images at a time`);
  renderList(); recompress();
}

const drop = $('drop');
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => add(e.dataTransfer.files));
$('files').addEventListener('change', () => { add($('files').files); $('files').value = ''; });
document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])]; if (f.length) add(f); });
$('form').addEventListener('input', (e) => { if (e.target.id === 'files') return; sync(); clearTimeout(add.t); add.t = setTimeout(recompress, 250); });
$('form').addEventListener('submit', (e) => e.preventDefault());
document.querySelectorAll('[data-kb]').forEach((b) => b.addEventListener('click', () => { $('kb').value = b.dataset.kb; seg.select('target'); mode = 'target'; recompress(); }));
$('clearAll').addEventListener('click', () => {
  run++; items.forEach((x) => { URL.revokeObjectURL(x.srcUrl); if (x.url) URL.revokeObjectURL(x.url); x.bitmap.close?.(); });
  items = []; renderList(); renderSummary(); $('cmp').hidden = true; delete $('cmp').dataset.on;
});
$('zipAll').addEventListener('click', async () => {
  const done = items.filter((x) => x.blob);
  const files = await Promise.all(done.map(async (x) => ({ name: x.name, bytes: new Uint8Array(await x.blob.arrayBuffer()) })));
  const blob = new Blob([zip(files)], { type: 'application/zip' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'compressed-images.zip'; document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
});
sync();
renderSummary();
