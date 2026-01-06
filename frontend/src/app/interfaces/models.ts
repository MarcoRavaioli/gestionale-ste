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
  
  // AGGIUNGI QUESTA RIGA QUI SOTTO:
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
