export interface Indirizzo {
  id: number;
  via: string;
  civico: string;
  citta: string;
  cap: string;
  provincia?: string;
  stato: string;
  commesse?: Commessa[]; // Importante: contiene la lista commesse
  cliente?: Cliente; // Importante: contiene il cliente proprietario
}

export interface Commessa {
  id: number;
  seriale: string;
  descrizione?: string;
  stato: 'APERTA' | 'CHIUSA' | 'IN_CORSO';
  valore_totale?: number;
  
  // ORA DIPENDE DALL'INDIRIZZO
  indirizzo?: Indirizzo; 
  
  // NON PIÙ DAL CLIENTE DIRETTO
  // clienteId?: number;  <-- RIMOSSO
}

export interface Cliente {
  id: number;
  nome: string;
  telefono?: string;
  email?: string;
  indirizzi?: Indirizzo[];
  // commesse?: Commessa[]; <-- RIMOSSO (si passa dagli indirizzi)
}

export interface Appuntamento {
  id: number;
  nome: string;
  data_ora: string;
  descrizione?: string;
  
  // L'appuntamento DEVE avere una commessa
  commessa?: Commessa; 
  commessaId?: number; // Utile per l'invio dati
}

export interface User {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'ADMIN' | 'POSATORE' | 'COMMERCIALE';
}