import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fattura } from '../interfaces/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FatturaService {
  private apiUrl = environment.apiUrl + '/fattura';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Fattura[]> {
    return this.http.get<Fattura[]>(this.apiUrl);
  }

  create(fattura: Partial<Fattura>): Observable<Fattura> {
    return this.http.post<Fattura>(this.apiUrl, fattura);
  }

  update(id: number, fattura: Partial<Fattura>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, fattura);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}