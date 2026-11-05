import { describe, it, expect } from 'vitest';
import { normalizeDomain } from '../src/engine/domain';

describe('normalizeDomain', () => {
  it('accepts hosts, ports, and base paths, stripping scheme and trailing slashes', () => {
    expect(normalizeDomain('lz.io')).toBe('lz.io');
    expect(normalizeDomain('https://linkcp.vercel.app/')).toBe('linkcp.vercel.app');
    expect(normalizeDomain('  cipherharsh.github.io/Link-Compressor  ')).toBe('cipherharsh.github.io/Link-Compressor');
    expect(normalizeDomain('localhost:3000')).toBe('localhost:3000');
  });

  it('rejects anything that is not a plain host with optional port and path', () => {
    for (const bad of ['', '   ', 'not a domain', 'lz.io?x=1', 'lz.io#top', 'lz..io', 'lz.io//links', 'ftp://lz.io']) {
      expect(normalizeDomain(bad)).toBeNull();
    }
  });
});
