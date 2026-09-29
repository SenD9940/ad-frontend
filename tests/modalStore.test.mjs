import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

// Use the project's TypeScript compiler so these tests also run on Node 20.
const source = readFileSync(new URL('../src/components/common/modalStore.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { createModalStore } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('queues messages and settles each confirmation only once', async () => {
  const store = createModalStore('page-a'), owner = Symbol()
  store.register(owner)
  const first = store.open(owner, 'page-a', 'confirm', { message: 'First' })
  const id = store.getSnapshot().id
  const second = store.open(owner, 'page-a', 'error', { message: 'Second' })
  assert.equal(store.getSnapshot().message, 'First')
  store.settle(id, true)
  assert.equal(await first, true)
  assert.equal(store.getSnapshot().message, 'Second')
  store.settle(id, true)
  assert.equal(store.getSnapshot().message, 'Second')
  store.settle(store.getSnapshot().id, false)
  assert.equal(await second, false)
  assert.equal(store.getSnapshot(), null)
})

test('caller unmount cancels its active and queued requests, preserving other callers', async () => {
  const store = createModalStore('page-a'), a = Symbol(), b = Symbol()
  const unregister = store.register(a)
  store.register(b)
  const first = store.open(a, 'page-a', 'confirm', { message: 'A' })
  const queued = store.open(a, 'page-a', 'info', { message: 'A queued' })
  const other = store.open(b, 'page-a', 'confirm', { message: 'B' })
  unregister()
  assert.equal(await first, false)
  assert.equal(await queued, false)
  assert.equal(store.getSnapshot().message, 'B')
  assert.equal(await store.open(a, 'page-a', 'error', { message: 'Late response' }), false)
  store.settle(store.getSnapshot().id, true)
  assert.equal(await other, true)
})

test('navigation cancels confirmations and rejects stale asynchronous responses', async () => {
  const store = createModalStore('page-a'), owner = Symbol()
  store.register(owner)
  const first = store.open(owner, 'page-a', 'confirm', { message: 'Write?' })
  const queued = store.open(owner, 'page-a', 'error', { message: 'Error' })
  store.setRoute('page-b')
  assert.equal(await first, false)
  assert.equal(await queued, false)
  assert.equal(await store.open(owner, 'page-a', 'error', { message: 'Late error' }), false)
  assert.equal(store.getSnapshot(), null)
  const next = store.open(owner, 'page-b', 'info', { message: 'New page' })
  assert.equal(store.getSnapshot().message, 'New page')
  store.settle(store.getSnapshot().id, true)
  assert.equal(await next, true)
})

test('provider cleanup settles all promises and supports effect re-registration', async () => {
  const store = createModalStore('page-a'), owner = Symbol()
  const unregister = store.register(owner)
  const pending = store.open(owner, 'page-a', 'confirm', { message: 'First mount' })
  store.clear(); unregister()
  assert.equal(await pending, false)
  store.register(owner)
  const next = store.open(owner, 'page-a', 'confirm', { message: 'Next mount' })
  store.settle(store.getSnapshot().id, true)
  assert.equal(await next, true)
})

test('subscribers are notified and snapshot identity remains stable between updates', async () => {
  const store = createModalStore('page-a'), owner = Symbol()
  let notifications = 0
  const unsubscribe = store.subscribe(() => notifications++)
  store.register(owner)
  const pending = store.open(owner, 'page-a', 'confirm', { message: 'Question' })
  const snapshot = store.getSnapshot()
  assert.equal(store.getSnapshot(), snapshot)
  assert.equal(notifications, 1)
  unsubscribe()
  store.settle(snapshot.id, false)
  await pending
  assert.equal(notifications, 1)
})

test('one acknowledgement clears identical simultaneous errors from different panels', async () => {
  const store = createModalStore('page-a'), a = Symbol(), b = Symbol()
  store.register(a); store.register(b)
  const first = store.open(a, 'page-a', 'error', { title: 'Products', message: 'Unavailable' })
  const second = store.open(b, 'page-a', 'error', { title: 'Performance', message: 'Unavailable' })
  const confirm = store.open(a, 'page-a', 'confirm', { message: 'Unavailable' })
  store.settle(store.getSnapshot().id, true)
  assert.equal(await first, true)
  assert.equal(await second, true)
  assert.equal(store.getSnapshot().variant, 'confirm')
  store.clear()
  assert.equal(await confirm, false)
})

test('clearing one resource error keeps another caller error and allows the next retry', async () => {
  const store = createModalStore('page-a'), a = Symbol(), b = Symbol()
  store.register(a); store.register(b)
  const first = store.open(a, 'page-a', 'error', { message: 'Unavailable' })
  const second = store.open(b, 'page-a', 'error', { message: 'Unavailable' })
  store.cancelOwner(a)
  assert.equal(await first, false)
  assert.equal(store.getSnapshot().owner, b)
  store.settle(store.getSnapshot().id, false)
  assert.equal(await second, false)
  const retry = store.open(a, 'page-a', 'error', { message: 'Unavailable' })
  assert.equal(store.getSnapshot().owner, a)
  store.settle(store.getSnapshot().id, true)
  assert.equal(await retry, true)
})
