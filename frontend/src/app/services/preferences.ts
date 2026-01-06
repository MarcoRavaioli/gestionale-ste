import { Injectable } from '@angular/core';

export interface ViewSettings {
  orderBy: string;       // es. 'nome', 'citta', 'via'
  orderDirection: 'asc' | 'desc';
  groupBy?: string;      // es. 'citta', 'provincia' (Opzionale, null = nessun gruppo)
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  constructor() {}

  // Salva le impostazioni
  saveSettings(key: string, settings: ViewSettings) {
    localStorage.setItem(key, JSON.stringify(settings));
  }

  // Legge le impostazioni (con valori di default)
  getSettings(key: string, defaultSettings: ViewSettings): ViewSettings {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultSettings;
  }
}