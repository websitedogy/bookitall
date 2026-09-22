import { ServiceGrid } from "./components/service-grid";
import { HeroBanners } from "./components/hero-banners";
import { BrandMark } from "./components/brand-mark";

export function HomePage() {
  return (
    <div className="mx-auto max-w-6xl bg-white">
      <h1 className="sr-only">Book It All</h1>
      <HeroBanners />
      <ServiceGrid />
      <BrandMark />
    </div>
  );
}
