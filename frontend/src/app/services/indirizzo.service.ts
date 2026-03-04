import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Indirizzo, PaginatedResult } from '../interfaces/models';
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

  findOne(id: number): Observable<Indirizzo> {
    return this.http.get<Indirizzo>(`${this.apiUrl}/${id}`);
  }

  getPaginated(page: number = 1, limit: number = 15, search: string = ''): Observable<PaginatedResult<Indirizzo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<PaginatedResult<Indirizzo>>(`${this.apiUrl}/paginated`, { params });
  }
}

export { Indirizzo };
