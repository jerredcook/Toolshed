import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  rawChunkSizeForEmailLimit, bytesToBase64, base64ToBytes, wrap76,
  buildEml, parsePartName, parseEml, padPart
} from '../lib/chunk-core.mjs';

const MB = 1024 * 1024;

test('chunk size keeps the encoded email under the limit', () => {
  for (const limitMB of [5, 10, 20, 25]) {
    const limit = limitMB * MB;
    const raw = rawChunkSizeForEmailLimit(limit);
    // worst-case encoded size of one full chunk + our reserved overhead
    const encoded = Math.ceil(raw / 3) * 4 * (1 + 2 / 76) + 8 * 1024;
    assert.ok(raw > 0, `raw chunk must be positive for ${limitMB}MB`);
    assert.ok(encoded < limit, `encoded ${encoded} should be < ${limit} (${limitMB}MB)`);
  }
});

test('base64 round-trips arbitrary bytes', () => {
  const bytes = new Uint8Array(crypto.randomBytes(5000));
  const back = base64ToBytes(bytesToBase64(bytes));
  assert.deepEqual(Buffer.from(back), Buffer.from(bytes));
});

test('wrap76 never exceeds 76 chars per line', () => {
  const b64 = bytesToBase64(new Uint8Array(crypto.randomBytes(4096)));
  for (const line of wrap76(b64).split('\r\n')) {
    assert.ok(line.length <= 76, `line length ${line.length} > 76`);
  }
});

test('parsePartName parses valid names and rejects others', () => {
  assert.deepEqual(parsePartName('big report.final.zip.part003of042'),
    { base: 'big report.final.zip', index: 3, total: 42 });
  assert.equal(parsePartName('not-a-part.zip'), null);
});

test('full split -> .eml -> reassemble is bit-for-bit identical', () => {
  const limit = 10 * MB;
  const raw = rawChunkSizeForEmailLimit(limit);
  const original = Buffer.from(crypto.randomBytes(raw * 4 + 1234)); // 5 parts incl. remainder
  const origName = 'big report.final.zip';
  const total = Math.ceil(original.length / raw);

  // --- sender: one .eml per chunk, track the largest encoded email ---
  const emls = [];
  let maxEml = 0;
  for (let i = 0; i < total; i++) {
    const chunk = new Uint8Array(original.subarray(i * raw, Math.min((i + 1) * raw, original.length)));
    const partName = `${origName}.part${padPart(i + 1)}of${padPart(total)}`;
    const eml = buildEml({
      to: 'me@example.com', tag: 'Part', origName, index: i + 1, total, partName,
      b64wrapped: wrap76(bytesToBase64(chunk)),
      boundary: '----=_CM_' + crypto.randomBytes(12).toString('hex')
    });
    maxEml = Math.max(maxEml, Buffer.byteLength(eml, 'utf8'));
    emls.push(eml);
  }
  assert.ok(maxEml <= limit, `largest .eml ${maxEml} must be <= ${limit}`);

  // --- receiver: parse, shuffle, sort by header index, concat ---
  const parsed = emls.map(parseEml);
  for (const p of parsed) assert.equal(p.total, total);
  const shuffled = [...parsed].sort(() => Math.random() - 0.5);
  shuffled.sort((a, b) => a.index - b.index);
  const reassembled = Buffer.concat(shuffled.map(p => Buffer.from(base64ToBytes(p.base64))));

  assert.equal(reassembled.length, original.length, 'reassembled length must match');
  assert.equal(
    crypto.createHash('sha256').update(reassembled).digest('hex'),
    crypto.createHash('sha256').update(original).digest('hex'),
    'reassembled SHA-256 must match the original'
  );
});
