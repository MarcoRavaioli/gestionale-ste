export interface Cliente {
  id: number;
  nome: string;
  telefono?: string;
  email?: string;
  indirizzi?: Indirizzo[];
  commesse?: Commessa[];
}

export interface Indirizzo {
  id: number;
  via: string;
  civico: string;
  citta: string;
  cap: string;
  provincia?: string;
}

export interface Commessa {
  id: number;
  seriale: string;
  descrizione?: string;
  stato: 'APERTA' | 'CHIUSA' | 'IN_CORSO';
  valore_totale?: number; 
  clienteId: number;
  cliente?: Cliente;
}


export interface Appuntamento {
  id: number;
  nome: string; // Titolo appuntamento
  data_ora: string; // ISO String
  descrizione?: string;
  clienteId?: number;
  cliente?: Cliente;
  commessaId?: number;
  commessa?: Commessa;
}

export interface User {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'ADMIN' | 'POSATORE' | 'COMMERCIALE';
}