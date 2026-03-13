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
  valore_totale?: number;

  @IsString()
  @IsOptional()
  stato?: string;

  @IsOptional()
  indirizzo?: { id: number };

  // FASE 2: Aggiunto il collegamento diretto e opzionale al Cliente
  @IsOptional()
  cliente?: { id: number }; 
}