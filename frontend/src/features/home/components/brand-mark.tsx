export function BrandMark() {
  return (
    <section className="relative mt-2 aspect-[1400/1220] overflow-hidden bg-[#F7F8FA]" aria-label="Book It All">
      <div
        className="pointer-events-none absolute inset-0 bg-[length:100%_100%] bg-center bg-no-repeat"
        aria-hidden
        style={{ backgroundImage: "url(/brand/footer-doodle.svg?v=8)" }}
      />
      <div className="absolute left-[4%] top-[46%] max-w-[58%]">
        <p className="text-[clamp(2.7rem,6.6vw,6rem)] font-extrabold italic leading-[0.9] tracking-tight text-[#7D8BA6]">
          BOOK it all
        </p>
        <p className="mt-4 text-[clamp(0.9rem,1.6vw,1.2rem)] font-semibold text-[#6B7A99]">🇮🇳 Made for India</p>
        <p className="mt-1.5 text-[clamp(0.9rem,1.6vw,1.2rem)] font-semibold text-[#6B7A99]">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
