import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { HotelRoomType } from './entities/hotel-room-type.entity';
import { SearchHotelDto, UpsertHotelDto, UpsertRoomTypeDto, VendorHotelListingDto } from './dto/hotel.dto';
import { slugify } from '../../common/utils/slugify';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { REDIS_KEYS } from '../../common/constants/app.constants';
import { UsersService } from '../users/users.service';
import { VendorListingsService } from '../vendor-listings/vendor-listings.service';
import { geocodeIndiaAddress, isUsableCoord } from '../../common/utils/geocode';

function starFromCategory(label?: string) {
  if (!label) return 3;
  const n = Number(label.replace(/\D/g, ''));
  if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  if (/budget/i.test(label)) return 2;
  if (/boutique|heritage/i.test(label)) return 4;
  return 3;
}

function parseRoomRates(text?: string) {
  if (!text) return [];
  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, rest = ''] = part.split(':').map((item) => item.trim());
      const bits = rest.split('/').map((item) => item.trim());
      const price = Number((bits[0] || '').replace(/[^\d.]/g, ''));
      const occupancy = Number((bits[1] || '').replace(/[^\d]/g, '')) || 2;
      const total = Number((bits[2] || '').replace(/[^\d]/g, '')) || 1;
      return {
        name,
        price: Number.isFinite(price) ? price : 0,
        occupancy,
        total,
      };
    })
    .filter((room) => room.name);
}

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel) private readonly hotels: Repository<Hotel>,
    @InjectRepository(HotelRoomType) private readonly rooms: Repository<HotelRoomType>,
    private readonly redis: RedisService,
    private readonly users: UsersService,
    private readonly vendorListings: VendorListingsService,
  ) {}

  async search(query: SearchHotelDto) {
    const cacheKey = REDIS_KEYS.searchCache(`hotels:${JSON.stringify(query)}`);
    const cached = await this.redis.getJson<{ data: Hotel[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const qb = this.hotels
      .createQueryBuilder('hotel')
      .leftJoin(HotelRoomType, 'room', 'room.hotelId = hotel.id')
      .where('hotel.isActive = true')
      .andWhere('hotel.deletedAt IS NULL');

    if (query.city) {
      qb.andWhere('hotel.city ILIKE :city', { city: `%${query.city}%` });
    }
    if (query.q) {
      qb.andWhere('(hotel.name ILIKE :q OR hotel.description ILIKE :q)', { q: `%${query.q}%` });
    }
    if (query.stars) {
      qb.andWhere('hotel.starRating >= :stars', { stars: query.stars });
    }
    if (query.minPrice) {
      qb.andWhere('room.pricePerNight >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice) {
      qb.andWhere('room.pricePerNight <= :maxPrice', { maxPrice: query.maxPrice });
    }

    qb.orderBy('hotel.averageRating', 'DESC').addOrderBy('hotel.starRating', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    await this.attachRooms(data);
    const result = { data, total };
    await this.redis.setJson(cacheKey, result, 60);
    return result;
  }

  async getBySlug(slug: string) {
    const hotel = await this.hotels.findOne({
      where: { slug, isActive: true },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    await this.attachRooms([hotel]);
    return hotel;
  }

  async getById(id: string) {
    const hotel = await this.hotels.findOne({ where: { id } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    await this.attachRooms([hotel]);
    return hotel;
  }

  async listByPartner(partnerId: string) {
    const hotels = await this.hotels.find({
      where: { partnerId },
      order: { createdAt: 'DESC' },
    });
    await this.attachRooms(hotels);
    return hotels;
  }

  async create(partnerId: string, dto: UpsertHotelDto) {
    const hotel = await this.hotels.save(
      this.hotels.create({
        ...dto,
        partnerId,
        slug: `${slugify(dto.name)}-${Date.now().toString(36)}`,
        starRating: dto.starRating ?? 4,
        imageUrls: dto.imageUrls ?? [],
        amenities: dto.amenities ?? [],
        country: 'India',
      }),
    );
    return hotel;
  }

  async createVendorListing(userId: string, dto: VendorHotelListingDto, photoPaths: string[]) {
    await this.vendorListings.assertCategoryAvailable(userId, 'hotels');
    const user = await this.users.getOrFail(userId);
    await this.users.markHotelVendor(userId, dto.hotelName.trim(), dto.mobileNumber.trim());

    const price = Number(dto.price);
    const entryPrice = dto.entryPrice ? Number(dto.entryPrice) : null;
    const priceUnit = dto.priceUnit === 'PER_DAY' ? 'PER_DAY' : 'PER_ROOM';
    const coverImageUrl = photoPaths[0] || '/banners/hotels.jpg';
    const location = dto.location.trim();
    const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
    const state = dto.state?.trim() || (parts.length > 1 ? parts[parts.length - 1] : 'India');
    const city = dto.city?.trim() || dto.district?.trim() || (parts.length > 1 ? parts[parts.length - 2] : parts[0] || location);
    const extras = [
      dto.roomFeatures,
      dto.facilities,
      dto.suitableFor,
      dto.bookingMode,
      dto.cancellation,
      dto.meals,
      dto.houseRules,
    ]
      .flatMap((value) => (value ? value.split(',').map((part) => part.trim()).filter(Boolean) : []))
      .filter((item, index, list) => list.indexOf(item) === index);

    const givenLat = Number(dto.latitude);
    const givenLng = Number(dto.longitude);
    const pin = isUsableCoord(givenLat, givenLng)
      ? { lat: givenLat, lng: givenLng }
      : (await geocodeIndiaAddress(location, city, state)) ?? { lat: 0, lng: 0 };

    const hotel = await this.hotels.save(
      this.hotels.create({
        partnerId: userId,
        name: dto.hotelName.trim(),
        slug: `${slugify(dto.hotelName)}-${Date.now().toString(36)}`,
        description: dto.description?.trim() || `${dto.hotelType} with ${dto.roomType} rooms in ${location}. Listed by ${user.fullName}.`,
        city,
        state,
        country: 'India',
        address: location,
        latitude: pin.lat,
        longitude: pin.lng,
        starRating: starFromCategory(dto.starCategory),
        coverImageUrl,
        imageUrls: photoPaths,
        amenities: extras.length ? extras : [dto.hotelType, dto.roomType, priceUnit === 'PER_DAY' ? 'Per day' : 'Per room'],
        isActive: false,
        contactPhone: dto.mobileNumber.replace(/\s/g, ''),
        hotelType: dto.hotelType,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        entryPrice: entryPrice != null && Number.isFinite(entryPrice) ? entryPrice.toFixed(2) : null,
        priceUnit,
      }),
    );

    const parsedRooms = parseRoomRates(dto.roomRates);
    const roomRows = parsedRooms.length
      ? parsedRooms
      : [
          {
            name: dto.roomType,
            price: Number.isFinite(price) ? price : 0,
            occupancy: 2,
            total: 1,
          },
        ];
    await this.rooms.save(
      roomRows.map((room) =>
        this.rooms.create({
          hotelId: hotel.id,
          name: room.name,
          description: priceUnit === 'PER_DAY' ? 'Priced per day' : 'Priced per night',
          maxGuests: room.occupancy,
          pricePerNight: room.price.toFixed(2),
          totalRooms: room.total,
          amenities: extras.length ? extras : [room.name],
          imageUrl: photoPaths[0] ?? null,
        }),
      ),
    );

    await this.attachRooms([hotel]);
    await this.vendorListings.addPost({
      userId,
      category: 'hotels',
      title: dto.hotelName.trim(),
      mobileNumber: dto.mobileNumber.replace(/\s/g, ''),
      fields: {
        listedBy: user.fullName,
        location,
        city,
        state,
        hotelType: dto.hotelType,
        roomType: dto.roomType,
        price: dto.price,
        priceUnit,
        latitude: String(hotel.latitude),
        longitude: String(hotel.longitude),
        shopName: dto.shopName || dto.hotelName.trim(),
        propertyType: dto.propertyType || dto.hotelType,
        stayKind: dto.stayKind || (dto.hotelType === 'Homestay' ? 'homestay' : 'hotel'),
        hostOnProperty: dto.hostOnProperty || '',
        meals: dto.meals || '',
        houseRules: dto.houseRules || '',
        maxGuests: dto.maxGuests || '',
        starCategory: dto.starCategory || '',
        checkPolicy: dto.checkPolicy || '',
        roomRates: dto.roomRates || '',
        roomFeatures: dto.roomFeatures || '',
        facilities: dto.facilities || '',
        suitableFor: dto.suitableFor || '',
        bookingMode: dto.bookingMode || '',
        cancellation: dto.cancellation || '',
        extraGuestCharge: dto.extraGuestCharge || '',
        childPolicy: dto.childPolicy || '',
        advanceNotice: dto.advanceNotice || '',
        booking24x7: dto.booking24x7 || '',
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        description: dto.description?.trim() || '',
      },
      photoUrls: photoPaths,
      catalogId: hotel.id,
    });
    return hotel;
  }

  async update(partnerId: string, id: string, dto: Partial<UpsertHotelDto>) {
    const hotel = await this.getById(id);
    if (hotel.partnerId !== partnerId) {
      throw new NotFoundException('Hotel not found');
    }
    Object.assign(hotel, dto);
    return this.hotels.save(hotel);
  }

  async addRoomType(partnerId: string, hotelId: string, dto: UpsertRoomTypeDto) {
    const hotel = await this.getById(hotelId);
    if (hotel.partnerId !== partnerId) {
      throw new NotFoundException('Hotel not found');
    }
    return this.rooms.save(
      this.rooms.create({
        hotelId,
        ...dto,
        pricePerNight: dto.pricePerNight.toFixed(2),
        totalRooms: dto.totalRooms ?? 5,
        amenities: dto.amenities ?? [],
      }),
    );
  }

  private async attachRooms(hotels: Hotel[]) {
    if (!hotels.length) {
      return;
    }
    const rooms = await this.rooms.find({ where: { hotelId: In(hotels.map((hotel) => hotel.id)) } });
    const byHotel = new Map<string, HotelRoomType[]>();
    for (const room of rooms) {
      const list = byHotel.get(room.hotelId) ?? [];
      list.push(room);
      byHotel.set(room.hotelId, list);
    }
    for (const hotel of hotels) {
      hotel.roomTypes = byHotel.get(hotel.id) ?? [];
    }
  }
}
