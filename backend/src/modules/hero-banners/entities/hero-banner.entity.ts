import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'hero_banners' })
export class HeroBanner extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  slug!: string;

  @Column({ type: 'varchar', length: 80 })
  title!: string;

  @Column({ type: 'varchar', length: 180 })
  href!: string;

  @Column({ type: 'varchar', length: 240 })
  image!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;
}
