import {Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Patch, Delete, Query} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RequireRoles } from '../auth/require-roles.decorator';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}
    
    @RequireRoles(['admin'])
    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.productsService.findAll(page, limit);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    @RequireRoles(['admin'])
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateProductDto: UpdateProductDto
    ) {
        return this.productsService.update(id, updateProductDto);
    }

    @RequireRoles(['admin'])
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.remove(id);
    }
}