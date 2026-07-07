# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`@acfatah/memory-cache` is a dependency-free, in-memory TTL cache for Bun and Node.js, published to npm as an ESM-only library. The entire public surface is a single factory, `useMemoryCache()`.

## Toolchain

Bun is the runtime, package manager, test runner, and bundler — there is no npm/pnpm, Jest, Vite, or tsc-based build here. Requires Bun `>=1.2.18` and Node `>=22`. The pinned Bun version lives in `.bun-version` (consumed by CI and by `build`).

## Commands

```bash
bun install              # install deps

bun test                 # run all tests
bun test tests/memory-cache.spec.ts   # run a single test file
bun test -t "should purge"            # run tests matching a name pattern
bun test:watch           # watch mode
bun test:coverage        # emit coverage/lcov.info (what CI uploads)

bun typecheck            # tsc --noEmit (type-check only; no build output)
bun lint                 # eslint over the repo
bun format               # eslint --fix
bun lint:changed         # eslint only files changed vs HEAD (untracked included)

bun run build            # bundle src/ -> dist/ (ESM .mjs + .d.ts)
bun run release          # build, then interactive version bump + git tag (bumpp)
```

`precommit` (`bun run typecheck && bun run lint:staged`) and commit-message linting run automatically via `simple-git-hooks`; commits must follow Conventional Commits (`@commitlint/config-conventional`).

## Architecture — the one thing to know first

**Cache storage is a module-level global singleton, not per-instance.** In `src/memory-cache.ts`, `cacheStorage` (a `Map`), `purgeIntervalId`, and `purgeTimeout` are declared at module scope — _outside_ `useMemoryCache()`. Every call to `useMemoryCache()` returns fresh closures (`get`/`set`/`keys`/…) but they all read and write the **same** underlying `Map`.

Consequences that are easy to get wrong:

- Two `useMemoryCache()` instances share one keyspace and collide on identical keys.
- `clear()`, `purge()`, `keys()` operate globally regardless of which instance called them.
- `setPurgeTimeout()` reconfigures the single shared interval for all callers (the README calls this out).
- The generic `useMemoryCache<CacheSchema>()` parameter is **purely compile-time type inference** for key/value types — it does _not_ namespace or isolate storage at runtime.
- Tests rely on this: `beforeEach` constructs an instance and calls `clear()` to reset the shared global between cases.

## Cache semantics

- **`ttl` is stored as an absolute expiry timestamp**, not a remaining duration. `set` computes `Date.now() + ttl` and stores it in `CacheEntry.ttl`. A `ttl` of `null` becomes `Infinity` (never expires) — so despite the `number | null` type, stored entries always hold a numeric timestamp, never `null`.
- **Two-layer expiration.** `get` lazily evicts on read when an entry is past its timestamp; a background `setInterval` (default 1 minute) runs `purge()` to sweep expired entries proactively. The interval is created lazily on first `useMemoryCache()` call and is `unref`'d in `createPurgeInterval()`, so it never keeps the process alive (a one-shot script/CLI that touches the cache still exits naturally).
- **`set(key, undefined)` is delete** — passing `undefined` as the value removes the key (used as an invalidation idiom in the README/tests). Default TTL is 5 minutes when the factory is given no `ttl`.
- `__cacheStorage` is returned as an intentional, `@ts-expect-error`-hidden escape hatch used only by tests to assert on the raw `Map`.

## Build & release flow

- `scripts/build.ts` uses `Bun.build` with `bun-plugin-dts` to emit `dist/index.mjs` + `dist/index.d.ts`. Output is **ESM-only** — `package.json` `exports` expose only `import`/`types`, no CommonJS build.
- Source uses the `@/*` -> `./src/*` path alias (see `tsconfig.json`); tests import via `@/index`.
- Pushing a `v*` tag triggers `.github/workflows/release.yml` (generates the GitHub release + changelog via `changelogithub`); publishing that GitHub release triggers `.github/workflows/publish.yml` (`bun publish` to npm). `bun run release` is the local step that produces the tag.
- A weekly workflow runs `bun update` and opens a dependency-bump PR.
