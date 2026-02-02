import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './user.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { PasswordResetToken } from '../auth/entities/password-reset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, PasswordResetToken])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}