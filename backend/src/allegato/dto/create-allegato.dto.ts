import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAllegatoDto {
  @IsOptional()
  @Type(() => Number) // Importante perché nei form-data i numeri arrivano come stringhe
  @IsNumber()
  commessaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  indirizzoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  appuntamentoId?: number;
}
