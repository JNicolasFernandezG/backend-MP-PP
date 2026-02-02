import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST not configured; emails will not be sent');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.configService.get<number>('SMTP_PORT') || 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    if (!this.transporter) {
      this.logger.warn('Transporter not configured; skipping email send');
      return null;
    }

    const from = this.configService.get<string>('FROM_EMAIL') || this.configService.get<string>('SMTP_USER');
    const appUrl = this.configService.get<string>('FRONTEND_URL') || this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    const info = await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Restablecer contraseña',
      text: `Usa este enlace para restablecer tu contraseña: ${resetLink}`,
      html: `<p>Haz clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña. El enlace expira en 1 hora.</p>`,
    });

    this.logger.log(`Password reset email sent: ${info.messageId}`);
    return info;
  }
}
