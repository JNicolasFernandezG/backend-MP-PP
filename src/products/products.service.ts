import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product) 
        private readonly productsRepository: Repository<Product>,
    ) {}
    async create(createProductDto: CreateProductDto) {
        const product = this.productsRepository.create(createProductDto);
        return await this.productsRepository.save(product);
    }

    async findAll() {
        return await this.productsRepository.find();
    }

    async findOne(id: number) {
        const product = await this.productsRepository.findOneBy({ id });
        if (!product) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }
        return product;
    }

    async remove(id: number) {
        const result = await this.productsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }
        return { message: `Producto con ID ${id} eliminado correctamente` };
    }

    async update(id: number, updateProductDto: Partial<CreateProductDto>) {
        const product = await this.productsRepository.preload({
            id,
            ...updateProductDto
        });
        if (!product) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }
        return await this.productsRepository.save(product);
    }    
}