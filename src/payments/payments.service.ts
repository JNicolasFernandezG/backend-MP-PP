import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;

  constructor(private configService: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get<string>('MP_ACCESS_TOKEN') || '',
    });
  }

  async createMercadoPagoPreference(items: any[]) {
    try {
      const preference = await new Preference(this.client).create({
        body: {
          items: items.map((item) => ({
            id: item.id,
            title: item.name,
            unit_price: Number(item.price),
            quantity: Number(item.quantity),
            currency_id: 'ARS',
          })),
          back_urls: {
            success: 'http://localhost:3000/payments/success',
            failure: 'http://localhost:3000/payments/failure',
            pending: 'http://localhost:3000/payments/pending',
          },
          auto_return: 'approved',
        },
      });

      return { init_point: preference.init_point };
    } catch (error) {
      console.error('Error MP:', error);
      throw new Error('Error al crear la preferencia de pago');
    }
  }
}