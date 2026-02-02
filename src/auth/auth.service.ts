import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { UsersService } from "../users/user.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signIn(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      subscriptionId: user.subscriptionId || null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        subscriptionId: user.subscriptionId || null,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) return { success: true };

    const pr = await this.usersService.createPasswordResetToken(user.id);
    
    try {
      await this.emailService.sendPasswordReset(user.email, pr.token);
      this.logger.log(`Email de recuperación enviado a: ${email}`);
    } catch (err) {
      this.logger.error(`Fallo al enviar email a ${email}: ${err.message}`);
    }

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    // Validar password strength
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('Password debe tener mínimo 8 caracteres');
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new UnauthorizedException('Password debe contener mayúscula, minúscula y número');
    }

    await this.usersService.resetPasswordWithToken(token, newPassword);
    return { success: true };
  }

}