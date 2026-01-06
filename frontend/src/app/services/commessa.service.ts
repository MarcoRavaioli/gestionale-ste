import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commessa } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class CommessaService {
  private apiUrl = '/api/commessa';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Commessa[]> {
    return this.http.get<Commessa[]>(this.apiUrl);
  }

  getOne(id: number): Observable<Commessa> {
    return this.http.get<Commessa>(`${this.apiUrl}/${id}`);
  }

  create(commessa: Partial<Commessa>): Observable<Commessa> {
    return this.http.post<Commessa>(this.apiUrl, commessa);
  }

  update(id: number, commessa: Partial<Commessa>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, commessa);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}