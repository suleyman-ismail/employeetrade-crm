// Employeetrade CRM – кешира интерфейса, за да се отваря веднага (данните идват от API-то)
// ⚠️ Flexi CRM е на същия адрес (suleyman-ismail.github.io) – трием САМО нашите стари кешове (et-crm-*)
const CACHE = 'et-crm-v30';
const SHELL = ['./', 'index.html', 'f.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('et-crm-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin || u.pathname.indexOf(new URL(self.registration.scope).pathname) !== 0) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});

// 🔔 Известия: празен „push“ → взимаме новите известия за този телефон
const API = 'https://script.google.com/macros/s/AKfycbw0FRgMaF2-h8xpuQqG92n4kL_uisbbduWT7FxWgJePem5aWlWkb4DvAKIhaGRrLr5VTw/exec';
function tok() {
  return new Promise(res => {
    try {
      // ⚠️ собствена база „et-crm“ – Flexi CRM е на същия адрес и има своя
      const q = indexedDB.open('et-crm', 1);
      q.onupgradeneeded = () => { const db = q.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); if (!db.objectStoreNames.contains('q')) db.createObjectStore('q', { autoIncrement: true }); };
      q.onsuccess = () => { try { const g = q.result.transaction('kv', 'readonly').objectStore('kv').get('token'); g.onsuccess = () => res(g.result || ''); g.onerror = () => res(''); } catch (e) { res(''); } };
      q.onerror = () => res('');
    } catch (e) { res(''); }
  });
}
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let items = [];
    try {
      const t = await tok(), s = await self.registration.pushManager.getSubscription();
      if (t) { const r = await fetch(API, { method: 'POST', body: JSON.stringify({ fn: 'getNotif', args: [s ? s.endpoint : ''], token: t }) }); const j = await r.json(); if (j && j.ok && Array.isArray(j.data)) items = j.data; }
    } catch (x) {}
    const o = { icon: 'icon-192.png', badge: 'icon-192.png' };
    if (!items.length) return self.registration.showNotification('ET CRM', Object.assign({ body: '🔔 Има промяна – отвори приложението', tag: 'crm' }, o));
    for (const n of items) await self.registration.showNotification(n.ti || 'ET CRM', Object.assign({ body: n.b || '', tag: n.i || 'crm', data: { c: n.c || '', k: n.k || '' } }, o));
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {}, sc = self.registration.scope;
  const url = sc + (d.k ? '?k=' + encodeURIComponent(d.k) : d.c ? '?c=' + encodeURIComponent(d.c) : '');
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if (c.url.indexOf(sc) === 0 && 'focus' in c) { c.postMessage({ crmOpen: d }); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
