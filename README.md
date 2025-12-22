# Memory Cache

<p>
  <a href="https://bun.sh">
    <img
      alt="bun.sh"
      src="https://img.shields.io/badge/Bun-%23000000.svg?style=flat-square&logo=bun&logoColor=white"
    ></a>
  <a href="./LICENSE">
    <img
      alt="GitHub"
      src="https://img.shields.io/github/license/acfatah/memory-cache?style=flat-square"
    ></a>
  <a href="https://www.npmjs.com/package/@acfatah/memory-cache">
    <img
      alt="NPM Version"
      src="https://img.shields.io/npm/v/%40acfatah%2Fmemory-cache"
    ></a>
  <a href="https://github.com/acfatah/memory-cache/commits/main">
    <img
      alt="GitHub last commit (by committer)"
      src="https://img.shields.io/github/last-commit/acfatah/memory-cache?display_timestamp=committer&style=flat-square"
    ></a>
  <a href="https://qlty.sh/gh/acfatah/projects/memory-cache">
    <img
      src="https://qlty.sh/gh/acfatah/projects/memory-cache/maintainability.svg"
      alt="Maintainability"
    ></a>
  <a href="https://qlty.sh/gh/acfatah/projects/memory-cache">
    <img
      src="https://qlty.sh/gh/acfatah/projects/memory-cache/coverage.svg"
      alt="Code Coverage"
      ></a>
</p>

A simple in-memory cache for bun and nodejs.

## Features

- No dependencies.
- Uses [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instead of plain object.
- Purges expired cache in an interval.
- Optional cache schema type inference.

## Usage

```typescript
import { useMemoryCache } from '@acfatah/memory-cache'

const { set, get, remove, keys, clear } = useMemoryCache({
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

// clear all cache
clear()
```

By default, the purge interval is set to 1 minute. To change it, use the `setPurgeTimeout` method. Note that this will affect all caches globally.

To cache schema type inference,

```typescript
const { get, set, keys } = useMemoryCache<{
  'cache-key-1': number
  'cache-key-2': string
  'cache-key-3': { foo: string }
}>()
```

`get` method will infer all available keys and their types based on the cache schema.
