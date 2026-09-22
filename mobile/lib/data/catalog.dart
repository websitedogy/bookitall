import 'package:flutter/material.dart';

const cities = ['Hyderabad', 'Bengaluru', 'Goa', 'Chennai', 'Mumbai', 'Vijayawada'];

class VendorListing {
  const VendorListing({
    required this.name,
    required this.vendor,
    required this.location,
    required this.image,
  });

  final String name;
  final String vendor;
  final String location;
  final String image;
}

class ServiceItem {
  const ServiceItem({
    required this.id,
    required this.name,
    required this.route,
    required this.icon,
    required this.tint,
    required this.iconColor,
    required this.listings,
  });

  final String id;
  final String name;
  final String route;
  final IconData icon;
  final Color tint;
  final Color iconColor;
  final List<VendorListing> listings;
}

class BannerSlide {
  const BannerSlide({
    required this.id,
    required this.route,
    required this.kicker,
    required this.title,
    required this.text,
    required this.color,
    required this.image,
  });

  final String id;
  final String route;
  final String kicker;
  final String title;
  final String text;
  final Color color;
  final String image;
}

class CustomerAd {
  const CustomerAd({
    required this.id,
    required this.categoryId,
    required this.category,
    required this.title,
    required this.vendor,
    required this.location,
    required this.image,
    required this.route,
    this.status = '',
    this.distanceKm,
    this.priceLabel = '',
    this.photoUrls = const [],
    this.vehicleType = '',
    this.serviceType = '',
    this.loadCapacity = '',
  });

  final String id;
  final String categoryId;
  final String category;
  final String title;
  final String vendor;
  final String location;
  final String image;
  final String route;
  final String status;
  final double? distanceKm;
  final String priceLabel;
  final List<String> photoUrls;
  final String vehicleType;
  final String serviceType;
  final String loadCapacity;
}

String listingImage(String src, String serviceId) {
  if (src.startsWith('http')) {
    if (serviceId == 'hotels' || serviceId == 'tours' || serviceId == 'cabs') {
      return '/banners/$serviceId.jpg';
    }
    return '/categories/$serviceId.png';
  }
  return src;
}

const banners = [
  BannerSlide(
    id: 'hotels',
    route: '/hotels',
    kicker: 'Stays',
    title: 'Hotels & Resorts',
    text: 'Rooms you can actually trust.',
    color: Color(0xFF1B4F72),
    image: '/banners/hotels.png',
  ),
  BannerSlide(
    id: 'tours',
    route: '/tours',
    kicker: 'Travel',
    title: 'Tours & Packages',
    text: 'Pilgrimage to weekend getaways.',
    color: Color(0xFF6D5A8D),
    image: '/banners/tours.jpg',
  ),
  BannerSlide(
    id: 'cabs',
    route: '/cabs',
    kicker: 'Rides',
    title: 'Cabs & Rentals',
    text: 'Local, outstation, live tracking.',
    color: Color(0xFF16324A),
    image: '/banners/cabs.png',
  ),
  BannerSlide(
    id: 'home',
    route: '/home-services',
    kicker: 'Home',
    title: 'Experts near you',
    text: 'Electrician to carpenter, booked in minutes.',
    color: Color(0xFF2F6F4E),
    image: '/banners/home.jpg',
  ),
];

const services = [
  ServiceItem(
    id: 'hotels',
    name: 'Hotels',
    route: '/hotels',
    icon: Icons.apartment_outlined,
    tint: Color(0xFFE8F1F7),
    iconColor: Color(0xFF1B4F72),
    listings: [
      VendorListing(
        name: 'Banjara Courtyard — King room',
        vendor: 'Banjara Stays',
        location: 'Banjara Hills, Hyderabad',
        image: '/banners/hotels.png',
      ),
      VendorListing(
        name: 'HITEC Harbor — Executive stay',
        vendor: 'Harbor Hotels',
        location: 'Madhapur, Hyderabad',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Anjuna Tide Resort — Palm villa',
        vendor: 'Tide Resorts',
        location: 'Anjuna, Goa',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'tours',
    name: 'Tours',
    route: '/tours',
    icon: Icons.map_outlined,
    tint: Color(0xFFF1ECF7),
    iconColor: Color(0xFF6D5A8D),
    listings: [
      VendorListing(
        name: 'Tirupati darshan package',
        vendor: 'Sacred Trails',
        location: 'Tirupati',
        image: 'https://images.unsplash.com/photo-1551161242-cd2c9c6e3d3c?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Araku coffee highlands',
        vendor: 'Valley Walks',
        location: 'Araku Valley',
        image: '/banners/tours.jpg',
      ),
      VendorListing(
        name: 'Goa coast three days',
        vendor: 'Coastal Co.',
        location: 'North Goa',
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'cabs',
    name: 'Cabs',
    route: '/cabs',
    icon: Icons.directions_car_outlined,
    tint: Color(0xFFE8EEF3),
    iconColor: Color(0xFF16324A),
    listings: [
      VendorListing(
        name: 'Local sedan — city rides',
        vendor: 'City Cabs',
        location: 'Hyderabad',
        image: '/banners/cabs.png',
      ),
      VendorListing(
        name: 'Hyderabad to Vijayawada SUV',
        vendor: 'Highway Fleet',
        location: 'Hyderabad',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Hourly Innova rental',
        vendor: 'Rent & Ride',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1544620341-11cb2cd7c626?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'electrician',
    name: 'Electrician',
    route: '/electrician',
    icon: Icons.bolt_outlined,
    tint: Color(0xFFFFF6E8),
    iconColor: Color(0xFFB7791F),
    listings: [
      VendorListing(
        name: 'Electrical safety check',
        vendor: 'SparkFix Hyderabad',
        location: 'HITEC City',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Switchboard & MCB work',
        vendor: 'Deccan Electric',
        location: 'Banjara Hills',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Fan installation',
        vendor: 'HomeWire',
        location: 'Kukatpally',
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'plumber',
    name: 'Plumber',
    route: '/plumber',
    icon: Icons.water_drop_outlined,
    tint: Color(0xFFE7F3FB),
    iconColor: Color(0xFF1B6EA8),
    listings: [
      VendorListing(
        name: 'Emergency plumbing',
        vendor: 'QuickFlow',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1585704032919-c009048eaec9?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Mixer tap replacement',
        vendor: 'PipeCare',
        location: 'Madhapur',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Bathroom leak fix',
        vendor: 'Gachibowli Plumb',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1585704032919-c009048eaec9?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'ac',
    name: 'AC',
    route: '/ac-repair',
    icon: Icons.ac_unit,
    tint: Color(0xFFE8F6F4),
    iconColor: Color(0xFF1B7A72),
    listings: [
      VendorListing(
        name: 'AC repair & gas top-up',
        vendor: 'CoolAir Hyd',
        location: 'HITEC City',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Split AC deep clean',
        vendor: 'FrostTech',
        location: 'Jubilee Hills',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'New AC install',
        vendor: 'ClimateCare',
        location: 'Kondapur',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'cleaning',
    name: 'Cleaning',
    route: '/cleaning',
    icon: Icons.cleaning_services_outlined,
    tint: Color(0xFFF3EEF8),
    iconColor: Color(0xFF6D5A8D),
    listings: [
      VendorListing(
        name: 'Home deep clean',
        vendor: 'Sparkle Crew',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Kitchen degrease',
        vendor: 'FreshNest',
        location: 'Madhapur',
        image: 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Sofa & carpet clean',
        vendor: 'SoftCare',
        location: 'Banjara Hills',
        image: 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'jobs',
    name: 'Jobs',
    route: '/job-consultancy',
    icon: Icons.work_outline,
    tint: Color(0xFFEEF3FB),
    iconColor: Color(0xFF2F5F9A),
    listings: [
      VendorListing(
        name: 'IT placement desk',
        vendor: 'CareerForge Hyd',
        location: 'HITEC City',
        image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Resume & interview prep',
        vendor: 'HireNest',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Campus-to-corporate',
        vendor: 'Southbound Talent',
        location: 'Madhapur',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'beautician',
    name: 'Beauty',
    route: '/beautician',
    icon: Icons.face_outlined,
    tint: Color(0xFFFBEEF3),
    iconColor: Color(0xFFA14D6D),
    listings: [
      VendorListing(
        name: 'Bridal makeup at home',
        vendor: 'Glow Studio',
        location: 'Banjara Hills',
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Facial & cleanup',
        vendor: 'Blush & Co',
        location: 'Jubilee Hills',
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Party makeup',
        vendor: 'Jubilee Beauty',
        location: 'Jubilee Hills',
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'painting',
    name: 'Painting',
    route: '/painting',
    icon: Icons.format_paint_outlined,
    tint: Color(0xFFEEF2FB),
    iconColor: Color(0xFF3D5AA8),
    listings: [
      VendorListing(
        name: '2BHK interior paint',
        vendor: 'ColorWorks',
        location: 'Kondapur',
        image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Waterproof terrace coat',
        vendor: 'WallCare',
        location: 'Miyapur',
        image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Texture living room',
        vendor: 'HueCraft',
        location: 'Narsingi',
        image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'carpenter',
    name: 'Carpenter',
    route: '/carpenter',
    icon: Icons.handyman_outlined,
    tint: Color(0xFFF4EEE6),
    iconColor: Color(0xFF7A5A32),
    listings: [
      VendorListing(
        name: 'Door hinge & lock fix',
        vendor: 'WoodRight',
        location: 'Kukatpally',
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Kitchen shelf fitting',
        vendor: 'Joinery Hyd',
        location: 'Madhapur',
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Wardrobe repair',
        vendor: 'Carpentry Co',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'appliance',
    name: 'Appliance',
    route: '/appliance',
    icon: Icons.kitchen_outlined,
    tint: Color(0xFFE8F1F7),
    iconColor: Color(0xFF2F5D7A),
    listings: [
      VendorListing(
        name: 'Fridge gas & cooling',
        vendor: 'FixIt Home',
        location: 'Madhapur',
        image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'Washing machine repair',
        vendor: 'SpinCare',
        location: 'Kukatpally',
        image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80',
      ),
      VendorListing(
        name: 'LED TV service',
        vendor: 'ScreenFix Hyd',
        location: 'Gachibowli',
        image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  ServiceItem(
    id: 'public-transport',
    name: 'Public Transport',
    route: '/public-transport',
    icon: Icons.airport_shuttle_outlined,
    tint: Color(0xFFFEF3C7),
    iconColor: Color(0xFFB45309),
    listings: const [],
  ),
  ServiceItem(
    id: 'goods-transport',
    name: 'Goods Transport',
    route: '/goods-transport',
    icon: Icons.local_shipping_outlined,
    tint: Color(0xFFDBEAFE),
    iconColor: Color(0xFF1D4ED8),
    listings: const [],
  ),
  ServiceItem(
    id: 'packers-movers',
    name: 'Packers & Movers',
    route: '/packers-movers',
    icon: Icons.inventory_2_outlined,
    tint: Color(0xFFFFEDD5),
    iconColor: Color(0xFFC2410C),
    listings: const [],
  ),
  ServiceItem(
    id: 'cloud-kitchen',
    name: 'Cloud Kitchen',
    route: '/cloud-kitchen',
    icon: Icons.ramen_dining_outlined,
    tint: Color(0xFFFFE4E6),
    iconColor: Color(0xFFBE123C),
    listings: const [],
  ),
];

final vendorAds = _mixAds();

List<CustomerAd> _mixAds() {
  final groups = [
    for (final service in services)
      [
        for (var i = 0; i < service.listings.length; i++)
          CustomerAd(
            id: '${service.id}-$i',
            categoryId: service.id,
            category: service.name,
            title: service.listings[i].name,
            vendor: service.listings[i].vendor,
            location: service.listings[i].location,
            image: listingImage(service.listings[i].image, service.id),
            route: service.route,
          ),
      ],
  ];

  final mixed = <CustomerAd>[];
  var depth = 0;
  for (final group in groups) {
    if (group.length > depth) depth = group.length;
  }
  for (var i = 0; i < depth; i++) {
    for (final group in groups) {
      if (i < group.length) mixed.add(group[i]);
    }
  }
  return mixed;
}
