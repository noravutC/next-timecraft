import { describe, expect, it } from 'vitest';
import { isBlockedAddress } from './webhook-guard';

describe('addresses a webhook may not reach', () => {
  it('blocks this machine and private networks', () => {
    for (const address of [
      '127.0.0.1',
      '10.1.2.3',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.10',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fc00::1',
      'fe80::1',
    ]) {
      expect(isBlockedAddress(address), address).toBe(true);
    }
  });

  it('blocks the link-local range where cloud metadata lives', () => {
    expect(isBlockedAddress('169.254.169.254')).toBe(true);
  });

  it('sees through an IPv4 address written as IPv6', () => {
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedAddress('::ffff:8.8.8.8')).toBe(false);
  });

  it('lets public addresses through', () => {
    expect(isBlockedAddress('8.8.8.8')).toBe(false);
    expect(isBlockedAddress('172.32.0.1')).toBe(false);
    expect(isBlockedAddress('2606:4700:4700::1111')).toBe(false);
  });

  it('blocks what is not an address at all', () => {
    expect(isBlockedAddress('example.com')).toBe(true);
    expect(isBlockedAddress('')).toBe(true);
  });
});
