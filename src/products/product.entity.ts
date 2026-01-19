import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({ example: 'Cloud Mug Set' })
  @Column({ length: 120 })
  name: string;

  @ApiProperty({ example: 'Soft matte mugs with cloud glaze finish.' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: '/assets/products/cloud-mug.jpg' })
  @Column({ length: 255 })
  imageUrl: string;

  @ApiProperty({ example: 28000 })
  @Column({ type: 'int' })
  price: number;

  @ApiProperty({ example: 'KRW' })
  @Column({ length: 20, default: 'KRW' })
  currency: string;
}
