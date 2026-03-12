export type RuoloUtente = 'ADMIN' | 'MANAGER' | 'COLLABORATORE';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Utente {
  id: number;
  nickname: string;
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: RuoloUtente;
  avatar?: string;
}

export interface TokenPayload {
  sub: string;
  nickname: string;
  nome: string;
  ruolo: RuoloUtente;
  exp: number;
}

// Sposto Allegato in alto perché ora è usato da quasi tutti
export interface Allegato {
  id: number;
  nome_file: string;
  percorso: string;
  tipo_file?: string;
  data_caricamento: string;
  
  // FASE 1: Tutti i collegamenti padre opzionali
  cliente?: Cliente;
  indirizzo?: Indirizzo;
  commessa?: Commessa;
  appuntamento?: Appuntamento;
  fattura?: Fattura;
}

export interface Indirizzo {
  id: number;
  via: string;
  civico: string;
  citta: string;
  cap: string;
  provincia?: string;
  stato: string;
  
  cliente?: Cliente;
  commesse?: Commessa[];
  
  // FASE 1: Nuovi figli diretti
  appuntamenti?: Appuntamento[]; 
  allegati?: Allegato[];         
}

export interface Commessa {
  id: number;
  seriale: string;
  descrizione?: string;
  stato: 'APERTA' | 'CHIUSA' | 'IN_CORSO';
  valore_totale?: number;
  
  indirizzo?: Indirizzo; 
  cliente?: Cliente; // <--- FASE 1: Commessa diretta senza cantiere
  
  appuntamenti?: Appuntamento[]; 
  allegati?: Allegato[]; 
  fatture?: Fattura[];
}

export interface Cliente {
  id: number;
  nome: string;
  telefono?: string;
  email?: string;
  
  indirizzi?: Indirizzo[];
  
  // FASE 1: Nuovi figli diretti (saltano il cantiere)
  commesse?: Commessa[];         
  appuntamenti?: Appuntamento[]; 
  fatture?: Fattura[];
  allegati?: Allegato[];
}

export interface Appuntamento {
  id: number;
  nome: string;
  data_ora: string;
  descrizione?: string;
  
  // FASE 1: Le 3 opzioni di collegamento
  commessa?: Commessa; 
  indirizzo?: Indirizzo;         
  cliente?: Cliente;             
  
  allegati?: Allegato[];
  commessaId?: number; // Mantenuto per compatibilità con vecchi form
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
  commesse?: Commessa[];
  allegati?: Allegato[];
}