import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Definiamo la struttura per i nuovi indirizzi
class CreateIndirizzoDto {
  via: string;
  civico: string;
  citta: string;
  cap: string;

  @IsOptional()
  provincia?: string; // Ora è opzionale anche qui
}

// Definiamo la struttura per il nuovo cliente
class CreateNuovoClienteDto {
  nome: string;
  telefono?: string;
  email?: string;

  // Qui gestiamo l'array di indirizzi
  indirizzi?: CreateIndirizzoDto[];
}

export class CreateAppuntamentoDto {
  nome: string;
  data_ora: string;
  descrizione?: string;

  // Opzione A: Uso un ID esistente
  @IsOptional()
  clienteId?: number;

  // Opzione B: Creo un nuovo cliente (con n indirizzi)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateNuovoClienteDto)
  nuovoCliente?: CreateNuovoClienteDto;
}
