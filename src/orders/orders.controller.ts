import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    try {
      const order = await this.ordersService.findOne(id);
      return {
        orderId: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
      };
    } catch (error) {
      throw new NotFoundException('Orden no encontrada');
    }
  }
}
