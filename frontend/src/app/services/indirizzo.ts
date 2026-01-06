import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Indirizzo } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class IndirizzoService {
  private apiUrl = '/api/indirizzo'; // Assumiamo tu abbia fatto il controller nel backend

  constructor(private http: HttpClient) {}

  create(indirizzo: Partial<Indirizzo>): Observable<Indirizzo> {
    return this.http.post<Indirizzo>(this.apiUrl, indirizzo);
  }

  // Aggiungi delete/update se serviranno in futuro
}