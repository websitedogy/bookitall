export function isUsableCoord(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  if (Math.abs(lat - 17.385) < 1e-6 && Math.abs(lng - 78.4867) < 1e-6) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function attemptsFor(query: string) {
  const cleaned = query.replace(/\s+/g, ' ').trim();
  const noNear = cleaned.replace(/\s+near\b.+/i, '').trim();
  const words = noNear.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const attempts = [cleaned, noNear];
  for (let i = words.length; i >= 2; i -= 1) {
    attempts.push(words.slice(0, i).join(' '));
  }
  if (words.length) attempts.push(words[words.length - 1]);
  return [...new Set(attempts.filter((item) => item.length >= 4))];
}

async function nominatimOne(q: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'in');
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'BookItAll/1.0 (hello@bookitall.com)' },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const lat = Number(rows[0]?.lat);
  const lng = Number(rows[0]?.lon);
  return isUsableCoord(lat, lng) ? { lat, lng } : null;
}

export async function geocodeIndiaAddress(...parts: Array<string | undefined | null>) {
  const query = parts.filter((part) => Boolean(part && String(part).trim())).join(', ');
  if (query.length < 4) return null;
  for (const attempt of attemptsFor(query)) {
    const pin = await nominatimOne(attempt);
    if (pin) return pin;
  }
  return null;
}
