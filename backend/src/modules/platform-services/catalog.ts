export type ServiceSeed = {
  slug: string;
  name: string;
  icon: string;
};

export const DISABLED_SERVICE_SLUGS = new Set(['cabs', 'jobs', 'cloud-kitchen']);

export const PLATFORM_SERVICE_CATALOG: ServiceSeed[] = [
  { slug: 'hotels', name: 'Hotels', icon: '/categories/hotels.webp' },
  { slug: 'tours', name: 'Tours', icon: '/categories/tours.webp' },
  { slug: 'cabs', name: 'Cab booking', icon: '/categories/cabs.webp' },
  { slug: 'electrician', name: 'Electrician', icon: '/categories/electrician.webp' },
  { slug: 'plumber', name: 'Plumber', icon: '/categories/plumber.webp' },
  { slug: 'ac', name: 'AC', icon: '/categories/ac.webp' },
  { slug: 'cleaning', name: 'Cleaning', icon: '/categories/cleaning.webp' },
  { slug: 'jobs', name: 'Jobs', icon: '/categories/jobs.webp' },
  { slug: 'beautician', name: 'Beauty', icon: '/categories/beautician.webp' },
  { slug: 'painting', name: 'Painting', icon: '/categories/painting.webp' },
  { slug: 'carpenter', name: 'Carpenter', icon: '/categories/carpenter.webp' },
  { slug: 'appliance', name: 'Appliance', icon: '/categories/appliance.webp' },
  { slug: 'public-transport', name: 'Cabs', icon: '/categories/cabs.webp' },
  { slug: 'goods-transport', name: 'Goods Transport', icon: '/categories/goods-transport.svg' },
  { slug: 'packers-movers', name: 'Packers & Movers', icon: '/categories/packers-movers.svg' },
  { slug: 'cloud-kitchen', name: 'Local Market', icon: '/categories/cloud-kitchen.svg' },
];
