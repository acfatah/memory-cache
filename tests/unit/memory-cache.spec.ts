import { beforeEach, describe, expect, it } from 'bun:test'
import { useMemoryCache } from '@/index'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('cache', () => {
  beforeEach(() => {
    const cacheStorage = useMemoryCache()

    cacheStorage.clear()
  })

  it('should be able to add an item to the cache', () => {
    const cache = useMemoryCache()

    cache.set('cache-key', 42)
  })

  it('should be able to get an item from the cache', () => {
    const { get, set } = useMemoryCache<{
      'cache-key-1': number
      'cache-key-2': string
      'cache-key-3': { foo: string }
    }>()

    set('cache-key-1', 3)
    set('cache-key-2', 'foo bar')
    set('cache-key-3', { foo: 'bar' })

    const value1 = get('cache-key-1')
    expect(value1).toEqual(3)

    const value2 = get('cache-key-2')
    expect(value2).toEqual('foo bar')

    const value3 = get('cache-key-3')
    expect(value3).toEqual({ foo: 'bar' })
  })

  it('should respect the default expiration for the cache', async () => {
    const { set, get } = useMemoryCache<{ 'cache-key': string }>({ ttl: 2000 })
    set('cache-key', 'foo bar')

    // prove that we recorded the value and its accessible immediately after setting
    const value = get('cache-key')
    expect(value).toEqual('foo bar')

    // prove that the value is still accessible after 1 seconds, since default ttl is 2 seconds
    await sleep(1 * 1000)
    const valueAfterOneSec = get('cache-key')
    expect(valueAfterOneSec).toEqual('foo bar') // still should say foo bar

    // and prove that after more than seconds, the status is no longer in the cache
    await sleep(1 * 1500) // sleep till expire
    const valueAfterThreeSec = get('cache-key')
    expect(valueAfterThreeSec).toBeUndefined() // no longer defined, since the default seconds until expiration was 2
  })

  it('should respect the item level expiration for the cache', async () => {
    const { set, get } = useMemoryCache<{ 'cache-key': string }>() // remember, default expiration is greater than 2 seconds
    set('cache-key', 'foo bar', { ttl: 2000 })

    // prove that we recorded the value and its accessible immediately after setting
    const value = get('cache-key')
    expect(value).toEqual('foo bar')

    // prove that the value is still accessible after 1 seconds, since default ttl is 2 seconds
    await sleep(1 * 1000)
    const valueAfterThreeSec = get('cache-key')
    expect(valueAfterThreeSec).toEqual('foo bar') // still should say foo bar

    // and prove that after a total of 2 seconds, the state is no longer in the cache
    await sleep(2 * 1500) // sleep till expire
    const valueAfterFiveSec = get('cache-key')
    expect(valueAfterFiveSec).toBeUndefined() // no longer defined, since the item level seconds until expiration was 2
  })

  it('should consider secondsUntilExpiration of null as never expiring', async () => {
    const { set, get } = useMemoryCache<{ 'cache-key': string }>({
      ttl: 0, // expire immediately
    })

    // prove that setting something to the cache with default state will have it expired immediately
    set('cache-key', 'foo bar')
    const value = get('cache-key')
    expect(value).toBeUndefined()

    // prove that if we record the memory with expires-at Infinity, it persists
    set('cache-key', 'foo bar', {
      ttl: null,
    })

    const elephantMemory = get('cache-key')
    expect(elephantMemory).toEqual('foo bar')
  })

  it('should accurately get keys', () => {
    // create the cache
    const { set, keys } = useMemoryCache<{
      'cache-key-1': number
      'cache-key-2': string
      'cache-key-3': { foo: string }
    }>()

    // check key is added when value is set
    set('cache-key-1', '42')
    const keys1 = keys()

    expect(keys1.length).toEqual(1)
    expect(keys1[0]).toEqual('cache-key-1')

    // check that there are no duplicates when key value is updated
    set('cache-key-1', '42.0')
    const keys2 = keys()
    expect(keys2.length).toEqual(1)
    expect(keys2[0]).toEqual('cache-key-1')

    // check that multiple keys can be set
    set('cache-key-2', 'foo bar')
    const keys3 = keys()
    expect(keys3.length).toEqual(2)
    expect(keys3[1]).toEqual('cache-key-2')

    // check that invalidation removes the key
    set('cache-key-1', undefined)
    const keys4 = keys()
    expect(keys4.length).toEqual(1)
    expect(keys4[0]).toEqual('cache-key-2')

    // check that null ttl does not remove the key
    set('cache-key-3', 'foo bar', {
      ttl: null,
    })
    const keys5 = keys()
    expect(keys5.length).toEqual(2)
    expect(keys5[1]).toEqual('cache-key-3')
  })

  it('should remove an item from the cache', () => {
    const { set, get, remove } = useMemoryCache<{ 'cache-key': string }>()

    // Set a value in the cache
    set('cache-key', 'foo bar')
    const value = get('cache-key')
    expect(value).toEqual('foo bar')

    // Remove the value from the cache
    remove('cache-key')
    expect(get('cache-key')).toBeUndefined()
  })

  it('should purge all items from the cache', async () => {
    const { set, get, purge } = useMemoryCache<{
      'cache-key-1': string
      'cache-key-2': number
      'cache-key-3': number
      'cache-key-4': string
    }>()

    // Set multiple values in the cache
    set('cache-key-1', 'value1')
    set('cache-key-2', 2, { ttl: 1000 })
    set('cache-key-3', 3, { ttl: null })
    set('cache-key-4', 'value4', { ttl: Infinity })

    let value1 = get('cache-key-1')
    expect(value1).toEqual('value1')

    await sleep(2 * 1000)

    // Purge the expired items from the cache
    purge()

    value1 = get('cache-key-1')
    expect(value1).toBe('value1')

    const value2 = get('cache-key-2')
    expect(value2).toBeUndefined()

    const value3 = get('cache-key-3')
    expect(value3).toBe(3)

    const value4 = get('cache-key-4')
    expect(value4).toBe('value4')
  })

  it('should call purge method in set intervals', async () => {
    const {
      set,
      setPurgeTimeout,

      // @ts-expect-error return Map object
      __cacheStorage: cacheStorage,
    } = useMemoryCache({
      ttl: 500,
    })

    setPurgeTimeout(1000)

    // Set an item in the cache to ensure there's something to purge
    set('cache-key', 'test-value')
    set('cache-key-2', 'value2', { ttl: 600 })

    // Fast-forward time to simulate the purge interval
    await sleep(1000)

    expect(cacheStorage.size).toBe(0)
  })
})
