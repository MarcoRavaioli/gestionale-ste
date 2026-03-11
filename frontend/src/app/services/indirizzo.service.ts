import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Indirizzo, PaginatedResult } from '../interfaces/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IndirizzoService {
  private apiUrl = environment.apiUrl + '/indirizzo';
  public cantieriState = signal<Indirizzo[]>([]);

  constructor(private http: HttpClient) {}

  create(indirizzo: Partial<Indirizzo>): Observable<Indirizzo> {
    return this.http
      .post<Indirizzo>(this.apiUrl, indirizzo)
      .pipe(
        tap((nuovo) => this.cantieriState.update((state) => [nuovo, ...state])),
      );
  }

  // AGGIUNGI QUESTO METODO:
  update(id: number, indirizzo: Partial<Indirizzo>): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, indirizzo)
      .pipe(
        tap(() =>
          this.cantieriState.update((state) =>
            state.map((i) =>
              i.id === id ? { ...i, ...(indirizzo as any) } : i,
            ),
          ),
        ),
      );
  }

  delete(id: number, cascade: boolean = false): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}?cascade=${cascade}`)
      .pipe(
        tap(() =>
          this.cantieriState.update((state) =>
            state.filter((i) => i.id !== id),
          ),
        ),
      );
  }

  getAll(): Observable<Indirizzo[]> {
    return this.http
      .get<Indirizzo[]>(this.apiUrl)
      .pipe(tap((res) => this.cantieriState.set(res)));
  }

  findOne(id: number): Observable<Indirizzo> {
    return this.http.get<Indirizzo>(`${this.apiUrl}/${id}`);
  }

  getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    orderBy: string = 'citta',
    orderDirection: 'ASC' | 'DESC' = 'ASC',
  ): Observable<PaginatedResult<Indirizzo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('orderBy', orderBy)
      .set('orderDirection', orderDirection);

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<PaginatedResult<Indirizzo>>(`${this.apiUrl}/paginated`, { params })
      .pipe(
        tap((res) => {
          if (page === 1) this.cantieriState.set(res.data);
          else this.cantieriState.update((state) => [...state, ...res.data]);
        }),
      );
  }
}

export { Indirizzo };
