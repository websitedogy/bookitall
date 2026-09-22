export function BrandMark() {
  return (
    <section className="relative mt-1 min-h-[12rem] overflow-hidden md:min-h-[14rem]" aria-label="Book It All">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: "url(/brand/footer-doodle.svg)",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
          backgroundSize: "920px 368px",
          opacity: 0.42,
        }}
      />
      <div className="relative flex min-h-[12rem] flex-col justify-center px-6 py-8 md:min-h-[14rem] md:px-8">
        <p className="text-3xl font-extrabold italic leading-none tracking-tight text-slate-500 md:text-4xl">
          BOOK it all
        </p>
        <p className="mt-3 text-[13px] font-medium text-slate-500">🇮🇳 Made for India</p>
        <p className="mt-1 text-[13px] font-medium text-slate-500">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
