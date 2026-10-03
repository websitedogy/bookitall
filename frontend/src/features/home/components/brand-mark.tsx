export function BrandMark() {
  return (
    <section className="relative mt-2 aspect-square overflow-hidden bg-[#F7F8FA]" aria-label="Book It All">
      <img
        src="/brand/footer-doodle-art.jpg?v=1"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute left-[5%] top-[44%] max-w-[56%]">
        <p className="text-[clamp(2.7rem,6.6vw,6rem)] font-extrabold italic leading-[0.9] tracking-tight text-[#7D8BA6]">
          BOOK it all
        </p>
        <p className="mt-4 text-[clamp(0.9rem,1.6vw,1.2rem)] font-semibold text-[#6B7A99]">🇮🇳 Made for India</p>
        <p className="mt-1.5 text-[clamp(0.9rem,1.6vw,1.2rem)] font-semibold text-[#6B7A99]">❤️ Made in Telangana</p>
      </div>
    </section>
  );
}
