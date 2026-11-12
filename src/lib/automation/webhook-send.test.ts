import { createHmac } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postWebhook, signBody } from './webhook-send';

type Received = { headers: http.IncomingHttpHeaders; body: string };

const listen = (status: number, received: Received[]) =>
  new Promise<http.Server>((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        received.push({ headers: req.headers, body });
        res.statusCode = status;
        res.end('ok');
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });

const urlOf = (server: http.Server) =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`;

describe('signing', () => {
  it('is the HMAC-SHA256 of the body with the secret', () => {
    const expected = createHmac('sha256', 'secret')
      .update('{"a":1}')
      .digest('hex');
    expect(signBody('secret', '{"a":1}')).toBe(`sha256=${expected}`);
    expect(signBody('other', '{"a":1}')).not.toBe(`sha256=${expected}`);
  });
});

describe('sending', () => {
  let server: http.Server | undefined;
  beforeEach(() => vi.stubEnv('WEBHOOK_ALLOW_INSECURE', 'true'));
  afterEach(() => {
    vi.unstubAllEnvs();
    server?.close();
    server = undefined;
  });

  it('POSTs the body with its headers and reports the answer', async () => {
    const received: Received[] = [];
    server = await listen(200, received);
    const result = await postWebhook(urlOf(server), '{"event":"ping"}', {
      'X-TimeCraft-Event': 'ping',
    });
    expect(result.status).toBe(200);
    expect(result.error).toBeNull();
    expect(received[0].body).toBe('{"event":"ping"}');
    expect(received[0].headers['x-timecraft-event']).toBe('ping');
    expect(received[0].headers['content-type']).toBe('application/json');
  });

  it('a refusal comes back as a result, never a throw', async () => {
    server = await listen(500, []);
    const result = await postWebhook(urlOf(server), '{}', {});
    expect(result.status).toBe(500);
    expect(result.error).toBe('500 Internal Server Error');
  });

  it('says so when nothing is listening', async () => {
    server = await listen(200, []);
    const url = urlOf(server);
    await new Promise((resolve) => server?.close(resolve));
    const result = await postWebhook(url, '{}', {});
    expect(result.status).toBeNull();
    expect(result.error).toBe('The connection was refused');
  });

  it('refuses http and private addresses unless testing locally', async () => {
    vi.unstubAllEnvs();
    const plain = await postWebhook('http://127.0.0.1:9/hook', '{}', {});
    expect(plain).toMatchObject({
      status: null,
      error: 'The address must start with https://',
    });
    // as numbers, as a name that resolves there, and in IPv6
    for (const url of [
      'https://127.0.0.1:9/hook',
      'https://localhost:9/hook',
      'https://[::1]:9/hook',
      'https://169.254.169.254/latest/meta-data',
      'https://2130706433:9/hook',
    ]) {
      expect(await postWebhook(url, '{}', {}), url).toMatchObject({
        status: null,
        error: 'This address leads to a private network',
      });
    }
  });
});
