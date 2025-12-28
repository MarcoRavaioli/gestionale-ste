import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCommessaDto {
  // Il seriale è obbligatorio (es. "CANT-2025-01")
  @IsNotEmpty()
  @IsString()
  seriale: string;

  // La descrizione è opzionale
  @IsOptional()
  @IsString()
  descrizione?: string;

  // Lo stato è opzionale (se manca, il DB metterà "APERTA")
  @IsOptional()
  @IsString()
  stato?: string;

  // Fondamentale: dobbiamo sapere a quale cliente collegare la commessa
  @IsNotEmpty()
  @IsNumber()
  clienteId: number;
}
