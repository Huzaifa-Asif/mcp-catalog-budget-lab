# Threat model

Catalog JSON can be malformed, huge, deeply nested, secret-bearing, or contain terminal controls and prompt-like text. Controls: strict accepted envelopes; 2 MiB, 2,000-tool, 512-level nesting, 200,000-container and 500-finding bounds; data-only parsing; truncated control-stripped evidence; no network, execution, dynamic HTML insertion, persistence, or logs. A report can still disclose tool metadata if a user shares it.
