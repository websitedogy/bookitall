type LeafletNs = {
  map: (
    el: HTMLElement,
    opts: { zoomControl?: boolean; attributionControl?: boolean },
  ) => LeafletMap;
  tileLayer: (url: string, opts: { attribution?: string; maxZoom?: number }) => { addTo: (map: LeafletMap) => void };
  marker: (latlng: [number, number], opts?: { icon?: unknown; interactive?: boolean; keyboard?: boolean }) => LeafletMarker;
  divIcon: (opts: { className?: string; html?: string; iconSize?: [number, number]; iconAnchor?: [number, number] }) => unknown;
  polyline: (latlngs: [number, number][], opts?: { color?: string; weight?: number; opacity?: number; dashArray?: string }) => LeafletPolyline;
  latLngBounds: (points: [number, number][]) => unknown;
};

export type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => LeafletMarker;
  remove: () => void;
};

export type LeafletPolyline = {
  addTo: (map: LeafletMap) => LeafletPolyline;
  remove: () => void;
};

export type LeafletMap = {
  setView: (latlng: [number, number], zoom?: number) => LeafletMap;
  getCenter: () => { lat: number; lng: number };
  on: (event: string, fn: () => void) => void;
  off: (event: string, fn?: () => void) => void;
  fitBounds: (bounds: unknown, opts?: { padding?: [number, number]; maxZoom?: number }) => LeafletMap;
  remove: () => void;
  invalidateSize: () => void;
};

const CSS_ID = "bookitall-leaflet-css";
const JS_ID = "bookitall-leaflet-js";

function loadCss(href: string, id: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string, id: string) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    return existing.dataset.ready === "1"
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
        });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.ready = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });
}

export async function loadLeaflet(): Promise<LeafletNs> {
  const current = (window as Window & { L?: LeafletNs }).L;
  if (current?.map) return current;
  loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", CSS_ID);
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", JS_ID);
  const L = (window as Window & { L?: LeafletNs }).L;
  if (!L?.map) throw new Error("Leaflet failed to load");
  return L;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function mapPinHtml(label: string) {
  return `<div class="bia-map-pin"><div class="bia-map-pin-label">${escapeHtml(label)}</div><div class="bia-map-pin-head"><span class="bia-map-pin-dot"></span></div><div class="bia-map-pin-stem"></div></div>`;
}

export async function placeLeafletPin(
  map: LeafletMap,
  marker: LeafletMarker | null,
  lat: number,
  lng: number,
  label: string,
): Promise<LeafletMarker> {
  const L = await loadLeaflet();
  const icon = L.divIcon({
    className: "bia-map-pin-wrap",
    html: mapPinHtml(label),
    iconSize: [36, 78],
    iconAnchor: [18, 78],
  });
  if (marker) {
    marker.setLatLng([lat, lng]);
    return marker;
  }
  return L.marker([lat, lng], { icon, interactive: false, keyboard: false }).addTo(map);
}
