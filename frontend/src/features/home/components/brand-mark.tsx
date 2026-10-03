export function BrandMark() {
  return (
    <section className="relative mt-2 aspect-video overflow-hidden bg-[#F7F8FA]" aria-label="Book It All">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        aria-hidden
        style={{ backgroundImage: "url(/brand/footer-doodle.svg?v=7)" }}
      />
      <div className="relative flex h-full flex-col justify-end px-6 pb-[11%] pt-8 md:px-14 md:pb-[13%]">
        <p className="text-[clamp(2.5rem,6.4vw,5.6rem)] font-extrabold italic leading-none tracking-tight text-[#6B7A99]/85">
          BOOK it all
        </p>
        <p className="mt-3 text-[13px] font-medium text-[#6B7A99]/80 md:mt-4 md:text-sm">🇮🇳 Made for India</p>
        <p className="mt-1 text-[13px] font-medium text-[#6B7A99]/80 md:text-sm">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
