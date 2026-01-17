import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateTracciamentoDto {
  @IsDateString()
  giorno: string;

  @IsNumber()
  @Min(0) // Non puoi lavorare ore negative
  @Max(24) // Non puoi lavorare più di 24 ore
  ore_lavorate: number;

  @IsBoolean()
  buono_pasto: boolean;

  @IsOptional()
  @IsString()
  descrizione?: string;
}
