export function BrandMark() {
  return (
    <section className="relative mt-2 h-52 overflow-hidden bg-[#F7F8FA] sm:h-60 md:h-64 lg:h-72" aria-label="Book It All">
      <img
        src="/brand/footer-doodle-art.jpg?v=1"
        alt=""
        className="pointer-events-none absolute left-1/2 top-1/2 h-[175%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-fill opacity-80 md:h-[148%] md:w-[94%]"
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
