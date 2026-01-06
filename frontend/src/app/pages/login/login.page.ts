import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular'; // Importa ToastController
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  // IMPORTANTE: Aggiungi FormsModule qui sotto
  imports: [IonicModule, CommonModule, FormsModule] 
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController // Per le notifiche carine
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.showToast('Inserisci email e password', 'warning');
      return;
    }

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        // Login riuscito: vai alla Home (Tabs)
        this.router.navigate(['/tabs/tab1']);
      },
      error: (err) => {
        console.error(err);
        this.showToast('Credenziali non valide', 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}