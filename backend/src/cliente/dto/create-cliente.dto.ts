import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  @IsEmail() // Controlla anche che sia un'email valida (es. a@b.it)
  email?: string;
}
