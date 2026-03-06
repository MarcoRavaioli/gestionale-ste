import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Appuntamento, PaginatedResult } from '../interfaces/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppuntamentoService {
  // L'URL base corrisponde al controller del backend
  private apiUrl = environment.apiUrl + '/appuntamento';
  public appuntamentiState = signal<Appuntamento[]>([]);

  constructor(private http: HttpClient) {}

  // Leggi tutti
  getAll(): Observable<Appuntamento[]> {
    return this.http
      .get<Appuntamento[]>(this.apiUrl)
      .pipe(tap((res) => this.appuntamentiState.set(res)));
  }

  // Leggi uno solo
  getOne(id: number): Observable<Appuntamento> {
    return this.http.get<Appuntamento>(`${this.apiUrl}/${id}`);
  }

  // Crea
  create(appuntamento: Partial<Appuntamento>): Observable<Appuntamento> {
    return this.http
      .post<Appuntamento>(this.apiUrl, appuntamento)
      .pipe(
        tap((nuovo) =>
          this.appuntamentiState.update((state) => [nuovo, ...state]),
        ),
      );
  }

  // Modifica
  update(id: number, appuntamento: Partial<Appuntamento>): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, appuntamento)
      .pipe(
        tap(() =>
          this.appuntamentiState.update((state) =>
            state.map((a) =>
              a.id === id ? { ...a, ...(appuntamento as any) } : a,
            ),
          ),
        ),
      );
  }

  // Cancella
  delete(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() =>
          this.appuntamentiState.update((state) =>
            state.filter((a) => a.id !== id),
          ),
        ),
      );
  }

  getPaginated(
    page: number = 1,
    limit: number = 15,
    search: string = '',
  ): Observable<PaginatedResult<Appuntamento>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<
        PaginatedResult<Appuntamento>
      >(`${this.apiUrl}/paginated`, { params })
      .pipe(
        tap((res) => {
          if (page === 1) this.appuntamentiState.set(res.data);
          else
            this.appuntamentiState.update((state) => [...state, ...res.data]);
        }),
      );
  }
}
