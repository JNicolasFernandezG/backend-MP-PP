import { IsNumber, IsEmail } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNumber()
  productId: number;

  @IsEmail()
  userEmail: string;
}
