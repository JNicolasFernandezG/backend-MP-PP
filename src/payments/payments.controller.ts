import { Controller, Post, Body, UseGuards, Query, Req, BadRequestException, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create-preference')
  async createPreference(@Body() createPreferenceDto: CreatePreferenceDto, @Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id || 'anonymous';
      return await this.paymentsService.createMercadoPagoPreference(createPreferenceDto.items, userId);
    } catch (error) {
      this.logger.error(`Error creating preference: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Post('create-subscription')
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Req() req: any
  ) {
    try {
      const userEmail = req.user.email;
      if (!userEmail) {
        throw new BadRequestException('Email del usuario no encontrado en token');
      }
      return await this.paymentsService.createSubscription(
        createSubscriptionDto.productId,
        userEmail
      );
    } catch (error) {
      this.logger.error(`Error creating subscription: ${error.message}`);
      throw error;
    }
  }

  @Post('webhook')
  async handleWebhook(@Query() query: any, @Body() body: any, @Req() req: any) {
    try {
      // Validar firma X-Signature de MercadoPago (CRÍTICO en producción)
      const xSignature = req.headers['x-signature'];
      const xRequestId = req.headers['x-request-id'];

      if (!xSignature || !xRequestId) {
        this.logger.warn('Webhook recibido sin X-Signature o X-Request-ID');
        // En development, permitir sin firma; en production, rechazar
        if (this.configService.get<string>('NODE_ENV') === 'production') {
          throw new BadRequestException('Firma de seguridad no proporcionada');
        }
      } else {
        // Validar la firma
        const isValidSignature = this.validateWebhookSignature(
          xRequestId,
          xSignature,
          JSON.stringify(body),
        );

        if (!isValidSignature && this.configService.get<string>('NODE_ENV') === 'production') {
          this.logger.error(`Webhook con firma inválida detectado`);
          throw new BadRequestException('Firma de seguridad inválida');
        }
      }

      // Procesar webhook según tipo
      if (query.type === 'payment') {
        const paymentId = query['data.id'];
        if (!paymentId) {
          throw new BadRequestException('Payment ID no proporcionado');
        }
        return await this.paymentsService.verifyPayment(paymentId);
      }

      if (body.type === 'subscription_preapproval' || query.type === 'preapproval') {
        const subscriptionId = body.data?.id || query['data.id'];
        if (!subscriptionId) {
          throw new BadRequestException('Subscription ID no proporcionado');
        }
        return await this.paymentsService.verifySubscription(subscriptionId);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validar firma X-Signature del webhook de MercadoPago
   * Formato: SHA256=valor1,valor2,...
   */
  private validateWebhookSignature(requestId: string, signature: string, body: string): boolean {
    try {
      const secret = this.configService.get<string>('MP_WEBHOOK_SECRET');
      if (!secret) {
        this.logger.warn('MP_WEBHOOK_SECRET no configurado - validación deshabilitada');
        return false;
      }

      // Construir string para validar: requestId + secret + body
      const validationString = `id=${requestId};${body}`;

      // Crear HMAC-SHA256
      const hash = crypto
        .createHmac('sha256', secret)
        .update(validationString)
        .digest('base64');

      // Signature viene en formato SHA256=valor
      const receivedHash = signature.split('=')[1];

      // Comparación segura contra timing attacks
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(receivedHash));
    } catch (error) {
      this.logger.error(`Error validando firma webhook: ${error.message}`);
      return false;
    }
  }
}