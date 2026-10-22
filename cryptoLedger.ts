import { AuditLogEntry } from '../types';

/**
 * Pure TypeScript SHA-256 implementation for fast synchronous block hashing
 */
function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeClear = ascii;
  compositeClear += '\x80';
  while (compositeClear[lengthProperty] % 64 - 56) compositeClear += '\x00';

  for (i = 0; i < compositeClear[lengthProperty]; i++) {
    j = compositeClear.charCodeAt(i);
    if (j >> 8) return ''; // ASCII only
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 =
        ((w15 >>> 7) | (w15 << 25)) ^
        ((w15 >>> 18) | (w15 << 14)) ^
        (w15 >>> 3);
      const s1 =
        ((w2 >>> 17) | (w2 << 15)) ^
        ((w2 >>> 19) | (w2 << 13)) ^
        (w2 >>> 10);

      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s0h =
        ((hash[0] >>> 2) | (hash[0] << 30)) ^
        ((hash[0] >>> 13) | (hash[0] << 19)) ^
        ((hash[0] >>> 22) | (hash[0] << 10));
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const t2 = (s0h + maj) | 0;

      const s1h =
        ((hash[4] >>> 6) | (hash[4] << 26)) ^
        ((hash[4] >>> 11) | (hash[4] << 21)) ^
        ((hash[4] >>> 25) | (hash[4] << 7));
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const t1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;

      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function computeBlockHash(
  index: number,
  timestamp: string,
  action: string,
  actorRole: string,
  actorEntity: string,
  details: string,
  previousHash: string
): string {
  const payload = `${index}|${timestamp}|${action}|${actorRole}|${actorEntity}|${details}|${previousHash}`;
  return sha256(payload);
}

export function createAuditBlock(
  action: AuditLogEntry['action'],
  actorRole: string,
  actorEntity: string,
  details: string,
  lastEntry?: AuditLogEntry
): AuditLogEntry {
  const index = lastEntry ? lastEntry.index + 1 : 0;
  const timestamp = new Date().toISOString();
  const previousHash = lastEntry ? lastEntry.currentHash : '0'.repeat(64);
  const currentHash = computeBlockHash(
    index,
    timestamp,
    action,
    actorRole,
    actorEntity,
    details,
    previousHash
  );

  return {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    index,
    timestamp,
    action,
    actorRole,
    actorEntity,
    details,
    previousHash,
    currentHash,
  };
}

export function createGenesisBlock(): AuditLogEntry {
  const index = 0;
  const timestamp = new Date(Date.now() - 86400000 * 3).toISOString();
  const action = 'GENESIS_BLOCK';
  const actorRole = 'SYSTEM';
  const actorEntity = 'AICTE-SVRS Central Root';
  const details = 'Genesis Block initialized. National APAAR verification ledger active.';
  const previousHash = '0'.repeat(64);
  const currentHash = computeBlockHash(
    index,
    timestamp,
    action,
    actorRole,
    actorEntity,
    details,
    previousHash
  );

  return {
    id: 'blk-genesis-0000',
    index,
    timestamp,
    action,
    actorRole,
    actorEntity,
    details,
    previousHash,
    currentHash,
  };
}

export function verifyLedgerIntegrity(entries: AuditLogEntry[]): {
  isValid: boolean;
  brokenIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  totalBlocks: number;
} {
  if (!entries || entries.length === 0) {
    return { isValid: true, totalBlocks: 0 };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check previousHash link
    if (i === 0) {
      if (entry.previousHash !== '0'.repeat(64)) {
        return {
          isValid: false,
          brokenIndex: 0,
          expectedHash: '0'.repeat(64),
          actualHash: entry.previousHash,
          totalBlocks: entries.length,
        };
      }
    } else {
      const prev = entries[i - 1];
      if (entry.previousHash !== prev.currentHash) {
        return {
          isValid: false,
          brokenIndex: i,
          expectedHash: prev.currentHash,
          actualHash: entry.previousHash,
          totalBlocks: entries.length,
        };
      }
    }

    // Check self-hash computation
    const recomputedHash = computeBlockHash(
      entry.index,
      entry.timestamp,
      entry.action,
      entry.actorRole,
      entry.actorEntity,
      entry.details,
      entry.previousHash
    );

    if (recomputedHash !== entry.currentHash) {
      return {
        isValid: false,
        brokenIndex: i,
        expectedHash: recomputedHash,
        actualHash: entry.currentHash,
        totalBlocks: entries.length,
      };
    }
  }

  return { isValid: true, totalBlocks: entries.length };
}

export { sha256 };
