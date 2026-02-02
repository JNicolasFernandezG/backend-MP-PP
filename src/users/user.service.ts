import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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