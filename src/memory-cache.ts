const ONE_MINUTES = 60000
const FIVE_MINUTES = 300000

export interface MemoryCache<CacheSchema extends Record<string, any> = Record<string, unknown>> {
  get: <K extends keyof CacheSchema>(key: K) => CacheSchema[K] | undefined
  set: (
    key: keyof CacheSchema,
    value: unknown,
    options?: {
      /** Duration in milliseconds. `null` or `Infinity` means no expiration */
      ttl?: number | null
    },
  ) => void
  keys: () => Array<keyof CacheSchema>
  remove: (key: keyof CacheSchema) => void
  clear: () => void
  purge: () => void
  setPurgeTimeout: (value: number) => void
}

export interface CacheEntry {
  value: unknown
  ttl: number | null
}

export interface CacheOption {
  ttl?: number | null
}

// In-memory cache object
const cacheStorage: Map<string | number | symbol, CacheEntry> = new Map()
const getTimeInMiliseconds = (): number => Date.now()
let purgeIntervalId: NodeJS.Timer | null = null
let purgeTimeout: number

function createPurgeInterval(): NodeJS.Timer {
  return setInterval(purge, purgeTimeout || ONE_MINUTES)
}

/**
 * Default interval is 1 minute
 */
function setPurgeTimeout(value: number): void {
  purgeTimeout = value

  if (purgeIntervalId) {
    clearInterval(purgeIntervalId)
    purgeIntervalId = createPurgeInterval()
  }
}

// Define how to purge expired items from the cache
function purge(): void {
  const currentTime = getTimeInMiliseconds()

  for (const [key, { ttl }] of cacheStorage.entries()) {
    if (ttl === null || ttl <= currentTime) {
      cacheStorage.delete(key)
    }
  }
}

export function useMemoryCache<CacheSchema extends Record<string, any> = Record<string, unknown>>({
  ttl: defaultExpiration = FIVE_MINUTES,
}: CacheOption = {}): MemoryCache<CacheSchema> {
  // define how to set an item into the cache
  function set(
    key: keyof CacheSchema,
    value: unknown,
    {
      ttl = defaultExpiration,
    }: { ttl?: number | null } = {},
  ): void {
    // handle cache invalidation
    if (value === undefined) {
      cacheStorage.delete(key)

      return
    }

    // Handle setting
    const entry: CacheEntry = {
      value,
      ttl: getTimeInMiliseconds() + (ttl ?? Infinity), // Infinity if null
    }

    cacheStorage.set(key, entry)
  }

  // Define how to get an item from the cache
  function get<K extends keyof CacheSchema>(key: K): CacheSchema[K] | undefined {
    const cacheContent = cacheStorage.get(key)

    if (!cacheContent)
      return undefined // if not in cache, then undefined

    const { value, ttl } = cacheContent

    if (ttl && ttl <= getTimeInMiliseconds()) {
      // if expired, delete and return undefined
      cacheStorage.delete(key)

      return undefined
    }

    return value as CacheSchema[K] // Otherwise, its in the cache and not expired, so return the value
  }

  // Define how to grab all valid keys
  function keys(): Array<keyof CacheSchema> {
    const currentTime = getTimeInMiliseconds()
    const validKeys: Array<keyof CacheSchema> = []

    for (const [key, { ttl }] of cacheStorage.entries()) {
      if (ttl === null || ttl > currentTime) {
        validKeys.push(key as keyof CacheSchema)
      }
    }

    return validKeys
  }

  function remove(key: keyof CacheSchema): void {
    cacheStorage.delete(key)
  }

  function clear(): void {
    cacheStorage.clear()
  }

  // Set up the purge interval only if it hasn't been set up already
  if (purgeIntervalId === null)
    purgeIntervalId = createPurgeInterval()

  // return the api
  return {
    set,
    get,
    keys,
    remove,
    clear,
    purge,
    setPurgeTimeout,

    // @ts-expect-error for internal use
    __cacheStorage: cacheStorage,
  }
}
