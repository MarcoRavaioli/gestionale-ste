import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateAppuntamentoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsDateString()
  @IsNotEmpty()
  data_ora: string;

  @IsString()
  @IsOptional()
  descrizione?: string;

  @IsOptional()
  commessa?: { id: number };

  // FASE 2: Collegamenti diretti opzionali
  @IsOptional()
  indirizzo?: { id: number }; 

  @IsOptional()
  cliente?: { id: number };
}