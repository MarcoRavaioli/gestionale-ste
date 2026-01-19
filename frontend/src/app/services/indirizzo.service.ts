import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Indirizzo } from '../interfaces/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IndirizzoService {
  private apiUrl = environment.apiUrl + '/indirizzo';

  constructor(private http: HttpClient) {}

  create(indirizzo: Partial<Indirizzo>): Observable<Indirizzo> {
    return this.http.post<Indirizzo>(this.apiUrl, indirizzo);
  }

  // AGGIUNGI QUESTO METODO:
  update(id: number, indirizzo: Partial<Indirizzo>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, indirizzo);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<Indirizzo[]> {
    return this.http.get<Indirizzo[]>(this.apiUrl);
  }
}

export { Indirizzo };
