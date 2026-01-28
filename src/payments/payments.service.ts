import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    // private readonly usersService: UsersService, // Descomenta cuando lo tengas listo
  ) {
    const token = this.configService.get<string>('MP_ACCESS_TOKEN');
    
    if (!token) {
      throw new Error('MP_ACCESS_TOKEN no encontrado en el archivo .env');
    }

    this.client = new MercadoPagoConfig({
      accessToken: token,
    });
  }

  /**
   * 1. CREAR PREFERENCIA PARA PAGOS ÚNICOS
   */
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

  /**
   * 2. VERIFICAR PAGO ÚNICO (VÍA WEBHOOK)
   */
  async verifyPayment(paymentId: string) {
    try {
      const payment = await new Payment(this.client).get({ id: paymentId });

      if (payment.status === 'approved') {
        console.log('--- PAGO ÚNICO APROBADO ---');
        console.log(`ID Pago: ${paymentId}`);
        console.log(`Monto: ${payment.transaction_amount}`);
        console.log(`Usuario: ${payment.payer?.email}`);
        
        // Aquí podrías registrar la venta en tu base de datos de órdenes
      } else {
        console.log(`Estado del pago ${paymentId}: ${payment.status}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error al verificar el pago:', error);
      throw new InternalServerErrorException('Error al verificar el pago');
    }
  }

  /**
   * 3. CREAR SUSCRIPCIÓN (MENSUALIDADES)
   */
  async createSubscription(productId: number, userEmail: string) {
    try {
      const productDB = await this.productsService.findOne(productId);

      if (!productDB) {
        throw new BadRequestException(`El plan con ID ${productId} no existe`);
      }

      // IMPORTANTE: Tu entidad Product debe tener el campo isSubscription
      if (!productDB.isSubscription) {
        throw new BadRequestException('Este producto no está configurado como suscripción mensual');
      }

      const baseUrl = this.configService.get<string>('BASE_URL');
      const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

      const subscription = await new PreApproval(this.client).create({
        body: {
          reason: productDB.name, 
          payer_email: userEmail, 
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months', 
            transaction_amount: Number(productDB.price), 
            currency_id: 'ARS',
          },
          back_url: `${baseUrl}/payments/success-subscription`,
          status: 'pending',
        },
      });

      return {
        init_point: subscription.init_point,
      };
    } catch (error) {
      console.error('Error al crear suscripción de MP:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al procesar la suscripción mensual');
    }
  }

  /**
   * 4. VERIFICAR SUSCRIPCIÓN (VÍA WEBHOOK)
   */
  async verifySubscription(preapprovalId: string) {
    try {
      const subscription = await new PreApproval(this.client).get({ id: preapprovalId });
      
      console.log('--- NOTIFICACIÓN DE SUSCRIPCIÓN ---');
      console.log(`ID Suscripción: ${preapprovalId}`);
      console.log(`Estado: ${subscription.status}`);
      console.log(`Usuario: ${subscription.payer_email}`);
      
      if (subscription.status === 'authorized') {
        console.log(`¡Suscripción exitosa para: ${subscription.payer_email}! Activando acceso...`);
        
        // ACCIÓN REAL: Actualizar al usuario en tu base de datos
        // await this.usersService.updateMembership(subscription.payer_email, {
        //   isPremium: true,
        //   subscriptionId: preapprovalId
        // });
      }
      
      return { received: true };
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
      return { received: false };
    }
  }
}