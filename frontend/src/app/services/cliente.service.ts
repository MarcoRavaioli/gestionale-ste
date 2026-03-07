import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Cliente, PaginatedResult } from '../interfaces/models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  // Grazie al proxy, '/api' viene girato a localhost:3000
  private apiUrl = environment.apiUrl + '/cliente';
  public clientiState = signal<Cliente[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Cliente[]> {
    return this.http
      .get<Cliente[]>(this.apiUrl)
      .pipe(tap((res) => this.clientiState.set(res)));
  }

  getOne(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  create(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http
      .post<Cliente>(this.apiUrl, cliente)
      .pipe(
        tap((nuovo) => this.clientiState.update((state) => [nuovo, ...state])),
      );
  }

  update(id: number, cliente: Partial<Cliente>): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, cliente)
      .pipe(
        tap(() =>
          this.clientiState.update((state) =>
            state.map((c) => (c.id === id ? { ...c, ...(cliente as any) } : c)),
          ),
        ),
      );
  }

  delete(id: number, cascade: boolean = false): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}?cascade=${cascade}`)
      .pipe(
        tap(() =>
          this.clientiState.update((state) => state.filter((c) => c.id !== id)),
        ),
      );
  }

  getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
  ): Observable<PaginatedResult<Cliente>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<PaginatedResult<Cliente>>(`${this.apiUrl}/paginated`, { params })
      .pipe(
        tap((res) => {
          if (page === 1) this.clientiState.set(res.data);
          else this.clientiState.update((state) => [...state, ...res.data]);
        }),
      );
  }
}
