// Pure helpers for the image compressor: sizing, target-size search, ZIP packing. Tested in tests/tools2.test.mjs.

export function fit(w, h, max) {
  if (!max || (w <= max && h <= max)) return [w, h];
  const s = max / Math.max(w, h);
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))];
}

export function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Find the highest quality whose output is at or under `target` bytes.
 * encode(q) -> Promise<size>. Binary search over quality, 8 steps (about 0.4% precision).
 * Returns { q, size } of the best fit, or the smallest result with ok=false when nothing fits.
 */
export async function searchQuality(encode, target, lo = 0.05, hi = 0.95, steps = 8) {
  let best = null, smallest = null;
  const top = await encode(hi);
  if (top <= target) return { q: hi, size: top, ok: true };
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2, size = await encode(mid);
    if (!smallest || size < smallest.size) smallest = { q: mid, size };
    if (size <= target) { best = { q: mid, size }; lo = mid; } else hi = mid;
  }
  if (!best) { const s = await encode(lo); if (s <= target) best = { q: lo, size: s }; else if (!smallest || s < smallest.size) smallest = { q: lo, size: s }; }
  return best ? { ...best, ok: true } : { ...smallest, ok: false };
}

export function outName(name, type) {
  const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[type] || 'img';
  const base = String(name).replace(/\.[^.]+$/, '').replace(/[^\w\- .()]+/g, '_').slice(0, 80) || 'image';
  return `${base}-compressed.${ext}`;
}

// ZIP (store method, no compression: images are already compressed). Spec: PKWARE APPNOTE 6.3.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(bytes) { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

export function zip(files) {
  const enc = new TextEncoder(), chunks = [], central = [];
  let offset = 0;
  const used = new Set();
  for (const f of files) {
    let name = f.name, k = 1;
    while (used.has(name)) name = f.name.replace(/(\.[^.]+)?$/, (e) => `-${k++}${e || ''}`);
    used.add(name);
    const nm = enc.encode(name), data = f.bytes, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    chunks.push(new Uint8Array(h.buffer), nm, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, nm.length, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), nm);
    offset += 30 + nm.length + data.length;
  }
  const cdSize = central.reduce((s, x) => s + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(e.buffer)];
  const out = new Uint8Array(all.reduce((s, x) => s + x.length, 0));
  let p = 0; for (const x of all) { out.set(x, p); p += x.length; }
  return out;
}
