import { Component } from '@angular/core';
// CORREZIONE IMPORT: Risaliamo di due livelli (../../)
import { AuthService } from '../../services/auth.service'; 
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonItem, IonInput, IonButton, IonIcon, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, business, alertCircle } from 'ionicons/icons';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, IonContent, IonItem, IonInput, IonButton, IonIcon, IonSpinner]
})
export class LoginPage {
  
  credentials = { nickname: '', password: '' };
  isLoading = false;
  errorMessage = '';

  constructor(private auth: AuthService) {
    addIcons({ personOutline, lockClosedOutline, business, alertCircle });
  }

  eseguiLogin() {
    if(!this.credentials.nickname || !this.credentials.password) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
      },
      // CORREZIONE TIPO: Aggiunto ': any'
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Credenziali non valide o errore server.';
        console.error(err);
      }
    });
  }
}