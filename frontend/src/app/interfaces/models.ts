export type RuoloUtente = 'ADMIN' | 'MANAGER' | 'COLLABORATORE';

export interface Utente {
  id: number;
  nickname: string; // Usiamo nickname, non email
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: RuoloUtente;
  avatar?: string;
  // Altri campi che il backend ti manda nel token/profilo
}

// Interfaccia per il payload del token JWT
export interface TokenPayload {
  sub: string;       // Solitamente l'ID o il nickname
  nickname: string;
  nome: string;
  ruolo: RuoloUtente;
  exp: number;       // Scadenza
}

export interface Indirizzo {
  id: number;
  via: string;
  civico: string;
  citta: string;
  cap: string;
  provincia?: string;
  stato: string;
  commesse?: Commessa[];
  cliente?: Cliente;
}

export interface Commessa {
  id: number;
  seriale: string;
  descrizione?: string;
  stato: 'APERTA' | 'CHIUSA' | 'IN_CORSO';
  valore_totale?: number;
  indirizzo?: Indirizzo; 
  appuntamenti?: Appuntamento[]; 
}

export interface Cliente {
  id: number;
  nome: string;
  telefono?: string;
  email?: string;
  indirizzi?: Indirizzo[];
}

export interface Appuntamento {
  id: number;
  nome: string;
  data_ora: string;
  descrizione?: string;
  commessa?: Commessa; 
  commessaId?: number;
}

export interface User {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'ADMIN' | 'POSATORE' | 'COMMERCIALE';
}

export enum TipoFattura {
  ENTRATA = 'entrata',
  USCITA = 'uscita',
}

export interface Allegato {
  id: number;
  nome_file: string;
  percorso: string;
  tipo_file?: string;
  data_caricamento: string;
}

export interface Fattura {
  id: number;
  numero_fattura: string;
  data_emissione: string;
  descrizione?: string;
  totale: number;
  tipo: TipoFattura;
  data_scadenza?: string;
  incassata: boolean;
  cliente?: Cliente;
  commessa?: Commessa;
  allegati?: Allegato[];
}