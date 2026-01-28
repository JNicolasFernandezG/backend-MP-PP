import { Controller, Post, Body, UseGuards, Query, Req } from '@nestjs/common';
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

  @UseGuards(AuthGuard)
  @Post('create-subscription')
  async createSubscription(
    @Body('productId') productId: number, 
    @Req() req: any
  ) {
    const userEmail = req.user.email; 
    return await this.paymentsService.createSubscription(productId, userEmail);
    }

  @Post('webhook')
  async handleWebhook(@Query() query: any, @Body() body: any) {
    
    if (query.type === 'payment') {
      const paymentId = query['data.id'];
      return this.paymentsService.verifyPayment(paymentId);
    }

    if (body.type === 'subscription_preapproval' || query.type === 'preapproval') {
      const subscriptionId = body.data?.id || query['data.id'];
      return this.paymentsService.verifySubscription(subscriptionId);
    }

    return { received: true };
  }

}