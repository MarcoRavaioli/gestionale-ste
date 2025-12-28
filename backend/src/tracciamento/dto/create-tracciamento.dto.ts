import {
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTracciamentoDto {
  @IsNotEmpty()
  @IsDateString()
  giorno: string;

  @IsNotEmpty()
  @IsNumber()
  ore_lavorate: number;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsBoolean()
  pasto_rimborsato?: boolean;

  @IsNotEmpty()
  @IsNumber()
  collaboratoreId: number;

  @IsOptional() // Opzionale se fa lavoro generico in sede
  @IsNumber()
  commessaId?: number;
}
