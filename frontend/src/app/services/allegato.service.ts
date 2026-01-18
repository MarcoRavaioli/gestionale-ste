import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Allegato } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AllegatoService {
  private apiUrl = environment.apiUrl + '/allegato';

  constructor(private http: HttpClient) {}

  upload(commessaId: number, file: File): Observable<Allegato> {
    const formData = new FormData();
    formData.append('file', file);
    // Importante: il backend si aspetta 'commessaId' come numero nel body (tramite DTO)
    // FormData trasforma tutto in stringa, ma il DTO backend ha @Type(() => Number) che lo converte
    formData.append('commessaId', commessaId.toString());

    return this.http.post<Allegato>(`${this.apiUrl}/upload`, formData);
  }

  // Per il download usiamo 'blob' per gestire file binari (PDF, immagini, ecc.)
  download(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
