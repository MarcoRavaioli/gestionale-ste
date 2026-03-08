import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonToggle,
  ModalController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { ProfiloModalComponent } from '../profilo-modal/profilo-modal.component';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  moonOutline,
  logOutOutline,
  closeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-impostazioni-modal',
  templateUrl: './impostazioni-modal.component.html',
  styleUrls: ['./impostazioni-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonToggle,
  ],
})
export class ImpostazioniModalComponent implements OnInit {
  userNome = signal<string>('Utente');
  userRole = signal<string>('Ruolo');
  isDarkMode = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private modalCtrl: ModalController,
  ) {
    addIcons({ personCircleOutline, moonOutline, logOutOutline, closeOutline });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userNome.set(user.nome || user.nickname || 'Utente');
        this.userRole.set(user.ruolo || 'COLLABORATORE');
      }
    });

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    const stored = localStorage.getItem('theme-dark');
    if (stored !== null) {
      this.isDarkMode.set(stored === 'true');
    } else {
      this.isDarkMode.set(prefersDark);
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  toggleDarkMode(event: any) {
    const isDark = event.detail.checked;
    this.isDarkMode.set(isDark);
    localStorage.setItem('theme-dark', isDark.toString());
    document.body.classList.toggle('dark', isDark);
  }

  async openProfilo() {
    const modal = await this.modalCtrl.create({
      component: ProfiloModalComponent,
    });
    await modal.present();
  }

  logout() {
    this.chiudi();
    this.authService.logout();
  }
}
