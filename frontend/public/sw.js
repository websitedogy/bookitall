const CACHE = "bookitall-shell-v5";
const OFFLINE_URL = "/offline.html";

let ringToken = 0;
let replacingNotice = false;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"])));
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
  ringToken += 1;
  event.notification.close();
  const url = event.notification.data?.url || "/vendors/my-orders";
  event.waitUntil(openOrderScreen(url));
});

self.addEventListener("notificationclose", () => {
  if (replacingNotice) return;
  ringToken += 1;
});

async function showVendorPush(event) {
  let data = {
    title: "Book It All",
    body: "Open Book It All",
    url: "/vendors/my-orders",
    tag: "bookitall",
    ring: false,
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload may be empty
  }

  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: "vendor-order", ...data }));

  if (appIsOpen(windows)) return;

  const token = ++ringToken;
  const rings = data.ring ? 10 : 1;
  for (let i = 0; i < rings; i += 1) {
    if (token !== ringToken) return;
    if (i > 0 && (await appIsOpenNow())) return;
    await notifyOnce(data);
    if (i < rings - 1) await wait(3000);
  }
}

function appIsOpen(windows) {
  return windows.some((client) => client.visibilityState === "visible" && client.focused !== false);
}

async function appIsOpenNow() {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  return appIsOpen(windows);
}

async function notifyOnce(data) {
  const title = data.title || "New order";
  const options = {
    body: data.body || "Open Book It All to accept the order",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/vendors/my-orders", ring: Boolean(data.ring) },
    tag: data.tag || "vendor-order",
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 150, 500, 150, 500, 150, 800],
    silent: false,
    timestamp: Date.now(),
  };
  replacingNotice = true;
  try {
    await self.registration.showNotification(title, options);
  } catch {
    delete options.renotify;
    await self.registration.showNotification(title, options);
  } finally {
    setTimeout(() => {
      replacingNotice = false;
    }, 500);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
