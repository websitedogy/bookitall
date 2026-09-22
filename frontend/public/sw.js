const CACHE = "bookitall-shell-v4";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon.svg"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return cached || Response.error();
    }),
  );
});

self.addEventListener("push", (event) => {
  event.waitUntil(showVendorPush(event));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(openOrderScreen(url));
});

async function showVendorPush(event) {
  let data = {
    title: "Book It All",
    body: "Open Book It All",
    url: "/",
    tag: "bookitall",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload may be empty
  }
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: "vendor-order", ...data }));
  const visible = windows.some((client) => client.visibilityState === "visible");
  if (visible) return;
  await self.registration.showNotification(data.title || "Book It All", {
    body: data.body || "Open Book It All",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: data.url || "/" },
    tag: data.tag || "bookitall",
    renotify: true,
    requireInteraction: true,
    vibrate: [220, 80, 220, 80, 320],
    silent: false,
  });
}

async function openOrderScreen(url) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) {
    if ("focus" in client) {
      await client.focus();
      if ("navigate" in client) {
        try {
          await client.navigate(url);
        } catch {
          // keep the focused window
        }
      }
      return;
    }
  }
  await self.clients.openWindow(url);
}
