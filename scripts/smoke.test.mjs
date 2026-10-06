// Run with npm test. No account, API key or running API is needed.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = new URL('../', import.meta.url);
const entry = fileURLToPath(new URL('dist/index.js', root));
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const manifest = readJson('package.json');
const expectedTools = [
  'get_pricing', 'search_inventory', 'quote', 'buy_port', 'list_ports',
  'get_port', 'rotate', 'set_rotation_schedule', 'renew_port', 'set_auto_renew',
  'get_passport', 'get_receipt', 'get_usage', 'get_status', 'get_traffic',
  'list_countries', 'build_proxy_url', 'buy_traffic', 'test_connection',
];

test('mirrored files match the published release hashes', () => {
  const provenance = readJson('release-provenance.json');
  assert.equal(provenance.version, manifest.version);
  for (const [path, publishedPath] of [
    ['dist/index.js', 'dist/index.js'],
    ['LICENSE', 'LICENSE'],
    ['llms.txt', 'llms.txt'],
    ['upstream-package.json', 'package.json'],
  ]) {
    const hash = createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
    assert.equal(hash, provenance.published_file_sha256[publishedPath], path);
  }
});

test('CLI help works without an account', () => {
  const result = spawnSync(process.execPath, [entry, '--help'], {
    encoding: 'utf8', timeout: 10_000,
    env: { PORTPROOF_API_KEY: '', PORTPROOF_API_URL: 'http://127.0.0.1:9' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0);
  const help = result.stdout + result.stderr;
  assert.ok(help.includes(`portproof-mcp ${manifest.version}`));
  for (const name of expectedTools) assert.ok(help.includes(name), name);
});

test('stdio discovery and purchase guards', { timeout: 20_000 }, async (t) => {
  // Override both settings explicitly so a developer's real account is never used.
  // The reserved discard port also keeps a regression away from the live API.
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    env: { PORTPROOF_API_KEY: '', PORTPROOF_API_URL: 'http://127.0.0.1:9' },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'portproof-release-smoke', version: '1.0.0' });
  t.after(() => client.close());
  // Drain startup diagnostics without mixing them into the protocol stream.
  transport.stderr?.resume();
  await client.connect(transport);

  await t.test('lists the 19 published tools', async () => {
    assert.equal(client.getServerVersion()?.version, manifest.version);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(({ name }) => name).sort(), [...expectedTools].sort());
  });

  for (const [label, name, args, code] of [
    ['account tools reject a missing key', 'get_traffic', {}, 'config_missing'],
    ['purchase requires confirmation', 'buy_traffic', {
      gb: 1, confirm: false, idempotency_key: 'smoke-no-purchase',
    }, 'confirmation_required'],
    ['purchase requires terms acceptance', 'buy_traffic', {
      gb: 1, confirm: true, idempotency_key: 'smoke-no-purchase',
    }, 'terms_acceptance_required'],
  ]) {
    await t.test(label, async () => {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, true);
      assert.equal(result.content[0].type, 'text');
      assert.equal(JSON.parse(result.content[0].text).error.code, code);
    });
  }

  await t.test('purchase schema rejects a missing idempotency key', async () => {
    const result = await client.callTool({
      name: 'buy_traffic', arguments: { gb: 1, confirm: true },
    });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /idempotency_key/);
  });
});
