import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordResetToken } from '../auth/entities/password-reset.entity';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetRepository: Repository<PasswordResetToken>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, email } = createUserDto;

    const userExist = await this.userRepository.findOneBy({ email });
    if (userExist) throw new BadRequestException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    
    const savedUser = await this.userRepository.save(user);
    const { password: _, createdAt, updatedAt, ...userData } = savedUser;
    return userData;
  }

  async createPasswordResetToken(userId: string) {
    const user = await this.findOneById(userId);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const pr = this.passwordResetRepository.create({
      token,
      user,
      expiresAt,
    });

    return await this.passwordResetRepository.save(pr);
  }

  async findValidPasswordResetToken(token: string) {
    const pr = await this.passwordResetRepository.findOne({ where: { token, used: false } });
    if (!pr) return null;
    if (pr.expiresAt < new Date()) return null;
    return pr;
  }

  async markPasswordResetTokenUsed(id: string) {
    const pr = await this.passwordResetRepository.findOneBy({ id });
    if (!pr) return null;
    pr.used = true;
    return await this.passwordResetRepository.save(pr);
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    const pr = await this.findValidPasswordResetToken(token);
    if (!pr) throw new NotFoundException('Token inválido o expirado');

    const user = pr.user;
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    pr.used = true;
    await this.passwordResetRepository.save(pr);

    return { success: true };
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'isPremium', 'subscriptionId'], 
    });
  }

  async findOneById(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async updateSubscriptionStatus(userId: string, updates: { isPremium: boolean; subscriptionId?: string; subscriptionStartDate?: Date; subscriptionEndDate?: Date }) {
    const user = await this.findOneById(userId);
    
    Object.assign(user, updates);
    
    return await this.userRepository.save(user);
  }

}