export type ServiceSeed = {
  slug: string;
  name: string;
  icon: string;
};

export const DISABLED_SERVICE_SLUGS = new Set(['cabs', 'jobs', 'cloud-kitchen']);

export const PLATFORM_SERVICE_CATALOG: ServiceSeed[] = [
  { slug: 'hotels', name: 'Hotels', icon: '/categories/hotels.png' },
  { slug: 'tours', name: 'Tours', icon: '/categories/tours.png' },
  { slug: 'cabs', name: 'Cab booking', icon: '/categories/cabs.png' },
  { slug: 'electrician', name: 'Electrician', icon: '/categories/electrician.png' },
  { slug: 'plumber', name: 'Plumber', icon: '/categories/plumber.png' },
  { slug: 'ac', name: 'AC', icon: '/categories/ac.png' },
  { slug: 'cleaning', name: 'Cleaning', icon: '/categories/cleaning.png' },
  { slug: 'jobs', name: 'Jobs', icon: '/categories/jobs.png' },
  { slug: 'beautician', name: 'Beauty', icon: '/categories/beautician.png' },
  { slug: 'painting', name: 'Painting', icon: '/categories/painting.png' },
  { slug: 'carpenter', name: 'Carpenter', icon: '/categories/carpenter.png' },
  { slug: 'appliance', name: 'Appliance', icon: '/categories/appliance.png' },
  { slug: 'public-transport', name: 'Cabs', icon: '/categories/cabs.png' },
  { slug: 'goods-transport', name: 'Goods Transport', icon: '/categories/goods-transport.svg' },
  { slug: 'packers-movers', name: 'Packers & Movers', icon: '/categories/packers-movers.svg' },
  { slug: 'cloud-kitchen', name: 'Local Market', icon: '/categories/cloud-kitchen.svg' },
];
