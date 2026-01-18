import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIndirizzoDto {
  @IsString()
  @IsNotEmpty()
  via: string;

  @IsString()
  @IsOptional()
  civico?: string; // <--- Mancava

  @IsString()
  @IsNotEmpty()
  citta: string;

  @IsString()
  @IsOptional()
  provincia?: string; // <--- Mancava

  @IsString()
  @IsOptional()
  cap?: string;

  @IsString()
  @IsOptional()
  stato?: string; // <--- Mancava

  @IsOptional()
  cliente?: any;
}
