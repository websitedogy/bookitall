import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { slugify } from '../../common/utils/slugify';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchTourDto extends PaginationDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class UpsertTourDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  destination!: string;

  @IsString()
  city!: string;

  @IsNumber()
  durationDays!: number;

  @IsNumber()
  pricePerPerson!: number;

  @IsOptional()
  @IsNumber()
  groupSize?: number;

  @IsString()
  coverImageUrl!: string;

  @IsOptional()
  highlights?: string[];

  @IsOptional()
  itinerary?: string[];
}

@Injectable()
export class ToursService {
  constructor(@InjectRepository(Tour) private readonly tours: Repository<Tour>) {}

  async search(query: SearchTourDto) {
    const qb = this.tours.createQueryBuilder('tour').where('tour.isActive = true').andWhere('tour.deletedAt IS NULL');
    if (query.city) {
      qb.andWhere('(tour.city ILIKE :city OR tour.destination ILIKE :city)', { city: `%${query.city}%` });
    }
    if (query.q) {
      qb.andWhere('(tour.name ILIKE :q OR tour.description ILIKE :q)', { q: `%${query.q}%` });
    }
    qb.orderBy('tour.averageRating', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getBySlug(slug: string) {
    const tour = await this.tours.findOne({ where: { slug, isActive: true } });
    if (!tour) {
      throw new NotFoundException('Tour not found');
    }
    return tour;
  }

  async getById(id: string) {
    const tour = await this.tours.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException('Tour not found');
    }
    return tour;
  }

  listByPartner(partnerId: string) {
    return this.tours.find({ where: { partnerId }, order: { createdAt: 'DESC' } });
  }

  create(partnerId: string, dto: UpsertTourDto) {
    return this.tours.save(
      this.tours.create({
        ...dto,
        partnerId,
        slug: `${slugify(dto.name)}-${Date.now().toString(36)}`,
        pricePerPerson: dto.pricePerPerson.toFixed(2),
        groupSize: dto.groupSize ?? 20,
        highlights: dto.highlights ?? [],
        itinerary: dto.itinerary ?? [],
        imageUrls: [],
      }),
    );
  }
}
