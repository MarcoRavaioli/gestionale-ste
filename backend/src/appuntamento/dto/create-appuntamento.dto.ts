import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateAppuntamentoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsDateString()
  data_ora: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsNotEmpty()
  @IsObject()
  commessa: { id: number }; // Obbligatorio

  // Opzionale: Array di ID collaboratori
  @IsOptional()
  collaboratori?: { id: number }[];
}
