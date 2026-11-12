import { lookup } from 'node:dns';
import { BlockList, isIP, type LookupFunction } from 'node:net';

// Addresses a webhook must never reach: this machine, private networks,
// link-local (cloud metadata lives there) and other special ranges.
const blocked = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 127],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv6');
}

/** Whether an IP address is one a webhook may not be sent to. */
export const isBlockedAddress = (address: string): boolean => {
  // an IPv4 address written as IPv6 is judged as the IPv4 address it is
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1];
  const ip = mapped ?? address;
  const family = isIP(ip);
  if (family === 0) return true;
  return blocked.check(ip, family === 4 ? 'ipv4' : 'ipv6');
};

/**
 * Local testing only: lets webhooks go to http:// and to this machine.
 * Never honored in production.
 */
export const allowInsecureWebhooks = (): boolean =>
  process.env.NODE_ENV !== 'production' &&
  process.env.WEBHOOK_ALLOW_INSECURE === 'true';

/**
 * Resolves a host name for the connection itself and refuses any answer
 * in a blocked range. Checking here, not before, means a name cannot
 * point somewhere safe for the check and somewhere else for the request.
 */
export const guardedLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 4);
    const list = Array.isArray(addresses) ? addresses : [];
    if (
      list.length === 0 ||
      (!allowInsecureWebhooks() &&
        list.some((a) => isBlockedAddress(a.address)))
    ) {
      const refused = new Error(
        'This address leads to a private network',
      ) as NodeJS.ErrnoException;
      refused.code = 'EWEBHOOKBLOCKED';
      return callback(refused, '', 4);
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
};
