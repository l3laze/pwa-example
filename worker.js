'use strict'

/* global self, clients, caches, location */

const VERSION = 'v1'
const CACHE_NAME = `pwaexample-${VERSION}`

// Those are all the resources our app needs to work.
// We'll cache them on install.
const INITIAL_CACHED_RESOURCES = [
  './',
  './index.html',
  './style.css',
  './script.js'
]

// Add a cache-busting query string to the pre-cached resources.
// This is to avoid loading these resources from the disk cache.
const INITIAL_CACHED_RESOURCES_WITH_VERSIONS = INITIAL_CACHED_RESOURCES.map(path => {
  return `${path}?v=${VERSION}`
})

self.addEventListener('install', event => {
  self.skipWaiting()

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)

    cache.addAll(INITIAL_CACHED_RESOURCES_WITH_VERSIONS)
  })())
})

// Activate happens after install, either when the app is used for the
// first time, or when a new version of the SW was installed.
// We use the activate event to delete old caches and avoid running out of space.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = []

    for (const name of (await caches.keys())) {
      if (name !== CACHE_NAME) {
        console.log(`Deleting cache ${name}.`)

        await caches.delete(name)
      } else {
        console.log(`Keeping cache ${name}.`)

        names.push(name)
      }
    }

    await clients.claim()
  })())
})

// Main fetch handler.
// A cache-first strategy is used, with a fallback to the network.
// The static resources fetched here will not have the cache-busting query
// string. So we need to add it to match the cache.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (url.origin !== location.origin) {
    return
  }

  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const versionedUrl = `${event.request.url}?v=${VERSION}`
    const cachedResponse = await cache.match(versionedUrl)

    if (cachedResponse) {
      return cachedResponse
    } else {
      const fetchResponse = await fetch(versionedUrl)
      cache.put(versionedUrl, fetchResponse.clone())

      return fetchResponse
    }
  })())
})
