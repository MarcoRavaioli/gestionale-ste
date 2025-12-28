import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateCollaboratoreDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  cognome: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La password deve essere di almeno 6 caratteri' })
  password: string;

  @IsOptional()
  @IsString()
  ruolo?: string;
}
