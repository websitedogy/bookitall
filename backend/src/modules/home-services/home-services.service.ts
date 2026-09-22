import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeService } from './entities/home-service.entity';
import { slugify } from '../../common/utils/slugify';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchHomeServiceDto extends PaginationDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class UpsertHomeServiceDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsNumber()
  basePrice!: number;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsString()
  city!: string;

  @IsString()
  coverImageUrl!: string;
}

@Injectable()
export class HomeServicesService {
  constructor(@InjectRepository(HomeService) private readonly services: Repository<HomeService>) {}

  async search(query: SearchHomeServiceDto) {
    const qb = this.services.createQueryBuilder('s').where('s.isActive = true').andWhere('s.deletedAt IS NULL');
    if (query.city) {
      qb.andWhere('s.city ILIKE :city', { city: `%${query.city}%` });
    }
    if (query.category) {
      qb.andWhere('s.category ILIKE :category', { category: `%${query.category}%` });
    }
    if (query.q) {
      qb.andWhere('(s.name ILIKE :q OR s.description ILIKE :q)', { q: `%${query.q}%` });
    }
    qb.orderBy('s.averageRating', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getBySlug(slug: string) {
    const service = await this.services.findOne({ where: { slug, isActive: true } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async getById(id: string) {
    const service = await this.services.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  listByPartner(partnerId: string) {
    return this.services.find({ where: { partnerId }, order: { createdAt: 'DESC' } });
  }

  create(partnerId: string, dto: UpsertHomeServiceDto) {
    return this.services.save(
      this.services.create({
        ...dto,
        partnerId,
        slug: `${slugify(dto.name)}-${Date.now().toString(36)}`,
        basePrice: dto.basePrice.toFixed(2),
        durationMinutes: dto.durationMinutes ?? 60,
      }),
    );
  }
}
