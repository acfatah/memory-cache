# Memory Cache

<p>
  <a href="https://bun.sh">
    <img alt="bun.sh" src="https://img.shields.io/badge/Bun-%23000000.svg?style=flat-square&logo=bun&logoColor=white">
  </a>
  <a href="https://github.com/antfu/eslint-config">
    <img alt="Code Style" src="https://antfu.me/badge-code-style.svg">
  </a>
  <a href="https://github.com/acfatah/memory-cache/commits/main">
    <img alt="GitHub last commit (by committer)" src="https://img.shields.io/github/last-commit/acfatah/memory-cache?display_timestamp=committer&style=flat-square">
  </a>
</p>

Simple global in-memory cache for Bun environment.

## Features

- No dependencies.
- Uses [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instead of plain object.
- Purges expired cache in an interval.

## Usage

```typescript
import { useMemoryCache } from '@acfatah/memory-cache'

const { get, keys, remove, set } = useMemoryCache({
  // Default expiration value is 5 minutes if not provided.
  ttl: 15 * 60 * 1000
})

// ...

set('cache-key', value)
```

To set, get and remove cache,

```typescript
// Set custom expiration
set('cache-key', value, { ttl: 5 * 60 * 1000 })

// Set a value with no expiration
set('cache-key', value, { ttl: null })

// or
set('cache-key', value, { ttl: Infinity })

// get a cache value
const value = get('cache-key')

// remove a cache value
remove('cache-key')

// or
set('cache-key', undefined)

// list all available keys
keys()
```

By default, the purge interval is set to 1 minute. To change it, use the `setPurgeTimeout` method. Note that this will affect all caches globally.

To infer a type from a cache entry,

```typescript
// the value will have the type of `{ foo: string}` signature
const value = get<{ foo: 'bar'}>('cache-key')
```
