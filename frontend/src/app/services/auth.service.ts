import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { TokenPayload, Utente, RuoloUtente } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Sostituisci con il tuo endpoint reale
  private apiUrl = `${environment.apiUrl}/auth/login`; 
  
  // Stato dell'utente corrente
  private _currentUser = new BehaviorSubject<Utente | null>(null);
  public currentUser$ = this._currentUser.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkTokenIniziale();
  }

  // --- 1. LOGIN REALE (Nickname + Password) ---
  login(credentials: { nickname: string, password: string }) {
    return this.http.post<{ access_token: string }>(this.apiUrl, credentials).pipe(
      tap(response => {
        // Salva il token grezzo
        localStorage.setItem('token', response.access_token);
        // Decodifica e imposta l'utente
        this.decodificaEImpostaUtente(response.access_token);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this._currentUser.next(null);
    this.router.navigate(['/login']);
  }

  // --- 2. LOGICA DECODIFICA ---
  private decodificaEImpostaUtente(token: string) {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        this.logout();
        return;
      }

      // CORREZIONE ERRORE + AGGIUNTA NOME
      // Usiamo 'as Utente' per evitare l'errore dei campi mancanti (password, ecc.)
      const utente: Utente = {
        id: +decoded.sub,
        nickname: decoded.nickname,
        ruolo: decoded.ruolo,
        nome: decoded.nome, // <--- Ora lo prendiamo dal token
        email: '', // Valori default per evitare undefined se servono altrove
        cognome: '',
        password: '' 
      } as Utente; 

      this._currentUser.next(utente);
      
      if (this.router.url.includes('login')) {
         this.router.navigate(['/tabs/tab1']);
      }

    } catch (error) {
      console.error('Errore decodifica token', error);
      this.logout();
    }
  }

  private checkTokenIniziale() {
    const token = localStorage.getItem('token');
    if (token) {
      this.decodificaEImpostaUtente(token);
    }
  }

  // --- 3. HELPER PER I PERMESSI (Usati nell'HTML) ---

  // Ritorna true se l'utente è ADMIN o MANAGER (Vista Gestionale)
  hasManagerAccess(): boolean {
    const r = this._currentUser.value?.ruolo;
    return r === 'ADMIN' || r === 'MANAGER';
  }

  // Ritorna true se l'utente è COLLABORATORE (Vista Operativa)
  isCollaboratore(): boolean {
    return this._currentUser.value?.ruolo === 'COLLABORATORE';
  }

  // Utile per te (ADMIN) per vedere cose nascoste anche ai manager
  isAdmin(): boolean {
    return this._currentUser.value?.ruolo === 'ADMIN';
  }
  
  getToken() {
    return localStorage.getItem('token');
  }

  getCurrentUser(): Utente | null {
    return this._currentUser.value;
  }
}