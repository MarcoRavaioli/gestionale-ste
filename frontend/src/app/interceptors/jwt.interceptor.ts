import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // 1. Recuperiamo il token dal LocalStorage
  const token = localStorage.getItem('token');

  // 2. Se il token c'è, cloniamo la richiesta e aggiungiamo l'header
  // (Non modifichiamo la richiesta originale perché è immutabile)
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 3. Lasciamo passare la richiesta e ascoltiamo la risposta (o l'errore)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Se il server risponde 401 (Unauthorized), significa che il token è scaduto o invalido
      if (error.status === 401) {
        // Cancelliamo il token vecchio
        localStorage.removeItem('token');
        // Rimandiamo l'utente alla pagina di login
        router.navigate(['/login']);
      }

      // Rilanciamo l'errore per farlo gestire eventualmente al componente
      return throwError(() => error);
    })
  );
};