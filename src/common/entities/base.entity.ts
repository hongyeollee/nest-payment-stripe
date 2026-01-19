import { ApiProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @ApiProperty({ example: '7a28b150-6784-4b7a-9d44-3ef7b39b8f8d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '2026-01-19T12:00:00.000Z' })
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-19T12:00:00.000Z' })
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
