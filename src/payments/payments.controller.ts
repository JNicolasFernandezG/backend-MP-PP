import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Post('create-preference')
  async createPreference(@Body('items') items: any[]) {
    return await this.paymentsService.createMercadoPagoPreference(items);
  }


  @Post('webhook')
async handleWebhook(@Query() query: any) {
  if (query.type === 'payment') {
    const paymentId = query['data.id'];
    return this.paymentsService.verifyPayment(paymentId);
  }
  return { received: true };
  }
}