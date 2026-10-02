'use strict';
const assert = require('assert');
const http = require('http');
const server = require('../server');
function request(route, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({host: '127.0.0.1', port: server.address().port, path: route, method}, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({status: res.statusCode, body, headers: res.headers}));
    });
    req.on('error', reject); req.end();
  });
}
server.listen(0, '127.0.0.1', async () => {
  try {
    assert.equal((await request('/')).status, 200);
    const runner = await request('/test/SpecRunner.html');
    assert.equal(runner.status, 200);
    for (const match of runner.body.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target = new URL(match[1], 'http://localhost/test/SpecRunner.html').pathname;
      assert.equal((await request(target)).status, 200, target);
    }
    assert.equal((await request('/.git/config')).status, 403);
    assert.equal((await request('/src/../../package.json')).status, 403);
    assert.equal((await request('/src/../package.json')).status, 403);
    assert.equal((await request('/src/../.git/config')).status, 403);
    assert.equal((await request('/src/%2e%2e/.git/config')).status, 403);
    assert.equal((await request('/src/absent.js')).status, 404);
    assert.equal((await request('/%', 'GET')).status, 400);
    assert.equal((await request('/', 'POST')).status, 405);
    assert.equal((await request('/', 'HEAD')).body, '');
    console.log('HTTP demo and all Jasmine runner assets pass; hidden/traversal paths are blocked.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); }
});
