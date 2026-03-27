const CACHE_NAME = 'sajha-v3';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './lang.js',
    './login.html',
    './club.html',
    './club.js',
    './driver.html',
    './driver.js',
    './owner.html',
    './owner.js',
    './manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install: cache all static assets
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(err => console.warn('Cache partial fail:', err)))
    );
});

// Activate: remove old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    // Network-first for external APIs (weather, openstreetmap tiles)
    if (url.hostname.includes('open-meteo') || url.hostname.includes('openstreetmap') || url.hostname.includes('pravatar')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
        return;
    }
    
    // Cache-first for everything else (static assets, fonts, icons)
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request).then(networkRes => {
            // Cache successful responses for static assets
            if (networkRes.ok && e.request.method === 'GET') {
                const respClone = networkRes.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, respClone));
            }
            return networkRes;
        }))
    );
});
