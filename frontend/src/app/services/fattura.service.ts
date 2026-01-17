import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fattura } from '../interfaces/models';
import { environment } from 'src/environments/environment'; // O il tuo path configurazione

@Injectable({
  providedIn: 'root'
})
export class FatturaService {
  // Assicurati che l'URL sia corretto (es. http://localhost:3000/fattura)
  private apiUrl = environment.apiUrl + '/fattura'; 

  constructor(private http: HttpClient) {}

  getAll(): Observable<Fattura[]> {
    return this.http.get<Fattura[]>(this.apiUrl);
  }

  // --- METODO CRITICO PER L'UPLOAD ---
  createWithAttachment(dati: any, file: File | null): Observable<Fattura> {
    const formData = new FormData();

    // 1. Appendiamo i campi testuali (tutto deve essere stringa per il FormData)
    formData.append('numero_fattura', dati.numero_fattura);
    formData.append('data_emissione', dati.data_emissione);
    formData.append('totale', dati.totale.toString());
    formData.append('tipo', dati.tipo);
    formData.append('incassata', dati.incassata.toString()); 
    
    // Campi opzionali
    if (dati.descrizione) formData.append('descrizione', dati.descrizione);
    if (dati.data_scadenza) formData.append('data_scadenza', dati.data_scadenza);
    
    // Le relazioni vanno passate solo se presenti
    if (dati.clienteId) formData.append('clienteId', dati.clienteId.toString());
    if (dati.commessaId) formData.append('commessaId', dati.commessaId.toString());

    // 2. Appendiamo il file (chiave 'file' deve coincidere con @UploadedFile nel controller)
    if (file) {
      formData.append('file', file, file.name);
    }

    // Nota: Angular imposterà automaticamente l'header 'Content-Type: multipart/form-data'
    return this.http.post<Fattura>(this.apiUrl, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateWithAttachment(id: number, dati: any, file: File | null): Observable<Fattura> {
    const formData = new FormData();
    // ... Stessa logica di append del create ...
    // Riutilizza il codice del create o crea una funzione privata helper 'prepareFormData'
    
    // Copio per brevità (ma in produzione rifattorizza per non duplicare)
    if(dati.numero_fattura) formData.append('numero_fattura', dati.numero_fattura);
    if(dati.data_emissione) formData.append('data_emissione', dati.data_emissione);
    if(dati.totale) formData.append('totale', dati.totale.toString());
    if(dati.tipo) formData.append('tipo', dati.tipo);
    formData.append('incassata', dati.incassata.toString());
    if (dati.descrizione) formData.append('descrizione', dati.descrizione);
    if (dati.data_scadenza) formData.append('data_scadenza', dati.data_scadenza);
    if (dati.clienteId) formData.append('clienteId', dati.clienteId.toString());
    if (dati.commessaId) formData.append('commessaId', dati.commessaId.toString());
    
    if (file) {
      formData.append('file', file, file.name);
    }

    return this.http.patch<Fattura>(`${this.apiUrl}/${id}`, formData);
  }
}