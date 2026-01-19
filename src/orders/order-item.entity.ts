import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ApiProperty({ type: () => Order })
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ApiProperty({ example: 'Cloud Mug Set' })
  @Column({ length: 120 })
  productName: string;

  @ApiProperty({ example: '/assets/products/cloud-mug.jpg' })
  @Column({ length: 255 })
  productImageUrl: string;

  @ApiProperty({ example: 28000 })
  @Column({ type: 'int' })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 56000 })
  @Column({ type: 'int' })
  lineTotal: number;
}
