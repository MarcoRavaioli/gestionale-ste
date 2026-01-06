import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateIndirizzoDto {
  @IsNotEmpty()
  @IsString()
  via: string;

  @IsNotEmpty()
  @IsString()
  civico: string;

  @IsNotEmpty()
  @IsString()
  citta: string;

  @IsNotEmpty()
  @IsString()
  cap: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  // Accettiamo l'oggetto cliente nidificato che manda il frontend
  @IsOptional()
  @IsObject()
  cliente?: { id: number };
}
