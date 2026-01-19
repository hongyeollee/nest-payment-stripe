import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  findAll() {
    return this.productsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findByIds(ids: string[]) {
    if (!ids.length) {
      return [];
    }

    return this.productsRepository.findBy({ id: In(ids) });
  }

  async seedDefaults() {
    const count = await this.productsRepository.count();
    if (count > 0) {
      return;
    }

    const items = this.productsRepository.create([
      {
        name: 'Cloud Mug Set',
        description: 'Soft matte mugs with cloud glaze finish.',
        imageUrl: '/assets/products/cloud-mug.jpg',
        price: 28000,
        currency: 'KRW',
      },
      {
        name: 'Midnight Tote',
        description: 'Structured tote with wide strap and inner pouch.',
        imageUrl: '/assets/products/midnight-tote.jpg',
        price: 54000,
        currency: 'KRW',
      },
      {
        name: 'Daybreak Candle',
        description: 'Cedar & citrus blend in reusable ceramic cup.',
        imageUrl: '/assets/products/daybreak-candle.jpg',
        price: 22000,
        currency: 'KRW',
      },
      {
        name: 'Studio Notebook',
        description: 'Grid notebook with recycled paper and linen cover.',
        imageUrl: '/assets/products/studio-notebook.jpg',
        price: 16000,
        currency: 'KRW',
      },
    ]);

    await this.productsRepository.save(items);
  }
}
