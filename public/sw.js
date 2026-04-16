// Be The Change — Service Worker
// Handles push notifications and offline caching

const CACHE_NAME = 'btc-v1'
const STATIC_ASSETS = ['/', '/login', '/signup']

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    // Always network for API calls
    return
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Push notifications
self.addEventListener('push', event => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Be The Change', body: event.data?.text() }
  }

  const options = {
    body: data.body || 'New action available',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'view', title: '📋 View Issue' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: data.urgent || false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Be The Change', options)
  )
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
