import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encode, capacityBytes, payload, contrast, toSVG } from '../../qr-code-generator/qr.js';
import { fit, fmtBytes, searchQuality, outName, zip, crc32 } from '../../image-compressor/compress.js';

test('QR byte capacities match the ISO/IEC 18004 tables', () => {
  assert.deepEqual(['L', 'M', 'Q', 'H'].map((e) => capacityBytes(1, e)), [17, 14, 11, 7]);
  assert.equal(capacityBytes(10, 'M'), 213);
  assert.equal(capacityBytes(40, 'L'), 2953);
  assert.equal(capacityBytes(40, 'H'), 1273);
});
test('QR picks the smallest version and boosts error correction for free', () => {
  const q = encode('Hello, world!', 'L');
  assert.equal(q.version, 1); assert.equal(q.size, 21); assert.equal(q.ecl, 'M');
  assert.equal(encode('x'.repeat(2953), 'L', { boost: false }).version, 40);
  assert.throws(() => encode('x'.repeat(2954), 'L'));
});
test('QR finder patterns and timing pattern are in place', () => {
  const { modules: m, size } = encode('https://bingemind.com/', 'M');
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) { assert.equal(m[cy][cx], true); assert.equal(m[cy - 2][cx], false); assert.equal(m[cy - 3][cx], true); }
  for (let i = 8; i < size - 8; i++) assert.equal(m[6][i], i % 2 === 0);
  assert.equal(m[size - 8][8], true); // dark module
});
test('QR SVG has a quiet zone and one path', () => {
  const s = toSVG(encode('a', 'M'), { margin: 4 });
  assert.match(s, /viewBox="0 0 29 29"/); assert.equal((s.match(/<path/g) || []).length, 1);
});
test('QR payloads escape special characters', () => {
  assert.equal(payload.wifi({ enc: 'WPA', ssid: 'My;Net', pass: 'p:a\\ss', hidden: false }), String.raw`WIFI:T:WPA;S:My\;Net;P:p\:a\\ss;;`);
  assert.equal(payload.wifi({ enc: 'nopass', ssid: 'Cafe' }), 'WIFI:T:nopass;S:Cafe;;');
  assert.equal(payload.phone({ phone: '+44 (20) 7946-0000' }), 'tel:+442079460000');
  assert.equal(payload.email({ to: 'a@b.com', subject: 'Hi there', body: '' }), 'mailto:a@b.com?subject=Hi%20there');
  assert.match(payload.vcard({ first: 'Ana', last: 'Li', org: 'A,B' }), /^BEGIN:VCARD\nVERSION:3\.0\nN:Li;Ana\nFN:Ana Li\nORG:A\\,B\nEND:VCARD$/);
});
test('contrast ratio', () => { assert.ok(Math.abs(contrast('#000000', '#ffffff') - 21) < 1e-9); assert.ok(Math.abs(contrast('#777777', '#777777') - 1) < 1e-9); });

test('fit keeps the aspect ratio', () => { assert.deepEqual(fit(4000, 3000, 1920), [1920, 1440]); assert.deepEqual(fit(800, 600, 1920), [800, 600]); assert.deepEqual(fit(1000, 4000, 1000), [250, 1000]); });
test('fmtBytes', () => { assert.equal(fmtBytes(512), '512 B'); assert.equal(fmtBytes(51200), '50 KB'); assert.equal(fmtBytes(2.5 * 1048576), '2.50 MB'); });
test('searchQuality finds the best quality under the target', async () => {
  const enc = async (q) => Math.round(10000 + q * 190000); // size grows with quality
  const r = await searchQuality(enc, 100000);
  assert.ok(r.ok && r.size <= 100000 && r.size > 98500, JSON.stringify(r));
  const none = await searchQuality(async () => 5e6, 1000);
  assert.equal(none.ok, false);
  const top = await searchQuality(enc, 1e9); assert.equal(top.q, 0.95);
});
test('outName is safe', () => { assert.equal(outName('../../x<y>.PNG', 'image/webp'), '.._.._x_y_-compressed.webp'); assert.equal(outName('photo.jpeg', 'image/jpeg'), 'photo-compressed.jpg'); });
test('crc32 check value', () => assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926));
test('zip opens in an independent unzip tool', (t) => {
  const z = zip([{ name: 'a.txt', bytes: new TextEncoder().encode('hello') }, { name: 'a.txt', bytes: new Uint8Array([1, 2, 3]) }, { name: 'ünï.txt', bytes: new Uint8Array(0) }]);
  const dir = mkdtempSync(join(tmpdir(), 'zip-')), f = join(dir, 'x.zip'); writeFileSync(f, z);
  const py = spawnSync('python3', ['-c', `import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip());print(sorted(z.namelist()));print(z.read('a.txt').decode())`, f], { encoding: 'utf8' });
  if (py.error) return t.skip('python3 not available');
  assert.equal(py.status, 0, py.stderr);
  const [bad, names, body] = py.stdout.trim().split('\n');
  assert.equal(bad, 'None'); assert.equal(names, "['a-1.txt', 'a.txt', 'ünï.txt']"); assert.equal(body, 'hello');
});
