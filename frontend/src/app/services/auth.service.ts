import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // <--- 1. Importa questo

// Definiamo cosa c'è dentro il token
interface TokenPayload {
  sub: number;
  email: string;
  ruolo: 'ADMIN' | 'POSATORE' | 'COMMERCIALE';
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth/login';
  
  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this._isLoggedIn.asObservable();

  // 2. Aggiungiamo un Subject per il Ruolo
  private _userRole = new BehaviorSubject<string | null>(null);
  public userRole$ = this._userRole.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      this.decodificaToken(token); // Decodifica all'avvio
    }
  }

  login(credentials: {email: string, password: string}) {
    return this.http.post<{access_token: string}>(this.apiUrl, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
        this.decodificaToken(response.access_token); // Decodifica al login
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this._isLoggedIn.next(false);
    this._userRole.next(null);
  }

  // 3. Funzione che legge il token e setta lo stato
  private decodificaToken(token: string) {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      this._isLoggedIn.next(true);
      this._userRole.next(decoded.ruolo);
    } catch (error) {
      // Se il token è corrotto, logout forzato
      this.logout();
    }
  }

  // Helper rapido per i componenti
  get isAdmin(): boolean {
    return this._userRole.value === 'ADMIN';
  }
}