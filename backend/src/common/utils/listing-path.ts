import { slugify } from './slugify';

const CITY_BROWSE: Record<string, string> = {
  electrician: '/electrician/hyderabad',
  plumber: '/plumber/hyderabad',
  ac: '/ac-repair/hyderabad',
  cleaning: '/cleaning/hyderabad',
  beautician: '/beautician/hyderabad',
  painting: '/painting/hyderabad',
  carpenter: '/carpenter/hyderabad',
  appliance: '/appliance/hyderabad',
  jobs: '/jobs/hyderabad',
  'public-transport': '/public-transport/hyderabad',
  'goods-transport': '/goods-transport/hyderabad',
  'packers-movers': '/packers-movers/hyderabad',
  'cloud-kitchen': '/cloud-kitchen/hyderabad',
};

export function vendorListingSlug(title: string, id: string, category: string) {
  return `${slugify(title) || category}-${id}`;
}

export function vendorListingCitySlug(fields?: Record<string, string>) {
  return slugify(fields?.city || 'Hyderabad') || 'hyderabad';
}

export function vendorListingCanonicalPath(row: {
  id: string;
  title: string;
  category: string;
  fields?: Record<string, string>;
}) {
  const slug = vendorListingSlug(row.title, row.id, row.category);
  if (row.category === 'hotels') return `/hotels/${vendorListingCitySlug(row.fields)}/${slug}`;
  if (row.category === 'tours') return `/tours/${slug}`;
  if (row.category === 'cabs') return `/cabs/${slug}`;
  const browse = CITY_BROWSE[row.category] ?? `/${row.category}`;
  return `${browse}/${slug}`;
}
