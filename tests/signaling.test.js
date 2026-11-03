const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { WebSocket } = require('ws');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

function makeClient(url) {
  const ws = new WebSocket(url);
  const messages = [];
  const waiters = [];

  ws.on('message', raw => {
    const message = JSON.parse(raw.toString());
    const waiterIndex = waiters.findIndex(waiter => waiter.predicate(message));
    if (waiterIndex >= 0) {
      const [waiter] = waiters.splice(waiterIndex, 1);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    } else {
      messages.push(message);
    }
  });

  return {
    ws,
    waitOpen: () => new Promise((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    }),
    next: (predicate = () => true) => {
      const index = messages.findIndex(predicate);
      if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const waiter = { predicate, resolve, reject, timer: null };
        waiter.timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error('Timed out waiting for signaling message'));
        }, 3000);
        waiters.push(waiter);
      });
    },
    send: message => ws.send(JSON.stringify(message)),
    close: () => new Promise(resolve => {
      if (ws.readyState === WebSocket.CLOSED) return resolve();
      ws.once('close', resolve);
      ws.close();
    })
  };
}

test('two registered peers exchange WebRTC offer, answer, ICE, and hangup', async t => {
  const port = await freePort();
  const projectRoot = path.join(__dirname, '..');
  const server = spawn(process.execPath, [path.join(projectRoot, 'server.js')], {
    cwd: projectRoot,
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      WINDIR: process.env.WINDIR,
      PORT: String(port)
    },
    stdio: 'ignore',
    windowsHide: true
  });

  let caller;
  let receiver;
  t.after(async () => {
    await Promise.allSettled([caller?.close(), receiver?.close()]);
    if (server.exitCode === null) {
      server.kill();
      await Promise.race([
        new Promise(resolve => server.once('exit', resolve)),
        sleep(2000)
      ]);
    }
  });

  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/ice`);
      ready = response.ok;
      if (ready) break;
    } catch {}
    await sleep(100);
  }
  assert.equal(ready, true, 'signaling server should start');

  caller = makeClient(`ws://127.0.0.1:${port}`);
  receiver = makeClient(`ws://127.0.0.1:${port}`);
  await Promise.all([caller.waitOpen(), receiver.waitOpen()]);

  caller.send({ type: 'register', id: 'test-caller' });
  receiver.send({ type: 'register', id: 'test-receiver' });
  assert.equal((await caller.next()).type, 'registered');
  assert.equal((await receiver.next()).type, 'registered');

  const offer = { type: 'offer', to: 'test-receiver', sdp: { type: 'offer', sdp: 'offer-sdp' } };
  caller.send(offer);
  assert.deepEqual(await receiver.next(message => message.type === 'offer'), {
    ...offer,
    from: 'test-caller'
  });

  const answer = { type: 'answer', to: 'test-caller', sdp: { type: 'answer', sdp: 'answer-sdp' } };
  receiver.send(answer);
  assert.deepEqual(await caller.next(message => message.type === 'answer'), {
    ...answer,
    from: 'test-receiver'
  });

  const ice = {
    type: 'ice',
    to: 'test-receiver',
    candidate: { candidate: 'candidate:1 1 udp 1 127.0.0.1 9 typ host', sdpMid: '0', sdpMLineIndex: 0 }
  };
  caller.send(ice);
  assert.deepEqual(await receiver.next(message => message.type === 'ice'), {
    ...ice,
    from: 'test-caller'
  });

  caller.send({ type: 'hangup', to: 'test-receiver' });
  assert.equal((await receiver.next(message => message.type === 'hangup')).from, 'test-caller');
});
