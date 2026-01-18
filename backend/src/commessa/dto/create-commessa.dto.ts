import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateCommessaDto {
  @IsString()
  @IsNotEmpty()
  seriale: string;

  @IsString()
  @IsOptional()
  descrizione?: string;

  @IsNumber()
  @IsOptional()
  valore_totale?: number; // <--- Fondamentale

  @IsString()
  @IsOptional()
  stato?: string; // <--- Fondamentale (APERTA/CHIUSA...)

  @IsOptional()
  indirizzo?: any;
}
