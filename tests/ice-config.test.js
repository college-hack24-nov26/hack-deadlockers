const test = require('node:test');
const assert = require('node:assert/strict');
const { createIceConfigHandler } = require('../server');

async function requestConfig(handler) {
  const response = {
    headers: {},
    body: undefined,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  await handler({}, response);
  return response;
}

test('uses public STUN servers and clearly reports TURN is not configured', async () => {
  const handler = createIceConfigHandler({ env: {}, fetchImpl: undefined });
  const response = await requestConfig(handler);

  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(response.body.turnConfigured, false);
  assert.deepEqual(response.body.iceServers.map(server => server.urls), [
    'stun:stun.cloudflare.com:3478',
    'stun:stun.l.google.com:19302'
  ]);
});

test('generates per-request short-lived Cloudflare TURN credentials and filters port 53', async () => {
  let requests = 0;
  const token = 'test-turn-key-secret';
  const handler = createIceConfigHandler({
    env: { CLOUDFLARE_TURN_KEY_ID: 'turn-key-id', CLOUDFLARE_TURN_KEY_API_TOKEN: token },
    fetchImpl: async (url, options) => {
      requests += 1;
      assert.match(url, /\/turn\/keys\/turn-key-id\/credentials\/generate-ice-servers$/);
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, `Bearer ${token}`);
      assert.deepEqual(JSON.parse(options.body), { ttl: 86400 });
      return {
        ok: true,
        json: async () => ({
          iceServers: [
            { urls: ['stun:stun.cloudflare.com:3478'] },
            {
              urls: ['turn:turn.cloudflare.com:53?transport=tcp', 'turn:turn.cloudflare.com:443?transport=udp'],
              username: 'ephemeral-user',
              credential: 'ephemeral-password'
            }
          ]
        })
      };
    }
  });

  const first = await requestConfig(handler);
  const second = await requestConfig(handler);
  const turnServer = first.body.iceServers.find(server => server.username);

  assert.equal(first.body.turnConfigured, true);
  assert.equal(first.body.turnProvider, 'cloudflare');
  assert.deepEqual(turnServer.urls, ['turn:turn.cloudflare.com:443?transport=udp']);
  assert.equal(turnServer.username, 'ephemeral-user');
  assert.equal(turnServer.credential, 'ephemeral-password');
  assert.equal(second.body.turnConfigured, true);
  assert.equal(requests, 2);
});

test('falls back to configured custom TURN if Cloudflare credential generation fails', async () => {
  const handler = createIceConfigHandler({
    env: {
      CLOUDFLARE_TURN_KEY_ID: 'turn-key-id',
      CLOUDFLARE_TURN_KEY_API_TOKEN: 'secret-token',
      TURN_URLS: 'turn:relay.example:443?transport=tcp; turns:relay.example:443',
      TURN_USERNAME: 'custom-user',
      TURN_CREDENTIAL: 'custom-password'
    },
    fetchImpl: async () => ({ ok: false, status: 401 }),
    logger: { warn() {} }
  });

  const response = await requestConfig(handler);
  const turnServer = response.body.iceServers.find(server => server.username);

  assert.equal(response.body.turnConfigured, true);
  assert.equal(response.body.turnProvider, 'custom');
  assert.deepEqual(turnServer.urls, ['turn:relay.example:443?transport=tcp', 'turns:relay.example:443']);
  assert.equal(JSON.stringify(response.body).includes('secret-token'), false);
});
