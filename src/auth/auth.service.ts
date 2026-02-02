import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/user.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
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
    };
    
    return {
        access_token: await this.jwtService.signAsync(payload),
        user: {
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            subscriptionId: user.subscriptionId || null,
        }
    };
  }
}