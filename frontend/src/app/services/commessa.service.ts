import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Commessa, PaginatedResult } from '../interfaces/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommessaService {
  private apiUrl = environment.apiUrl + '/commessa';
  public commesseState = signal<Commessa[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Commessa[]> {
    return this.http
      .get<Commessa[]>(this.apiUrl)
      .pipe(tap((res) => this.commesseState.set(res)));
  }

  getOne(id: number): Observable<Commessa> {
    return this.http.get<Commessa>(`${this.apiUrl}/${id}`);
  }

  create(commessa: Partial<Commessa>): Observable<Commessa> {
    return this.http
      .post<Commessa>(this.apiUrl, commessa)
      .pipe(
        tap((nuovo) => this.commesseState.update((state) => [nuovo, ...state])),
      );
  }

  update(id: number, commessa: Partial<Commessa>): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, commessa)
      .pipe(
        tap(() =>
          this.commesseState.update((state) =>
            state.map((c) =>
              c.id === id ? { ...c, ...(commessa as any) } : c,
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
          this.commesseState.update((state) =>
            state.filter((c) => c.id !== id),
          ),
        ),
      );
  }

  getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    orderBy: string = 'id',
    orderDirection: 'ASC' | 'DESC' = 'DESC',
  ): Observable<PaginatedResult<Commessa>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('orderBy', orderBy)
      .set('orderDirection', orderDirection);

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<PaginatedResult<Commessa>>(`${this.apiUrl}/paginated`, { params })
      .pipe(
        tap((res) => {
          if (page === 1) this.commesseState.set(res.data);
          else this.commesseState.update((state) => [...state, ...res.data]);
        }),
      );
  }
}
