/**
 * sw.js - Service Worker for offline-first caching
 */

const CACHE_NAME = 'lesen-schreiben-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/db.js',
    './js/canvas.js',
    './js/keyboard.js',
    './js/speech.js',
    './js/audio.js',
    './data/sentences.json'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching essential assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('Clearing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Cache-first with network fallback, and dynamically cache audio assets
self.addEventListener('fetch', (e) => {
    // Bypass service worker for audio files to prevent Range request issues
    if (e.request.url.endsWith('.mp3') || e.request.url.includes('/audio/')) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(e.request).then((networkResponse) => {
                // If it's a success response, we can dynamically cache it (useful for dynamically loaded MP3s)
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback / offline handling
                console.log('Network request failed, resource not cached:', e.request.url);
            });
        })
    );
});
