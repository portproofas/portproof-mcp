# Portproof MCP server

Agent tools for [Portproof](https://portproof.org): proxy traffic by the GB on
shared mobile 4G/5G and residential pools.

This repository is a **release mirror** of the published
[`@portproof/mcp`](https://www.npmjs.com/package/@portproof/mcp) package, version
**0.2.1**. It contains the published JavaScript bundle, not the private shop or
the original TypeScript development workspace. The bundle's SHA-256 and npm
tarball integrity are recorded in [release-provenance.json](release-provenance.json).

## What it does

- Read current prices, service status and countries with devices online.
- Check your purchased, used and remaining GB.
- Build HTTP or SOCKS5 proxy URLs with a selected pool, country and rotation mode.
- Test a proxy connection using your traffic balance.
- Buy traffic from your wallet with explicit confirmation and terms acceptance.

Both pools are shared. A sticky session keeps the same device while it is online;
its IP address may still change. Use the service for lawful price monitoring,
ad verification, market research, QA, geo-testing and agent workflows, following
the destination site's terms and Portproof's [acceptable-use policy](https://portproof.org/legal/aup).

## Connect an MCP client

Requires **Node.js 20 or newer** and a client supporting local **stdio** servers.

```json
{
  "mcpServers": {
    "portproof": {
      "command": "npx",
      "args": ["-y", "@portproof/mcp@0.2.1"],
      "env": {
        "PORTPROOF_API_KEY": "YOUR_PORTPROOF_API_KEY"
      }
    }
  }
}
```

Create a key in [your Portproof dashboard](https://portproof.org/app/keys).
Keep the real value in your MCP client's private configuration or secret store.
Never commit it to a repository or put it into a prompt.

Public tools work without a key; omit the `env` block to use those. Reading a
traffic balance requires `ports:read`; building proxy URLs, testing connections
and buying traffic require `ports:write`.

| Setting | Meaning |
| --- | --- |
| `PORTPROOF_API_KEY` | Optional for public tools; required for account tools |
| `PORTPROOF_API_URL` | Defaults to `https://api.portproof.org`; normally leave unset |

The server runs locally. The API URL above is **not a hosted MCP endpoint**.

## Purchases and connection tests

Keys act on real account credit; there is no sandbox selected by a key prefix.
Connection tests use a small amount of traffic. Purchases require `confirm: true`
and an `idempotency_key`; traffic purchases also require `accept_terms: true`.
The server instructs the client to ask before confirming those actions.
Passwords in generated proxy URLs stay masked unless explicitly requested.

The published bundle also exposes port-management tools; actual availability and
eligibility are determined by the service. See [the documentation](https://portproof.org/docs)
for the current offer and tool behavior.

## Run this mirror locally

```sh
npm install --ignore-scripts --no-audit --no-fund
npm run check
node dist/index.js --help
```

For a local MCP client, use `node` with the absolute path to `dist/index.js`.
No build step is required. `package.json` is adapted for standalone installation
and marked private to prevent accidentally republishing the mirror. The npm
package's original manifest is retained as `upstream-package.json`.

## Documentation and discovery

- [MCP setup guide](https://portproof.org/guides/proxy-mcp-server-for-ai-agents)
- [API and proxy documentation](https://portproof.org/docs)
- [npm package](https://www.npmjs.com/package/@portproof/mcp)
- Official MCP Registry name: `org.portproof/mcp`
- [Service status](https://portproof.org/status)

`server.json` describes the existing npm release. Its repository field points to
this mirror; updating that local file does not update the hosted Registry.

## License

[MIT](LICENSE). Runtime dependencies retain their own licenses.
