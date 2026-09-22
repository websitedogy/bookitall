const COMING_SOON_ART = new Set([
  "hotels",
  "tours",
  "cabs",
  "electrician",
  "plumber",
  "ac",
  "cleaning",
  "jobs",
  "beautician",
  "painting",
  "carpenter",
  "appliance",
  "public-transport",
  "goods-transport",
  "packers-movers",
  "cloud-kitchen",
]);

export function comingSoonArt(category?: string) {
  const id = category && COMING_SOON_ART.has(category) ? category : "default";
  return `/coming-soon/${id}.png`;
}

export function ComingSoonServices({ category }: { category?: string }) {
  return (
    <div className="flex min-h-[min(28rem,62vh)] flex-col items-center justify-center px-5 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={comingSoonArt(category)}
        alt=""
        className="coming-soon-bob h-auto w-full max-w-[34rem] rounded-3xl object-cover shadow-[0_18px_40px_-28px_rgba(18,36,31,0.45)]"
      />
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Coming soon</p>
      <p className="mt-2 text-[17px] font-semibold tracking-tight text-[var(--studio-ink)]">Services not available</p>
    </div>
  );
}
