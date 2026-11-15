// Trajet : mode hors-ligne minimal (coquille de l'application)
const CACHE = "trajet-v2";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "intro-1.jpg", "intro-2.jpg", "intro-3.jpg"];
const CDN = "https://cdn.jsdelivr.net/";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // Les données (Supabase) ne sont jamais mises en cache
  if (u.origin !== self.location.origin && !r.url.startsWith(CDN)) return;
  // Pages : réseau d'abord, cache en secours (mises à jour visibles tout de suite)
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put("index.html", c)); return res; }).catch(() => caches.match("index.html")));
    return;
  }
  // Fichiers statiques : cache d'abord, rafraîchi en arrière-plan
  e.respondWith(caches.match(r).then((hit) => {
    const net = fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
