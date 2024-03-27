'use strict'

/* global self, caches */

const GHPATH = '/pwa-example'
const APP_PREFIX = 'pwae_'
const VERSION = '1'
const URLS = [
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/style.css`,
  `${GHPATH}/icons8-merge-git-64.png`,
  `${GHPATH}/icons8-merge-git-144.png`,
  `${GHPATH}/script.js`
]

const CACHE_NAME = APP_PREFIX + VERSION
self.addEventListener('fetch', function (e) {
  console.log('Fetch request : ' + e.request.url)
  e.respondWith(
    caches.match(e.request).then(function (request) {
      if (request) {
        console.log('Responding with cache : ' + e.request.url)
        return request
      } else {
        console.log('File is not cached, fetching : ' + e.request.url)
        return fetch(e.request)
      }
    })
  )
})

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('Installing cache : ' + CACHE_NAME)
      return cache.addAll(URLS)
    })
  )
})

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      const cacheWhitelist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX)
      })
      cacheWhitelist.push(CACHE_NAME)
      return Promise.allSettled(keyList.map(function (key, i) {
        if (cacheWhitelist.indexOf(key) === -1) {
          console.log('Deleting cache : ' + keyList[i])
          return caches.delete(keyList[i])
        }
      }))
    })
  )
})
