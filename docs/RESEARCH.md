# Research and novelty boundary

Checked 2026-10-27 MYT. MCP requires tool metadata and input schemas in `tools/list`; issue reports document large catalogs consuming context and requests for description-length warnings. Proposed filtering and commercial dynamic toolsets address runtime selection. This project instead gives developers a free local static evidence report for an already-saved catalog.

- MCP tools specification: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- Catalog context report: https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1308
- Inspector warning request: https://github.com/modelcontextprotocol/inspector/issues/523
- Rejected filtering proposal: https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1300
- Speakeasy dynamic toolsets: https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2

Known alternatives include generic JSON byte/token counters, MCP Inspector, and runtime filtering/gateway products. Catalog bloat is not novel; this implementation's narrow contribution is deterministic per-tool attribution plus bounded documentation-hygiene findings with explicit nonclaims.
