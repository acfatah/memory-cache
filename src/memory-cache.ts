export type CacheDuration = number | null

const FIVE_MINUTES = 300000 as const

export interface MemoryCache {
  get: (key: string) => unknown
  set: (
    key: string,
    value: unknown,
    options?: { ttl?: CacheDuration },
  ) => void
  keys: () => string[]
  remove: (key: string) => void
  clear: () => void
  purge: () => void
}

export interface CacheEntry {
  value: unknown
  ttl: CacheDuration
}

export interface CacheOption {
  ttl?: CacheDuration
}

// In-memory cache object
const cacheStorage: Map<string, CacheEntry> = new Map()
const getTimeInMiliseconds = () => Date.now()

export function useMemoryCache({
  ttl: defaultExpiration = FIVE_MINUTES,
}: CacheOption = {}): MemoryCache {
  // define how to set an item into the cache
  function set(
    key: string,
    value: unknown,
    {
      ttl = defaultExpiration,
    }: { ttl?: CacheDuration } = {},
  ) {
    // handle cache invalidation
    if (value === undefined) {
      cacheStorage.delete(key)

      return
    }

    // Handle setting
    cacheStorage.set(key, {
      value,
      ttl: getTimeInMiliseconds() + (ttl ?? Infinity) as CacheDuration, // Infinity if null
    })
  }

  // Define how to get an item from the cache
  const get = (key: string): unknown => {
    const cacheContent = cacheStorage.get(key)

    if (!cacheContent)
      return undefined // if not in cache, then undefined

    const { value, ttl } = cacheContent

    if (ttl && ttl <= getTimeInMiliseconds()) {
      // if expired, delete and return undefined
      cacheStorage.delete(key)

      return undefined
    }

    return value // Otherwise, its in the cache and not expired, so return the value
  }

  // Define how to grab all valid keys
  const keys = (): string[] => {
    const currentTime = getTimeInMiliseconds()
    const validKeys: string[] = []

    for (const [key, { ttl }] of cacheStorage.entries()) {
      if (ttl === null || ttl > currentTime) {
        validKeys.push(key)
      }
    }

    return validKeys
  }

  const remove = (key: string) => {
    cacheStorage.delete(key)
  }

  const clear = () => {
    cacheStorage.clear()
  }

  // Define how to purge expired items from the cache
  const purge = (): void => {
    const currentTime = getTimeInMiliseconds()
    for (const [key, { ttl }] of cacheStorage.entries()) {
      if (ttl === null || ttl <= currentTime) {
        cacheStorage.delete(key)
      }
    }
  }

  // return the api
  return { set, get, keys, remove, clear, purge }
}
