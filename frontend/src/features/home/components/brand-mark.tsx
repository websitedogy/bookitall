export function BrandMark() {
  return (
    <section className="relative mt-2 h-52 overflow-hidden bg-white [clip-path:inset(0)] sm:h-60 md:h-64 lg:h-72" aria-label="Book It All">
      <img
        src="/brand/footer-doodle.svg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute bottom-4 left-[5%] max-w-[58%] md:bottom-6">
        <p className="text-[clamp(1.7rem,3.4vw,3rem)] font-extrabold italic leading-[0.9] tracking-tight text-[#7D8BA6]">
          BOOK it all
        </p>
        <p className="mt-2 text-xs font-semibold text-[#6B7A99] md:mt-2.5 md:text-sm">🇮🇳 Made for India</p>
        <p className="mt-0.5 text-xs font-semibold text-[#6B7A99] md:text-sm">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
