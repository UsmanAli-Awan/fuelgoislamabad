---
name: api-client-react subpath exports
description: How to correctly import setAuthTokenGetter from @workspace/api-client-react
---

## Rule
Import `setAuthTokenGetter` (and all other auth helpers) from `@workspace/api-client-react` directly. Never import from `@workspace/api-client-react/custom-fetch`.

**Why:** The package.json `exports` map only declares `"."` pointing to `./src/index.ts`. The `/custom-fetch` sub-path is not exported, so Vite throws "Missing './custom-fetch' specifier" at build time even though the file exists on disk.

**How to apply:** `lib/api-client-react/src/index.ts` already re-exports `setAuthTokenGetter` and `setBaseUrl` from `./custom-fetch`, so the barrel is the correct import target. If a new sub-path is genuinely needed, add it to the `exports` map in `lib/api-client-react/package.json`.
