import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  @IsOptional()
  isSubscription?: boolean;
}