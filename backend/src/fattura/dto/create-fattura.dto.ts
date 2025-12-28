import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { TipoFattura } from '../../entities/fattura.entity'; // Importa l'Enum dall'entità centrale

export class CreateFatturaDto {
  @IsNotEmpty()
  @IsString()
  numero_fattura: string;

  @IsNotEmpty()
  @IsDateString()
  data_emissione: string; // "2025-01-30"

  @IsNotEmpty()
  @IsNumber()
  totale: number;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsNotEmpty()
  @IsEnum(TipoFattura)
  tipo: TipoFattura; // "entrata" o "uscita"

  @IsOptional()
  @IsDateString()
  data_scadenza?: string;

  @IsOptional()
  @IsBoolean()
  incassata?: boolean;

  // Opzionali perché se è una spesa generica (benzina) non servono
  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @IsNumber()
  commessaId?: number;
}
