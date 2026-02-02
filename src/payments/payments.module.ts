import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [AuthModule, ProductsModule, OrdersModule, UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}