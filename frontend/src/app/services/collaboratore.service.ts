import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollaboratoreService {
  private apiUrl = `${environment.apiUrl}/collaboratore`;

  constructor(private http: HttpClient) {}

  // Crea un nuovo utente (Admin, Manager o Collaboratore)
  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Recupera tutti (utile per la lista team)
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- NUOVI METODI PER IL PROFILO ---

  // Legge i dati di un singolo utente
  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Aggiorna i dati (inclusa la password se presente)
  update(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }
}