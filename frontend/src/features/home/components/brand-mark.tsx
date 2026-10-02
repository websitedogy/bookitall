export function BrandMark() {
  return (
    <section className="relative mt-2 aspect-[21/8] min-h-[15rem] overflow-hidden bg-white md:min-h-[18rem]" aria-label="Book It All">
      <div
        className="pointer-events-none absolute inset-0 bg-[length:100%_auto] bg-center bg-no-repeat"
        aria-hidden
        style={{ backgroundImage: "url(/brand/footer-doodle.svg?v=4)" }}
      />
      <div className="relative flex h-full min-h-[15rem] flex-col justify-end px-6 pb-24 pt-8 md:min-h-[18rem] md:px-10 md:pb-8">
        <p className="text-[2.65rem] font-extrabold italic leading-none tracking-tight text-slate-500 md:text-6xl">
          BOOK it all
        </p>
        <p className="mt-4 text-[13px] font-medium text-slate-500 md:text-sm">🇮🇳 Made for India</p>
        <p className="mt-1 text-[13px] font-medium text-slate-500 md:text-sm">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
