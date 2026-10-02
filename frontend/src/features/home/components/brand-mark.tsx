export function BrandMark() {
  return (
    <section className="relative mt-2 min-h-[28rem] overflow-hidden bg-white md:min-h-[34rem]" aria-label="Book It All">
      <div
        className="pointer-events-none absolute inset-0 bg-[length:1680px_auto] bg-center bg-no-repeat md:bg-cover"
        aria-hidden
        style={{ backgroundImage: "url(/brand/footer-doodle.svg?v=3)" }}
      />
      <div className="relative flex min-h-[28rem] flex-col justify-end px-6 pb-28 pt-16 md:min-h-[34rem] md:px-10 md:pb-12">
        <p className="text-[2.65rem] font-extrabold italic leading-none tracking-tight text-slate-500 md:text-6xl">
          BOOK it all
        </p>
        <p className="mt-4 text-[13px] font-medium text-slate-500 md:text-sm">🇮🇳 Made for India</p>
        <p className="mt-1 text-[13px] font-medium text-slate-500 md:text-sm">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
