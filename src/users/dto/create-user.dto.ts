import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email debe ser un email válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password debe tener mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password debe contener mayúscula, minúscula y número',
  })
  password: string;
}