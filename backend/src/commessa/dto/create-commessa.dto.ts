import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';

export class CreateCommessaDto {
  @IsNotEmpty()
  @IsString()
  seriale: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsString()
  stato?: string;

  @IsOptional()
  @IsNumber()
  valore_totale?: number;

  // CAMBIAMENTO: Ora ci serve l'indirizzo, non il cliente
  @IsNotEmpty()
  @IsObject()
  indirizzo: { id: number };
}
