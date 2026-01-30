import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email debe ser un email válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password debe tener mínimo 6 caracteres' })
  password: string;
}
