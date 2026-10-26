# MCP Catalog Budget Lab

Offline, zero-dependency analysis for a saved MCP `tools/list` catalog. It reports deterministic serialized bytes, per-tool contribution, a clearly labeled rough token heuristic, repeated descriptions, long descriptions, undocumented input properties, schema depth, branches, and enum size.

## Use

Open `index.html` in a static server, or run:

```sh
node cli.mjs examples/catalog.json
npm run check
```

Accepted JSON shapes are a raw tool array, `{ "tools": [...] }`, or `{ "result": { "tools": [...] } }`. Input is capped at 2 MiB and 2,000 tools; findings are capped at 500. The browser processes input in memory and makes no service call.

## Reading the report

`catalogBytes` is UTF-8 bytes of the compact tool array. Per-tool byte counts use the same deterministic method. `estimatedTokens` is only a rough bytes÷4 heuristic: it is not a provider tokenizer, bill, context-window measurement, or prediction of model quality. Fix descriptions for clarity, not merely brevity, and validate changes in the actual client/model.

## Scope and limitations

This does not connect to an MCP server, follow pagination, authenticate, execute tools, validate full JSON Schema, scan for malicious metadata, diff catalogs, choose a tool subset, or prove that a host includes identical bytes in model context. It complements, rather than replaces, MCP Inspector, accessibility/security testing, and runtime evaluations.

## Accessibility, privacy, and security

The UI is keyboard operable, uses a labeled editor, visible focus, responsive layout, and a concise live status separate from the full report. No catalog data leaves the page, no analytics/storage are used, and CLI errors strip terminal controls/newlines. Treat reports as untrusted data; do not execute catalog content. See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Project

Node 20+ is used for development and CLI use. Browser deployment is plain static files. Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md); support and limitations are in [SUPPORT.md](SUPPORT.md). MIT licensed.
