import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    create(createProductDto: CreateProductDto) {
        return 'producto creado';
    }

    findAll() {
        return `lista de productos`;
    }

    findOne(id: number) {
        return `producto ${id}`;
    }
}