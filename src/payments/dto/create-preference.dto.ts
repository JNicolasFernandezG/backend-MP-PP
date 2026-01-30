import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PreferenceItemDto {
  @IsString()
  id: string;

  @IsNumber()
  quantity: number;
}

export class CreatePreferenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceItemDto)
  items: PreferenceItemDto[];
}
