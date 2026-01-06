import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appuntamento } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AppuntamentoService {
  // L'URL base corrisponde al controller del backend
  private apiUrl = '/api/appuntamento';

  constructor(private http: HttpClient) {}

  // Leggi tutti
  getAll(): Observable<Appuntamento[]> {
    return this.http.get<Appuntamento[]>(this.apiUrl);
  }

  // Leggi uno solo
  getOne(id: number): Observable<Appuntamento> {
    return this.http.get<Appuntamento>(`${this.apiUrl}/${id}`);
  }

  // Crea
  create(appuntamento: Partial<Appuntamento>): Observable<Appuntamento> {
    return this.http.post<Appuntamento>(this.apiUrl, appuntamento);
  }

  // Modifica
  update(id: number, appuntamento: Partial<Appuntamento>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, appuntamento);
  }

  // Cancella
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}