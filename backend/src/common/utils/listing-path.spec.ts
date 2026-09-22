import { vendorListingCanonicalPath } from './listing-path';

describe('vendorListingCanonicalPath', () => {
  it('builds Hyderabad home-service URLs with the listing id', () => {
    expect(
      vendorListingCanonicalPath({
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Sri Electricals',
        category: 'electrician',
        fields: { city: 'Hyderabad' },
      }),
    ).toBe('/electrician/hyderabad/sri-electricals-11111111-1111-4111-8111-111111111111');
  });

  it('scopes hotels to city and keeps tours/cabs unscoped', () => {
    expect(
      vendorListingCanonicalPath({
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Parkview Stay',
        category: 'hotels',
        fields: { city: 'Hyderabad' },
      }),
    ).toBe('/hotels/hyderabad/parkview-stay-22222222-2222-4222-8222-222222222222');
    expect(
      vendorListingCanonicalPath({
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Tirupati Weekend',
        category: 'tours',
      }),
    ).toBe('/tours/tirupati-weekend-33333333-3333-4333-8333-333333333333');
  });
});
