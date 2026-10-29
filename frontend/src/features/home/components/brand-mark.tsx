import Image from "next/image";

export function BrandMark() {
  return (
    <section className="mt-0 bg-white" aria-label="Book It All">
      <Image
        src="/brand/bookitall-banner.png"
        alt="Book It All — Made for better everyday services"
        width={1774}
        height={757}
        sizes="100vw"
        className="mx-auto block h-auto w-full"
      />
    </section>
  );
}
