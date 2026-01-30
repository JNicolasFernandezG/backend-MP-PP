import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async create(user: User | string, products: Product[], totalAmount: number, mercadoPagoId?: string) {
    const userRef = typeof user === 'string' ? { id: user } : user;
    const order = this.ordersRepository.create({
      user: userRef,
      products,
      totalAmount,
      status: 'pending',
      mercadoPagoId,
    });
    return await this.ordersRepository.save(order);
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }
    return order;
  }

  async findByMercadoPagoId(mercadoPagoId: string) {
    return await this.ordersRepository.findOneBy({ mercadoPagoId });
  }

  async setMercadoPagoId(id: string, mercadoPagoId: string) {
    const order = await this.findOne(id);
    order.mercadoPagoId = mercadoPagoId;
    return await this.ordersRepository.save(order);
  }

  async updateStatus(id: string, status: string, paymentId?: string) {
    const order = await this.findOne(id);
    order.status = status;
    if (paymentId) order.paymentId = paymentId;
    return await this.ordersRepository.save(order);
  }

  async findByUser(userId: string) {
    return await this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: ['products'],
    });
  }
}
