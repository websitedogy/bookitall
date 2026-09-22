import '../../data/catalog.dart';

class Professional {
  const Professional({
    required this.id,
    required this.name,
    required this.categoryLabel,
    required this.image,
    required this.rating,
    required this.reviews,
    required this.years,
    required this.highlights,
  });

  final String id;
  final String name;
  final String categoryLabel;
  final String image;
  final double rating;
  final int reviews;
  final int years;
  final List<String> highlights;

  String get metaLine => '$years+ years • ${highlights.join(' • ')}';

  CustomerAd toAd(ServiceItem service) {
    return CustomerAd(
      id: id,
      categoryId: service.id,
      category: service.name,
      title: name,
      vendor: categoryLabel,
      location: metaLine,
      image: image,
      route: service.route,
    );
  }
}

class ProfessionalMeta {
  const ProfessionalMeta({
    required this.bookingTitle,
    required this.categoryLabel,
    required this.highlights,
    required this.tint,
    required this.names,
  });

  final String bookingTitle;
  final String categoryLabel;
  final List<String> highlights;
  final int tint;
  final List<String> names;
}

const professionalMeta = <String, ProfessionalMeta>{
  'hotels': ProfessionalMeta(
    bookingTitle: 'Hotel Booking',
    categoryLabel: 'Hotels & Resorts',
    highlights: ['Free WiFi', 'Verified Stay'],
    tint: 0xFFE8F1F7,
    names: [
      'Parkview Banjara',
      'HITEC Harbor Suites',
      'Anjuna Tide Resort',
      'Lakeview Residency',
      'Charminar Heritage Inn',
      'Gachibowli Suites',
      'Jubilee Courtyard',
      'Kondapur Business Stay',
      'Goa Pearl Resort',
      'Vizag Beach Hotel',
      'Tirupati Yatri Nivas',
      'Araku Valley Lodge',
      'Shamshabad Airport Hotel',
      'Kukatpally Comfort Inn',
      'Necklace Road Stay',
      'Madhapur Nest',
      'Secunderabad Club Stay',
    ],
  ),
  'tours': ProfessionalMeta(
    bookingTitle: 'Tour Booking',
    categoryLabel: 'Tours & Packages',
    highlights: ['Guided', 'Verified Operator'],
    tint: 0xFFF1ECF7,
    names: [
      'Sacred Trails',
      'Valley Walks',
      'Coastal Co.',
      'Godavari River Cruise',
      'Tirupati Darshan Co',
      'Srisailam Weekend',
      'Lambasingi Mist Tours',
      'Vizag Coastal Trail',
      'Papikondalu Package',
      'Belum Caves Day Trip',
      'Horsley Hills Getaway',
      'Kerala Backwaters Co',
      'Coorg Estate Walk',
      'Hampi Heritage Run',
      'Lepakshi Day Tour',
      'Nagarjuna Sagar Cruise',
    ],
  ),
  'cabs': ProfessionalMeta(
    bookingTitle: 'Cab Booking',
    categoryLabel: 'Cab & Airport Transfers',
    highlights: ['AC Cars', 'Verified Drivers'],
    tint: 0xFFE8EEF3,
    names: [
      'Rajahmundry City Cabs',
      'Godavari Ride Services',
      'Royal City Cabs',
      'Sai Travels & Cabs',
      'BlueLine Cabs',
      'QuickRide Rajahmundry',
      'Vizag Airport Cabs',
      'Guntur Swift Travels',
      'Vijayawada City Rides',
      'Eluru Cab Co',
      'Kakinada Shore Cabs',
      'Ongole Highway Cabs',
      'City Cabs',
      'Highway Fleet',
      'Rent & Ride',
      'Godavari Airport Cars',
      'Coastal Outstation Cabs',
    ],
  ),
  'electrician': ProfessionalMeta(
    bookingTitle: 'Electrician Booking',
    categoryLabel: 'Electrical & Wiring',
    highlights: ['Licensed', 'Same-day'],
    tint: 0xFFFFF6E8,
    names: [
      'SparkFix Hyderabad',
      'Deccan Electric',
      'HomeWire',
      'PowerGrid Hyd',
      'VoltCare',
      'RapidSpark',
      'BrightPoint Electric',
      'CurrentFix',
      'WireWorks',
      'MegaVolt Services',
      'SafeEarthing Co',
      'SwitchCraft',
      'HydLine Electric',
      'SparkOn Call',
      'CircuitCare Hyd',
      'LiveWire Gachibowli',
      'Ampere Homes',
    ],
  ),
  'plumber': ProfessionalMeta(
    bookingTitle: 'Plumber Booking',
    categoryLabel: 'Plumbing & Drains',
    highlights: ['Emergency', 'Parts kit'],
    tint: 0xFFE7F3FB,
    names: [
      'QuickFlow',
      'PipeCare',
      'Gachibowli Plumb',
      'LeakGuard Hyd',
      'TapFix Pro',
      'DrainLine',
      'AquaWorks',
      'PipeRight',
      'FlowFix 24x7',
      'BathFit Plumbers',
      'CityDrain Co',
      'HydroCare',
      'ValveTech',
      'Madhapur Plumbing',
      'HITEC Pipe Crew',
      'SealWell',
      'RapidPlumb',
    ],
  ),
  'ac': ProfessionalMeta(
    bookingTitle: 'AC Booking',
    categoryLabel: 'AC Repair & Service',
    highlights: ['Gas top-up', 'Same-day'],
    tint: 0xFFE8F6F4,
    names: [
      'CoolAir Hyd',
      'FrostTech',
      'ClimateCare',
      'Arctic Service',
      'BreezeFix',
      'SplitCare Pro',
      'ChillPoint',
      'AirPure AC',
      'Kondapur Cool',
      'Jubilee Frost',
      'HITEC Climate',
      'WinterCool',
      'GasTop AC',
      'FilterFresh',
      'QuietCool Hyd',
      'PeakSummer AC',
      'HomeChill',
    ],
  ),
  'cleaning': ProfessionalMeta(
    bookingTitle: 'Cleaning Booking',
    categoryLabel: 'Home Cleaning',
    highlights: ['Eco detergents', '2-person crew'],
    tint: 0xFFF3EEF8,
    names: [
      'Sparkle Crew',
      'FreshNest',
      'SoftCare',
      'ShineHouse',
      'DeepClean Hyd',
      'NeatNest',
      'GlowFloors',
      'KitchenShine',
      'BathBright',
      'MoveIn Clean',
      'UrbanSparkle',
      'Gachibowli Clean Co',
      'SofaFresh',
      'WindowLite',
      'HomeBloom Clean',
      'Spotless 2BHK',
      'PureSpace',
    ],
  ),
  'jobs': ProfessionalMeta(
    bookingTitle: 'Jobs Booking',
    categoryLabel: 'Job Consultancy',
    highlights: ['Resume review', 'Verified'],
    tint: 0xFFEEF3FB,
    names: [
      'CareerForge Hyd',
      'HireNest',
      'Southbound Talent',
      'PlaceWell',
      'InterviewLab',
      'ResumeCraft',
      'HITEC Careers',
      'CampusBridge',
      'OfferDesk',
      'SkillMatch Hyd',
      'FirstJob Studio',
      'HireSouth',
      'RoleReady',
      'WalkIn Desk',
      'TalentNest',
      'JobSpring',
      'CareerDock',
    ],
  ),
  'beautician': ProfessionalMeta(
    bookingTitle: 'Beauty Booking',
    categoryLabel: 'Salon at Home',
    highlights: ['Kit included', 'Verified artist'],
    tint: 0xFFFBEEF3,
    names: [
      'Glow Studio',
      'Blush & Co',
      'Jubilee Beauty',
      'Bridal At Home',
      'RoseGold Makeup',
      'SilkSkin',
      'Mehendi Muse',
      'PartyGlow',
      'Banjara Salon Home',
      'Luxe Lash',
      'NudeBloom',
      'Hyd Bridal Co',
      'SoftGlam',
      'Aura Makeup',
      'Velvet Studio',
      'Petal & Paint',
      'HomeSalon Pro',
    ],
  ),
  'painting': ProfessionalMeta(
    bookingTitle: 'Painting Booking',
    categoryLabel: 'Interior & Exterior Paint',
    highlights: ['Shade card', 'Clean finish'],
    tint: 0xFFEEF2FB,
    names: [
      'ColorWorks',
      'WallCare',
      'HueCraft',
      'FreshCoat',
      'Texture House',
      'TerraceSeal',
      'PaintLab Hyd',
      'WallBloom',
      'TrueTone',
      'BrushLine',
      'ShadeCard Co',
      'Miyapur Paints',
      'Kondapur Color',
      'Waterproof Pro',
      'LivingHue',
      'CoatRight',
      'PrimeWalls',
    ],
  ),
  'carpenter': ProfessionalMeta(
    bookingTitle: 'Carpenter Booking',
    categoryLabel: 'Carpentry & Fittings',
    highlights: ['On-site tools', 'Verified'],
    tint: 0xFFF4EEE6,
    names: [
      'WoodRight',
      'Joinery Hyd',
      'Carpentry Co',
      'DoorFix Pro',
      'ShelfCraft',
      'WardrobeWorks',
      'HingeCare',
      'TimberLine',
      'Kukatpally Wood',
      'Madhapur Joinery',
      'LockNFit',
      'CustomCarp',
      'FrameFix',
      'Oak & Pine',
      'HomeJoinery',
      'Sawdust Studio',
      'FitRight Wood',
    ],
  ),
  'appliance': ProfessionalMeta(
    bookingTitle: 'Appliance Booking',
    categoryLabel: 'Home Appliance Repair',
    highlights: ['On-site visit', 'Parts quoted'],
    tint: 0xFFE8F1F7,
    names: [
      'FixIt Home',
      'SpinCare',
      'ScreenFix Hyd',
      'CoolBox Repair',
      'WashPro',
      'MicroFix',
      'TVCare Hyd',
      'FridgeFirst',
      'HomeWatt',
      'GadgetFix',
      'WhiteGoods Co',
      'Kukatpally Repair',
      'Madhapur Appliance',
      'QuickChip',
      'Doorstep Fix',
      'CircuitCare',
      'HomeService Lab',
    ],
  ),
  'public-transport': ProfessionalMeta(
    bookingTitle: 'Public Transport Booking',
    categoryLabel: 'Public Transport',
    highlights: ['Seat booking', 'Verified operator'],
    tint: 0xFFFEF3C7,
    names: [
      'City Auto Hub',
      'ShareRide Hyd',
      'Airport Auto Desk',
      'Deccan Mini Bus',
      'Charminar Share',
      'HITEC Shuttle',
      'Secunderabad Autos',
      'NightRide Co',
      'Gachibowli Share',
      'Metro Link Auto',
      'Southbound Tempo',
      'Kukatpally Autos',
      'Madhapur Share Cab',
      'Jubilee Shuttle',
      'CityLine Bus',
      'QuickAuto Hyd',
      'RouteOne Transport',
    ],
  ),
  'goods-transport': ProfessionalMeta(
    bookingTitle: 'Goods Transport Booking',
    categoryLabel: 'Goods Transport',
    highlights: ['Local delivery', 'Verified fleet'],
    tint: 0xFFDBEAFE,
    names: [
      'Hyd Freight',
      'MiniTruck Hyd',
      'QuickLoad',
      'Deccan Logistics',
      'Pickup Pro',
      'LorryLink',
      'Gachibowli Goods',
      'HITEC Haul',
      'TonMove',
      'CityCargo',
      'ShiftLoad',
      'Kukatpally Trucks',
      'Madhapur Freight',
      'Doorstep Lorry',
      'BoxHaul Co',
      'Southbound Goods',
      'SameDay Pickup',
    ],
  ),
  'packers-movers': ProfessionalMeta(
    bookingTitle: 'Packers & Movers Booking',
    categoryLabel: 'Packers & Movers',
    highlights: ['Packing crew', 'Verified movers'],
    tint: 0xFFFFEDD5,
    names: [
      'SafeShift Hyd',
      'MoveRight',
      'BoxAndGo',
      'HouseShift Co',
      'OfficeMove Hyd',
      'CarePack',
      'DoorToDoor Shift',
      'PackLab',
      'Relocate South',
      'Gachibowli Movers',
      'HITEC Packers',
      'HomeCarton',
      'ShiftNest',
      'SecureMove',
      'CityPackers',
      'AllIndia Shift',
      'QuickRelo',
    ],
  ),
  'cloud-kitchen': ProfessionalMeta(
    bookingTitle: 'Cloud Kitchen Booking',
    categoryLabel: 'Cloud Kitchen',
    highlights: ['Delivery ready', 'Verified kitchen'],
    tint: 0xFFFFE4E6,
    names: [
      'Spice Cloud',
      'TrayKitchen',
      'Biryani Lab',
      'Tiffin Cloud',
      'MultiBrand Kitchen',
      'Hyd Commissary',
      'BowlWorks',
      'CaterCloud',
      'Gachibowli Kitchen',
      'HITEC Cloud Cook',
      'MealTray Co',
      'DarkKitchen Hyd',
      'SouthSpice Lab',
      'QuickTiffin',
      'BulkBite',
      'CloudThali',
      'KitchenNest',
    ],
  ),
};

const _ratings = [4.5, 4.7, 4.9, 4.6, 4.8, 4.5, 4.7, 4.9];

String fallbackImageFor(String serviceId) {
  if (serviceId == 'hotels' || serviceId == 'tours' || serviceId == 'cabs') {
    return '/banners/$serviceId.jpg';
  }
  if (serviceId == 'appliance') return '/categories/appliance.png';
  if (serviceId == 'public-transport' ||
      serviceId == 'goods-transport' ||
      serviceId == 'packers-movers' ||
      serviceId == 'cloud-kitchen') {
    return '/categories/$serviceId.svg';
  }
  return '/categories/$serviceId.png';
}

String localListingImage(String src, String serviceId) {
  return listingImage(src, serviceId);
}

List<String> _imagePool(ServiceItem service) {
  return [
    fallbackImageFor(service.id),
    '/banners/hotels.jpg',
    '/banners/tours.jpg',
    '/banners/cabs.jpg',
    '/banners/home.jpg',
    '/categories/${service.id}.png',
    for (final listing in service.listings) localListingImage(listing.image, service.id),
  ];
}

List<Professional> professionalsFor(ServiceItem service) {
  final meta = professionalMeta[service.id];
  if (meta == null) return const [];

  final seen = <String>{};
  final names = <String>[];
  void push(String name) {
    final key = name.trim().toLowerCase();
    if (key.isEmpty || seen.contains(key)) return;
    seen.add(key);
    names.add(name.trim());
  }

  for (final listing in service.listings) {
    push(listing.vendor);
  }
  for (final name in meta.names) {
    push(name);
  }

  final images = _imagePool(service);
  return [
    for (var i = 0; i < names.length && i < 20; i++)
      Professional(
        id: '${service.id}-pro-${i + 1}',
        name: names[i],
        categoryLabel: meta.categoryLabel,
        image: images[i % images.length],
        rating: _ratings[i % _ratings.length],
        reviews: 120 + i * 37,
        years: 4 + (i % 9),
        highlights: meta.highlights,
      ),
  ];
}

ServiceItem? serviceById(String id) {
  for (final service in services) {
    if (service.id == id) return service;
  }
  return null;
}
