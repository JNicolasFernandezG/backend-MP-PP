import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
  ) {

    const token = this.configService.get<string>('MP_ACCESS_TOKEN');
    
    if (!token) {
      throw new Error('MP_ACCESS_TOKEN no encontrado en el archivo .env');
    }

    this.client = new MercadoPagoConfig({
      accessToken: token,
    });
  }


  async createMercadoPagoPreference(items: { id: string; quantity: number }[]) {
    try {

      const itemsValidated = await Promise.all(
        items.map(async (item) => {
          const productDB = await this.productsService.findOne(Number(item.id));

          if (!productDB) {
            throw new BadRequestException(`El producto con ID ${item.id} no existe`);
          }

          return {
            id: String(productDB.id),
            title: productDB.name,
            unit_price: Number(productDB.price),
            quantity: Number(item.quantity),
            currency_id: 'ARS',
          };
        }),
      );

        const baseUrl = this.configService.get<string>('BASE_URL');
        const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

      const preference = await new Preference(this.client).create({
        body: {
          items: itemsValidated,
          notification_url: webhookUrl,
          back_urls: {
            success: `${baseUrl}/payments/success`,
            failure: `${baseUrl}/payments/failure`,
            pending: `${baseUrl}/payments/pending`,
          },
          auto_return: 'approved',
        },
      });

      return {
        init_point: preference.init_point,
      };
    } catch (error) {
      console.error('Error al crear preferencia de MP:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al procesar el pago con Mercado Pago');
    }
  }


  async verifyPayment(paymentId: string) {
    try {

      const payment = await new Payment(this.client).get({ id: paymentId });

      if (payment.status === 'approved') {
        console.log(`Pago aprobado: ${paymentId}`);
        console.log(`Monto: ${payment.transaction_amount}`);
        
      } else {
        console.log(`Estado del pago ${paymentId}: ${payment.status}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error al verificar el pago:', error);
      throw new InternalServerErrorException('Error al verificar el pago');
    }
  }
}