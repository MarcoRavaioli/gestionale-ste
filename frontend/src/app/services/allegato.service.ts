import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Allegato, PaginatedResult } from '../interfaces/models';

@Injectable({
  providedIn: 'root',
})
export class AllegatoService {
  private apiUrl = environment.apiUrl + '/allegato';

  constructor(private http: HttpClient) {}

  upload(
    entityType: 'commessa' | 'cliente' | 'indirizzo' | 'appuntamento',
    entityId: number,
    file: File,
  ): Observable<Allegato> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(`${entityType}Id`, entityId.toString());

    return this.http.post<Allegato>(`${this.apiUrl}/upload`, formData);
  }

  getPaginated(
    page: number = 1,
    limit: number = 20,
    search: string = '',
  ): Observable<PaginatedResult<Allegato>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResult<Allegato>>(
      `${this.apiUrl}/paginated`,
      { params },
    );
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
    });
  }

  apriFileSicuro(id: number): void {
    this.download(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Revoke the object URL after a short delay to free up memory
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: (err) => {
        console.error('Errore durante lo scaricamento del file:', err);
      },
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
