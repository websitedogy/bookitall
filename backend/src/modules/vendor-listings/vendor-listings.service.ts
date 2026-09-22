import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingStatus, VendorListing } from './entities/vendor-listing.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PartnerType, UserStatus, isPanelRole } from '../../common/enums/user-role.enum';
import { normalizeMobile } from '../../common/utils/phone';
import { CabsService } from '../cabs/cabs.service';
import { HomeServicesService } from '../home-services/home-services.service';
import { ToursService } from '../tours/tours.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformServicesService } from '../platform-services/platform-services.service';
import { geocodeIndiaAddress, isUsableCoord } from '../../common/utils/geocode';
import { vendorListingCanonicalPath } from '../../common/utils/listing-path';
import { NotificationType } from '../../common/enums/notification.enum';

const FORMS: Record<string, { required: string[]; titleField: string; partnerType: PartnerType }> = {
  cabs: { required: ['shopName', 'mobileNumber', 'cabType', 'bookingType', 'price', 'priceUnit', 'district', 'coverageType'], titleField: 'shopName', partnerType: PartnerType.CAB },
  beautician: { required: ['beauticianName', 'mobileNumber', 'serviceType', 'location', 'serviceArea', 'price', 'priceUnit'], titleField: 'beauticianName', partnerType: PartnerType.HOME_SERVICE },
  electrician: { required: ['electricianName', 'mobileNumber', 'experienceYears', 'servicesOffered', 'customerType', 'visitCharge', 'location', 'serviceArea', 'price', 'priceUnit'], titleField: 'electricianName', partnerType: PartnerType.HOME_SERVICE },
  plumber: { required: ['plumberName', 'mobileNumber', 'experienceYears', 'servicesOffered', 'customerType', 'visitCharge', 'hourlyCharge', 'location', 'serviceArea', 'price', 'priceUnit'], titleField: 'plumberName', partnerType: PartnerType.HOME_SERVICE },
  cleaning: { required: ['cleanerName', 'mobileNumber', 'servicesOffered', 'location', 'serviceArea', 'price', 'priceUnit'], titleField: 'cleanerName', partnerType: PartnerType.HOME_SERVICE },
  ac: { required: ['technicianName', 'mobileNumber', 'experienceYears', 'servicesOffered', 'acType', 'visitCharge', 'hourlyCharge', 'location', 'serviceArea', 'price', 'priceUnit'], titleField: 'technicianName', partnerType: PartnerType.HOME_SERVICE },
  carpenter: { required: ['carpenterName', 'mobileNumber', 'experienceYears', 'servicesOffered', 'workType', 'visitCharge', 'hourlyCharge', 'materialResponsibility', 'district', 'coverageType', 'price', 'priceUnit'], titleField: 'carpenterName', partnerType: PartnerType.HOME_SERVICE },
  painting: { required: ['painterName', 'mobileNumber', 'experienceYears', 'servicesOffered', 'workType', 'visitCharge', 'hourlyCharge', 'materialResponsibility', 'district', 'coverageType', 'price', 'priceUnit'], titleField: 'painterName', partnerType: PartnerType.HOME_SERVICE },
  appliance: { required: ['technicianName', 'mobileNumber', 'experienceYears', 'applianceType', 'serviceType', 'visitCharge', 'hourlyCharge', 'district', 'coverageType', 'price', 'priceUnit'], titleField: 'technicianName', partnerType: PartnerType.HOME_SERVICE },
  jobs: { required: ['companyName', 'mobileNumber', 'industry', 'location', 'jobTitle', 'department', 'jobType', 'experienceRequired', 'qualification', 'numberOfVacancies', 'salaryRange', 'workLocation', 'workMode', 'shift', 'jobDescription', 'responsibilities', 'requiredSkills', 'lastDateToApply', 'howToApply', 'applicationEmail'], titleField: 'companyName', partnerType: PartnerType.HOME_SERVICE },
  tours: { required: ['shopName', 'mobileNumber', 'packageName', 'destinations', 'price', 'priceUnit'], titleField: 'shopName', partnerType: PartnerType.TOUR },
  'public-transport': { required: ['vehicleType', 'vehicleNumber', 'vehicleMake', 'vehicleModel', 'manufacturingYear', 'seats', 'driverName', 'mobileNumber', 'dateOfBirth', 'address', 'drivingLicenceNumber', 'serviceType', 'price'], titleField: 'driverName', partnerType: PartnerType.HOME_SERVICE },
  'goods-transport': { required: ['vehicleType', 'vehicleNumber', 'vehicleMake', 'vehicleModel', 'manufacturingYear', 'loadCapacity', 'driverName', 'mobileNumber', 'address', 'drivingLicenceNumber', 'price'], titleField: 'driverName', partnerType: PartnerType.HOME_SERVICE },
  'packers-movers': { required: ['companyName', 'ownerName', 'mobileNumber', 'address', 'serviceType'], titleField: 'companyName', partnerType: PartnerType.HOME_SERVICE },
  'cloud-kitchen': { required: ['kitchenName', 'ownerName', 'mobileNumber', 'location', 'cuisineType', 'price', 'priceUnit'], titleField: 'kitchenName', partnerType: PartnerType.HOME_SERVICE },
};

const HOME_CATEGORY: Record<string, string> = {
  beautician: 'Salon at home',
  electrician: 'Electrical',
  plumber: 'Plumbing',
  cleaning: 'Cleaning',
  ac: 'AC',
  carpenter: 'Carpenter',
  painting: 'Painting',
  appliance: 'Appliance',
  'public-transport': 'Public Transport',
  'goods-transport': 'Goods Transport',
  'packers-movers': 'Packers & Movers',
  'cloud-kitchen': 'Cloud Kitchen',
};

const LABELS: Record<string, string> = {
  hotels: 'Hotels',
  tours: 'Tours',
  cabs: 'Cabs',
  electrician: 'Electrician',
  plumber: 'Plumber',
  ac: 'AC',
  cleaning: 'Cleaning',
  jobs: 'Jobs',
  beautician: 'Beauty',
  painting: 'Painting',
  carpenter: 'Carpenter',
  appliance: 'Appliance',
  'public-transport': 'Public Transport',
  'goods-transport': 'Goods Transport',
  'packers-movers': 'Packers & Movers',
  'cloud-kitchen': 'Cloud Kitchen',
};

const FIELD_LABELS: Record<string, string> = {
  businessName: 'Consultancy / business name',
  operatorName: 'Operator / service name',
  companyName: 'Company name',
  manufacturingYear: 'Manufacturing year',
  dateOfBirth: 'Date of birth',
  drivingLicenceNumber: 'Driving licence number',
  vehicleMake: 'Vehicle make',
  kitchenName: 'Cloud kitchen name',
  foodTypes: 'Food types',
  serviceLocations: 'Service locations',
  loadCapacity: 'Load capacity',
  ownerSame: 'Owner drives',
  permitDocument: 'Permit',
  routeType: 'Route type',
  loadType: 'Load type',
  moveType: 'Move type',
  cuisineType: 'Cuisine',
  kitchenType: 'Kitchen type',
  capacity: 'Capacity',
  ownerName: 'Owner / contact person',
  email: 'Email',
  phone: 'Phone',
  houseNumber: 'Door number',
  street: 'Street',
  address: 'Address',
  city: 'City',
  area: 'Area',
  state: 'State',
  location: 'Location',
  sectors: 'Sectors',
  servicesOffered: 'Services',
  experienceYears: 'Years of experience',
  description: 'Additional information',
  price: 'Price',
  priceFrom: 'Starting price',
  feeFrom: 'Starting fee',
  entryPrice: 'Entry price',
  visitCharge: 'Visit charge',
  perKm: 'Rate per km',
  priceUnit: 'Price unit',
  mobileNumber: 'Phone',
  shopName: 'Shop name',
  packageName: 'Package',
  destinations: 'Destinations',
  duration: 'Duration',
  groupSize: 'Group size',
  inclusions: 'Inclusions',
  packagePricing: 'Package pricing',
  travelType: 'Travel type',
  transportOptions: 'Transport options',
  minGroupSize: 'Minimum group size',
  maxGroupSize: 'Maximum group size',
  pickupAvailable: 'Pickup available',
  pickupPoint: 'Pickup point',
  dropPoint: 'Drop point',
  food: 'Food',
  licenseStatus: 'License status',
  licenseDocument: 'License document',
  tripDuration: 'Trip duration',
  dropAvailable: 'Drop available',
  advancePayment: 'Advance payment',
  availableFrom: 'Available from',
  availableUntil: 'Available until',
  departureTime: 'Departure time',
  returnTime: 'Return time',
  driverName: 'Driver name',
  driverMobile: 'Driver mobile',
  providerType: 'Provider type',
  whatsapp: 'WhatsApp',
  vehicleFares: 'Vehicle fares',
  vehicleFeatures: 'Vehicle features',
  minKm: 'Minimum KM',
  minHours: 'Minimum hours',
  extraKmCharge: 'Extra KM charge',
  waitingCharge: 'Waiting charge',
  nightCharge: 'Night charge',
  driverAllowance: 'Driver allowance',
  drivingExperience: 'Driving experience',
  driverVerification: 'Driver verification',
  documents: 'Documents',
  bookingMode: 'Booking mode',
  advanceNotice: 'Advance notice',
  driverAvailability: 'Driver availability',
  cabType: 'Cab type',
  vehicleType: 'Vehicle type',
  vehicleModel: 'Vehicle',
  vehicleNumber: 'Vehicle number',
  vehicleTypes: 'Vehicles',
  seats: 'Seating capacity',
  bookingType: 'Booking type',
  licenseNumber: 'Driving licence',
  stayKind: 'Stay type',
  hostOnProperty: 'Host on property',
  meals: 'Meals',
  houseRules: 'House rules',
  maxGuests: 'Max guests',
  hotelName: 'Hotel name',
  hotelType: 'Hotel type',
  starCategory: 'Star / category',
  checkPolicy: 'Check-in / check-out policy',
  roomRates: 'Room rates',
  roomFeatures: 'Room features',
  facilities: 'Property facilities',
  extraGuestCharge: 'Extra guest charge',
  childPolicy: 'Child policy',
  booking24x7: '24x7 booking',
  cancellation: 'Cancellation',
  roomType: 'Room type',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  checkInTime: 'Check-in',
  checkOutTime: 'Check-out',
  electricianName: 'Business / electrician name',
  customerType: 'Customer type',
  emergency: 'Emergency service',
  availableDays: 'Available days',
  availableTime: 'Available time',
  district: 'District',
  mandals: 'Mandals',
  coverageType: 'Service coverage',
  plumberName: 'Plumber / business name',
  hourlyCharge: 'Hourly charge',
  fullDayCharge: 'Full day charge',
  teamSize: 'Service team size',
  technicianName: 'Technician name',
  carpenterName: 'Business / carpenter name',
  tools: 'Tools available',
  materialResponsibility: 'Material responsibility',
  painterName: 'Business / painter name',
  paintTypes: 'Paint types supported',
  cleanerName: 'Name',
  propertyType: 'Property type',
  startingCharge: 'Starting service charge',
  beauticianName: 'Name',
  servicePricing: 'Service pricing',
  productResponsibility: 'Product responsibility',
  openingTime: 'Opening time',
  closingTime: 'Closing time',
  bookingBuffer: 'Booking buffer',
  serviceFor: 'Service for',
  serviceType: 'Service type',
  workType: 'Work type',
  specialization: 'Specialization',
  primarySkill: 'Focus',
  availability: 'Availability',
  coverage: 'Coverage',
  includesPacking: 'Packing included',
  acType: 'AC type',
  applianceType: 'Appliances serviced',
  serviceMode: 'Service mode',
  spareParts: 'Spare parts',
  paintingType: 'Painting type',
  cleaningType: 'Cleaning type',
  serviceArea: 'Service area',
  serviceKm: 'Service area KM',
  cleaningItems: 'What they clean',
  workChargesNote: 'Work charges',
  beautyServices: 'Beauty services',
  gender: 'Gender',
  brand: 'Brand',
  material: 'Material',
};

function vendorHeld(status: UserStatus) {
  return status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED;
}

function parseCoord(value?: string | null) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class VendorListingsService {
  constructor(
    @InjectRepository(VendorListing) private readonly listings: Repository<VendorListing>,
    private readonly users: UsersService,
    private readonly cabs: CabsService,
    private readonly homeServices: HomeServicesService,
    private readonly tours: ToursService,
    private readonly notes: NotificationsService,
    private readonly platformServices: PlatformServicesService,
  ) {}

  async create(userId: string, category: string, raw: Record<string, string>, photoUrls: string[]) {
    await this.platformServices.assertEnabled(category);
    await this.assertCategoryAvailable(userId, category);
    const spec = FORMS[category];
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const scalar = Array.isArray(value) ? value[0] : value;
      if (scalar == null || scalar === '') continue;
      const text = String(scalar).trim();
      if (text) fields[key] = text;
    }

    if (!fields.mobileNumber && fields.phone) {
      fields.mobileNumber = fields.phone.replace(/\s/g, '');
    }
    if (!fields.price && fields.priceFrom) fields.price = fields.priceFrom;
    if (!fields.price && fields.feeFrom) fields.price = fields.feeFrom;
    if (!fields.price && fields.visitCharge) {
      const amount = Number(String(fields.visitCharge).replace(/[^\d.]/g, ''));
      if (Number.isFinite(amount) && amount > 0) fields.price = String(amount);
    }
    if (!fields.priceUnit && fields.visitCharge) fields.priceUnit = 'PER_VISIT';

    if (spec) {
      for (const name of spec.required) {
        if (!fields[name]) {
          throw new BadRequestException(`Please fill in ${name}`);
        }
      }
      if (spec.required.includes('price') && (!fields.price || Number(fields.price) <= 0)) {
        throw new BadRequestException('Please enter a valid price');
      }
    }
    if (fields.mobileNumber && !/^\d{10}$/.test(fields.mobileNumber.replace(/\s/g, ''))) {
      throw new BadRequestException('Enter a 10-digit mobile number');
    }

    const user = await this.users.getOrFail(userId);
    const title =
      (spec ? fields[spec.titleField] : '') ||
      fields.shopName ||
      fields.serviceName ||
      fields.hotelName ||
      fields.packageName ||
      fields.driverName ||
      fields.businessName ||
      fields.propertyName ||
      fields.operatorName ||
      fields.companyName ||
      fields.kitchenName ||
      category;
    fields.listedBy = user.fullName;
    await this.users.markAsVendor(userId, title, fields.mobileNumber || user.phone, spec?.partnerType ?? PartnerType.HOME_SERVICE);

    const listing = await this.listings.save(
      this.listings.create({
        userId,
        category,
        title,
        mobileNumber: fields.mobileNumber,
        fields,
        photoUrls,
        catalogId: null,
        status: ListingStatus.PENDING,
        latitude: parseCoord(fields.latitude),
        longitude: parseCoord(fields.longitude),
      }),
    );
    await this.notifyNewPost(listing);
    return listing;
  }

  async update(userId: string, id: string, raw: Record<string, string>, photoUrls: string[], keepPhotoUrls?: string[]) {
    const listing = await this.listings.findOne({ where: { id } });
    if (!listing || listing.deletedAt || listing.userId !== userId) {
      throw new NotFoundException('Listing not found');
    }

    const fields = { ...(listing.fields ?? {}) };
    for (const [key, value] of Object.entries(raw)) {
      const scalar = Array.isArray(value) ? value[0] : value;
      if (scalar == null) continue;
      const text = String(scalar).trim();
      if (text) fields[key] = text;
      else delete fields[key];
    }
    if (!fields.mobileNumber && fields.phone) fields.mobileNumber = fields.phone.replace(/\s/g, '');
    if (fields.mobileNumber && !/^\d{10}$/.test(fields.mobileNumber.replace(/\s/g, ''))) {
      throw new BadRequestException('Enter a 10-digit mobile number');
    }

    const title =
      fields.shopName || fields.serviceName || fields.hotelName || fields.packageName || fields.driverName ||
      fields.businessName || fields.propertyName || fields.operatorName || fields.companyName || fields.kitchenName ||
      listing.title;
    listing.title = title;
    listing.mobileNumber = fields.mobileNumber || listing.mobileNumber;
    listing.fields = fields;
    if (keepPhotoUrls) listing.photoUrls = [...keepPhotoUrls, ...photoUrls].slice(0, 40);
    listing.latitude = parseCoord(fields.latitude);
    listing.longitude = parseCoord(fields.longitude);
    listing.status = ListingStatus.PENDING;
    listing.reviewedAt = null;
    listing.reviewedBy = null;
    const saved = await this.listings.save(listing);
    await this.notifyNewPost(saved);
    return saved;
  }

  async addPost(input: {
    userId: string;
    category: string;
    title: string;
    mobileNumber?: string | null;
    fields: Record<string, string>;
    photoUrls: string[];
    catalogId?: string | null;
  }) {
    await this.platformServices.assertEnabled(input.category);
    await this.assertCategoryAvailable(input.userId, input.category);
    const listing = await this.listings.save(
      this.listings.create({
        userId: input.userId,
        category: input.category,
        title: input.title,
        mobileNumber: input.mobileNumber ?? null,
        fields: input.fields,
        photoUrls: input.photoUrls,
        catalogId: input.catalogId ?? null,
        status: ListingStatus.PENDING,
        latitude: parseCoord(input.fields.latitude),
        longitude: parseCoord(input.fields.longitude),
      }),
    );
    await this.notifyNewPost(listing);
    return listing;
  }

  async listNearby(query: { category?: string; lat?: number; lng?: number; city?: string; radiusKm?: number }) {
    if (query.category && query.category !== 'all' && !(await this.platformServices.isEnabled(query.category))) {
      return [];
    }
    const where: { status: ListingStatus; category?: string } = { status: ListingStatus.ACCEPTED };
    if (query.category && query.category !== 'all') where.category = query.category;
    const rows = await this.listings.find({ where, order: { createdAt: 'DESC' }, take: 200 });
    const enabled = await this.platformServices.enabledSlugs();
    const hidden = new Set([
      ...(await this.users.idsWithStatus(rows.map((row) => row.userId), UserStatus.SUSPENDED)),
      ...(await this.users.idsWithStatus(rows.map((row) => row.userId), UserStatus.INACTIVE)),
    ]);
    const visible = rows.filter((row) => !hidden.has(row.userId) && enabled.has(row.category));
    const lat = query.lat != null && Number.isFinite(query.lat) ? query.lat : null;
    const lng = query.lng != null && Number.isFinite(query.lng) ? query.lng : null;

    const matched: { row: VendorListing; distanceKm: number | null }[] = [];
    for (const row of visible) {
      const pin = await this.listingPin(row);
      let distanceKm: number | null = null;
      if (lat != null && lng != null && pin) {
        distanceKm = haversineKm(lat, lng, pin.lat, pin.lng);
      }
      matched.push({ row, distanceKm });
    }
    matched.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    return matched.map((item) => this.toPost(item.row, item.distanceKm));
  }

  async listMine(userId: string, category?: string, lat?: number, lng?: number) {
    const me = await this.users.getOrFail(userId);
    const digits = normalizeMobile(me.phone);
    const qb = this.listings
      .createQueryBuilder('listing')
      .innerJoin(User, 'owner', 'owner.id = listing.userId')
      .where("RIGHT(REGEXP_REPLACE(COALESCE(owner.phone, ''), '[^0-9]', '', 'g'), 10) = :digits", { digits: digits || '__none__' })
      .andWhere('listing.deletedAt IS NULL')
      .orderBy('listing.createdAt', 'DESC');
    if (category && category !== 'all') {
      qb.andWhere('listing.category = :category', { category });
    }
    const rows = await qb.getMany();
    const hold = vendorHeld(me.status);
    const originLat = Number.isFinite(lat) ? lat : undefined;
    const originLng = Number.isFinite(lng) ? lng : undefined;
    const posts = [];
    for (const row of rows) {
      try {
        const pin = await this.listingPin(row);
        const distanceKm =
          originLat != null && originLng != null && pin
            ? haversineKm(originLat, originLng, pin.lat, pin.lng)
            : null;
        posts.push(this.toPost(row, distanceKm, hold));
      } catch {
        // skip broken rows
      }
    }
    return posts;
  }

  async claimedCategories(userId: string) {
    const rows = await this.ownerActiveListings(userId);
    return [...new Set(rows.map((row) => row.category))];
  }

  async assertCategoryAvailable(userId: string, category: string) {
    const existing = (await this.ownerActiveListings(userId)).find((row) => row.category === category);
    if (!existing) return;
    if (existing.status === ListingStatus.ACCEPTED) {
      throw new BadRequestException('You already listed this service');
    }
    throw new BadRequestException('This service is already submitted and waiting for admin review');
  }

  private async ownerActiveListings(userId: string) {
    const me = await this.users.getOrFail(userId);
    const digits = normalizeMobile(me.phone);
    const qb = this.listings
      .createQueryBuilder('listing')
      .innerJoin(User, 'owner', 'owner.id = listing.userId')
      .where('listing.deletedAt IS NULL')
      .andWhere('listing.status IN (:...statuses)', {
        statuses: [ListingStatus.PENDING, ListingStatus.ACCEPTED],
      });
    if (digits) {
      qb.andWhere(
        "(listing.userId = :userId OR RIGHT(REGEXP_REPLACE(COALESCE(owner.phone, ''), '[^0-9]', '', 'g'), 10) = :digits)",
        { userId, digits },
      );
    } else {
      qb.andWhere('listing.userId = :userId', { userId });
    }
    return qb.getMany();
  }

  private async listingPin(row: VendorListing) {
    if (isUsableCoord(row.latitude, row.longitude)) {
      return { lat: row.latitude as number, lng: row.longitude as number };
    }
    const pin = await geocodeIndiaAddress(
      row.fields?.location,
      row.fields?.city,
      row.fields?.district,
      row.fields?.state,
    );
    if (!pin) return null;
    row.latitude = pin.lat;
    row.longitude = pin.lng;
    row.fields = {
      ...(row.fields ?? {}),
      latitude: String(pin.lat),
      longitude: String(pin.lng),
    };
    await this.listings.save(row);
    if (row.category === 'hotels' && row.catalogId) {
      await this.listings.query(
        `UPDATE hotels SET latitude = $1, longitude = $2 WHERE id = $3 AND deleted_at IS NULL`,
        [pin.lat, pin.lng, row.catalogId],
      );
    }
    return pin;
  }

  async getOne(id: string, viewer?: { id?: string; role?: string } | null) {
    const row = await this.listings.findOne({ where: { id } });
    if (!row || row.deletedAt) throw new NotFoundException('Listing not found');
    const isOwner = Boolean(viewer?.id && viewer.id === row.userId);
    const isAdmin = isPanelRole(viewer?.role);
    if (row.status !== ListingStatus.ACCEPTED && !isOwner && !isAdmin) {
      throw new NotFoundException('Listing not found');
    }
    const owner = await this.users.findById(row.userId);
    const hold = owner ? vendorHeld(owner.status) : false;
    if (hold && !isOwner && !isAdmin) {
      throw new NotFoundException('Listing not found');
    }
    if (!isOwner && !isAdmin && !(await this.platformServices.isEnabled(row.category))) {
      throw new NotFoundException('Listing not found');
    }
    return { ...this.toDetail(row, hold), fields: isOwner ? row.fields : undefined, isOwner };
  }

  async listAdmin(status?: string, category?: string, owner?: string) {
    const qb = this.listings
      .createQueryBuilder('listing')
      .innerJoin(User, 'owner', 'owner.id = listing.userId')
      .where('listing.deletedAt IS NULL')
      .orderBy('listing.createdAt', 'DESC')
      .take(200);
    if (status && status !== 'all') {
      qb.andWhere('listing.status = :status', { status: status.toUpperCase() });
    }
    if (category && category !== 'all') {
      qb.andWhere('listing.category = :category', { category });
    }
    if (owner === 'active') {
      qb.andWhere('owner.status = :activeOwner', { activeOwner: UserStatus.ACTIVE });
    }
    const rows = await qb.getMany();
    const held = new Set([
      ...(await this.users.idsWithStatus(rows.map((row) => row.userId), UserStatus.INACTIVE)),
      ...(await this.users.idsWithStatus(rows.map((row) => row.userId), UserStatus.SUSPENDED)),
    ]);
    return rows.map((row) => this.toAdminListing(row, held.has(row.userId)));
  }

  async listForUser(userId: string) {
    const owner = await this.users.getOrFail(userId);
    const rows = await this.listings.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map((row) => this.toAdminListing(row, vendorHeld(owner.status)));
  }

  async accept(id: string, adminId: string) {
    const row = await this.listings.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Listing not found');
    row.status = ListingStatus.ACCEPTED;
    row.reviewedAt = new Date();
    row.reviewedBy = adminId;
    if (!row.catalogId) {
      row.catalogId = await this.createCatalog(row);
    }
    await this.listings.save(row);
    if (row.category === 'hotels' && row.catalogId) {
      await this.listings.query(
        `UPDATE hotels SET is_active = true WHERE id = $1 AND deleted_at IS NULL`,
        [row.catalogId],
      );
    }
    const owner = await this.users.getOrFail(row.userId);
    if (owner.status === UserStatus.PENDING_VERIFICATION || owner.status === UserStatus.INACTIVE) {
      await this.users.setStatus(row.userId, UserStatus.ACTIVE);
    }
    return this.toPost(row);
  }

  async reject(id: string, adminId: string) {
    const row = await this.listings.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Listing not found');
    row.status = ListingStatus.REJECTED;
    row.reviewedAt = new Date();
    row.reviewedBy = adminId;
    await this.listings.save(row);
    return this.toPost(row);
  }

  private async createCatalog(row: VendorListing) {
    const fields = row.fields ?? {};
    const city =
      fields.city ||
      (fields.location
        ?.split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(-2, -1)[0]) ||
      'Hyderabad';
    const locationLabel = fields.location || [fields.area, city, fields.state].filter(Boolean).join(', ');
    const user = await this.users.getOrFail(row.userId);

    if (row.category === 'cabs') {
      const seats = Number(fields.seats);
      const vehicle = await this.cabs.create(row.userId, {
        name: fields.shopName || fields.vehicleModel || fields.driverName || row.title,
        category: fields.cabType,
        registrationNumber: fields.vehicleNumber || `TEMP-${Date.now().toString(36)}`,
        color: 'White',
        seats: Number.isFinite(seats) && seats > 0 ? seats : 4,
        baseFare: Number(fields.entryPrice || fields.price || 0),
        perKmRate: fields.priceUnit === 'PER_KM' ? Number(fields.price) : 0,
        imageUrl: row.photoUrls[0],
      });
      return vehicle.id;
    }
    if (row.category === 'tours') {
      const durationDays = Number(String(fields.duration || '').replace(/\D/g, '')) || 1;
      const groupSize = Number(String(fields.groupSize || fields.maxGroupSize || '').replace(/\D/g, '')) || 10;
      const tour = await this.tours.create(row.userId, {
        name: fields.packageName || fields.shopName || row.title,
        description: [fields.inclusions, fields.travelType, locationLabel].filter(Boolean).join(' · ') || row.title,
        destination: fields.destinations?.split(',')[0]?.trim() || city,
        city,
        durationDays,
        pricePerPerson: Number(fields.price || fields.priceFrom || 0),
        groupSize,
        coverImageUrl: row.photoUrls[0] || '/categories/tours.png',
        highlights: (fields.inclusions || '')
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean),
      });
      return tour.id;
    }
    if (HOME_CATEGORY[row.category] && fields.price) {
      const service = await this.homeServices.create(row.userId, {
        name: row.title,
        category: HOME_CATEGORY[row.category] ?? row.category,
        description: [
          `Listed by ${user.fullName}`,
          locationLabel,
          fields.shopName,
          fields.serviceName,
          fields.gender,
          fields.cleaningType,
          fields.acType,
          fields.brand,
          fields.paintingType,
          fields.applianceType,
          fields.material,
          fields.serviceFor,
          fields.serviceType,
          fields.vehicleType,
          fields.loadCapacity,
          fields.workType,
          fields.specialization,
          fields.priceUnit?.replaceAll('_', ' '),
        ]
          .filter(Boolean)
          .join(' · '),
        basePrice: Number(fields.price),
        durationMinutes: fields.priceUnit === 'PER_HOUR' ? 60 : 90,
        city,
        coverImageUrl: row.photoUrls[0] || `/categories/${row.category}.png`,
      });
      return service.id;
    }
    return row.catalogId;
  }

  private toPost(row: VendorListing, distanceKm: number | null = null, hold = false) {
    const fields = row.fields ?? {};
    const location =
      fields.location ||
      fields.destinations ||
      [fields.area, fields.city, fields.state].filter(Boolean).join(', ') ||
      '';
    return {
      id: row.id,
      categoryId: row.category,
      category: LABELS[row.category] ?? row.category,
      title: row.title,
      vendor: fields.listedBy || row.title,
      location,
      image: row.photoUrls?.[0] || `/categories/${row.category}.png`,
      photoUrls: row.photoUrls ?? [],
      href: vendorListingCanonicalPath(row),
      canonicalPath: vendorListingCanonicalPath(row),
      status: hold && row.status === ListingStatus.ACCEPTED ? 'HOLD' : row.status ?? ListingStatus.PENDING,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: distanceKm != null ? Number(distanceKm.toFixed(1)) : null,
      createdAt: row.createdAt,
      priceLabel: this.priceLabel(row),
      unitPrice: this.numericPrice(row),
      priceUnit: fields.priceUnit || '',
      bookable: !hold && row.status === ListingStatus.ACCEPTED && (this.numericPrice(row) ?? 0) > 0,
      eyebrow: this.eyebrow(row, distanceKm),
      vehicleType: fields.vehicleType || '',
      serviceType: fields.serviceType || '',
      loadCapacity: fields.loadCapacity || '',
    };
  }

  async getBookable(id: string) {
    const row = await this.listings.findOne({ where: { id } });
    if (!row || row.deletedAt || row.status !== ListingStatus.ACCEPTED) {
      throw new NotFoundException('Listing is not available to book');
    }
    const owner = await this.users.findById(row.userId);
    if (owner && vendorHeld(owner.status)) {
      throw new NotFoundException('Listing is not available to book');
    }
    return row;
  }

  listingUnitPrice(row: VendorListing) {
    const amount = this.numericPrice(row);
    if (amount == null || amount <= 0) {
      throw new BadRequestException('This listing has no bookable price');
    }
    return amount;
  }

  private numericPrice(row: VendorListing) {
    const fields = row.fields ?? {};
    const amount = fields.price || fields.priceFrom || fields.feeFrom || fields.entryPrice || String(fields.visitCharge || '').replace(/[^\d.]/g, '');
    if (!amount) return null;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private unitWord(unit?: unknown) {
    const raw = String(unit ?? '')
      .trim()
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^per\s+/, '');
    if (!raw) return '';
    if (raw === 'hour' || raw === 'hourly') return 'hourly';
    if (raw === 'day' || raw === 'daily') return 'daily';
    if (raw === 'night') return 'night';
    if (raw === 'km') return 'km';
    if (raw === 'person') return 'person';
    if (raw === 'room') return 'room';
    if (raw === 'visit') return 'visit';
    if (raw === 'service') return 'service';
    if (raw === 'seat') return 'seat';
    if (raw === 'trip') return 'trip';
    if (raw === 'order') return 'order';
    if (raw === 'tray') return 'tray';
    if (raw === 'shift') return 'shift';
    return raw;
  }

  private priceLabel(row: VendorListing) {
    const fields = row.fields ?? {};
    const amount = fields.price || fields.priceFrom || fields.feeFrom || fields.perKm || fields.entryPrice;
    if (!amount) return '';
    const n = Number(amount);
    const formatted = Number.isFinite(n)
      ? `₹${n.toLocaleString('en-IN')}`
      : `₹${amount}`;
    if (row.category === 'tours') return `${formatted} person`;
    if (row.category === 'hotels') return `${formatted} ${this.unitWord(fields.priceUnit || 'night')}`;
    if (fields.perKm && !fields.price) return `${formatted} km`;
    const unit = this.unitWord(fields.priceUnit);
    return unit ? `${formatted} ${unit}` : formatted;
  }

  private eyebrow(row: VendorListing, distanceKm: number | null) {
    const fields = row.fields ?? {};
    if (row.category === 'tours') {
      return [fields.duration, fields.city || fields.destinations].filter(Boolean).join(' · ') || 'Tour';
    }
    if (distanceKm != null) return `${Number(distanceKm.toFixed(1))} km`;
    return fields.city || fields.area || LABELS[row.category] || row.category;
  }

  private toAdminListing(row: VendorListing, hold = false) {
    const fields = row.fields ?? {};
    const skip = new Set(['listedBy', 'latitude', 'longitude']);
    const details = Object.entries(fields)
      .filter(([key, value]) => Boolean(value) && !skip.has(key))
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
        value,
      }));
    if (row.latitude != null && row.longitude != null) {
      details.push({ key: 'coords', label: 'Map pin', value: `${row.latitude}, ${row.longitude}` });
    }
    return {
      ...this.toPost(row, null, hold),
      userId: row.userId,
      mobileNumber: row.mobileNumber,
      ownerName: fields.listedBy || fields.ownerName || fields.driverName || '',
      photoUrls: row.photoUrls ?? [],
      details,
      description: fields.description || '',
      createdAt: row.createdAt,
    };
  }

  private toDetail(row: VendorListing, hold = false) {
    const fields = row.fields ?? {};
    const hidden = new Set([
      'listedBy',
      'latitude',
      'longitude',
      'phone',
      'location',
      'licenseDocument',
      'rcDocument',
      'insuranceDocument',
      'pucDocument',
      'permitDocument',
      'serviceLocations',
    ]);
    const details = Object.entries(fields)
      .filter(([key, value]) => value && !hidden.has(key))
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
        value,
      }));
    return {
      ...this.toPost(row, null, hold),
      mobileNumber: row.mobileNumber,
      photoUrls: row.photoUrls ?? [],
      details,
      description: fields.description || '',
      price: fields.price || fields.priceFrom || fields.feeFrom || '',
      priceUnit: fields.priceUnit || '',
      catalogId: row.catalogId,
      partnerId: row.userId,
      unitPrice: this.numericPrice(row),
      bookable: !hold && row.status === ListingStatus.ACCEPTED && (this.numericPrice(row) ?? 0) > 0,
    };
  }

  private async notifyNewPost(listing: VendorListing) {
    try {
      await this.notes.notifyAdmins(
        NotificationType.SYSTEM,
        'New vendor post',
        `${listing.title} (${listing.category}) is waiting for review`,
        { href: '/admin/listings', listingId: listing.id, category: listing.category },
      );
    } catch {
      // Listing is already saved — do not fail the submit if notify fails.
    }
  }
}
