import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAllegatoDto {
  // Il "file" viaggia come binario, qui validiamo solo il link alla commessa
  @IsNotEmpty()
  @Type(() => Number) // Importante perché nei form-data i numeri arrivano come stringhe
  @IsNumber()
  commessaId: number;
}