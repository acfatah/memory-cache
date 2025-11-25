/// <reference lib="dom" />

import { expect, test } from '@playwright/test'

const cacheHarnessPath = '/memory-cache.html'

interface CacheHarnessApi {
  reset: () => void
  setAndGet: () => { keys: Array<string>, value: unknown }
  multiTypeGet: () => {
    value1: unknown
    value2: unknown
    value3: unknown
  }
  defaultTtlCheck: () => Promise<{
    immediate: unknown
    beforeExpiry: unknown
    afterExpiry: unknown
  }>
  entryLevelTtlCheck: () => Promise<{
    immediate: unknown
    beforeExpiry: unknown
    expired: unknown
    persistent: unknown
  }>
  neverExpireFlow: () => {
    expiredImmediately: unknown
    persistent: unknown
  }
  keysFlow: () => {
    keys1: Array<string>
    keys2: Array<string>
    keys3: Array<string>
    keys4: Array<string>
    keys5: Array<string>
  }
  removeFlow: () => {
    beforeRemove: unknown
    afterRemove: unknown
  }
  purgeFlow: () => Promise<{
    value1: unknown
    value2: unknown
    value3: unknown
    value4: unknown
  }>
  purgeIntervalFlow: () => Promise<{ size: number }>
}

test.beforeEach(async ({ page }) => {
  await page.goto(cacheHarnessPath)
  await page.waitForFunction(() => (window as unknown as { cacheTest?: CacheHarnessApi }).cacheTest !== undefined)
  await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.reset())
})

test('sets and gets values through the built bundle', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.setAndGet())

  expect(result.value).toBe('value-42')
  expect(result.keys).toEqual(['cache-key'])
})

test('gets multiple data types from the cache', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.multiTypeGet())

  expect(result.value1).toBe(3)
  expect(result.value2).toBe('foo bar')
  expect(result.value3).toEqual({ foo: 'bar' })
})

test('respects the default TTL in browsers', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.defaultTtlCheck())

  expect(result.immediate).toBe('short-lived')
  expect(result.beforeExpiry).toBe('short-lived')
  expect(result.afterExpiry).toBeUndefined()
})

test('respects entry-level TTL overrides', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.entryLevelTtlCheck())

  expect(result.immediate).toBe('short-lived')
  expect(result.beforeExpiry).toBe('short-lived')
  expect(result.expired).toBeUndefined()
  expect(result.persistent).toBe('long-lived')
})

test('honors null TTL overrides as never expiring', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.neverExpireFlow())

  expect(result.expiredImmediately).toBeUndefined()
  expect(result.persistent).toBe('foo bar')
})

test('accurately tracks keys through lifecycle changes', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.keysFlow())

  expect(result.keys1).toEqual(['cache-key-1'])
  expect(result.keys2).toEqual(['cache-key-1'])
  expect(result.keys3).toEqual(['cache-key-1', 'cache-key-2'])
  expect(result.keys4).toEqual(['cache-key-2'])
  expect(result.keys5).toEqual(['cache-key-2', 'cache-key-3'])
})

test('removes entries explicitly', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.removeFlow())

  expect(result.beforeRemove).toBe('foo bar')
  expect(result.afterRemove).toBeUndefined()
})

test('purge removes only expired keys', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.purgeFlow())

  expect(result.value1).toBe('value1')
  expect(result.value2).toBeUndefined()
  expect(result.value3).toBe(3)
  expect(result.value4).toBe('value4')
})

test('purge interval clears the shared cache map automatically', async ({ page }) => {
  const result = await page.evaluate(() => (window as unknown as { cacheTest: CacheHarnessApi }).cacheTest.purgeIntervalFlow())

  expect(result.size).toBe(0)
})
