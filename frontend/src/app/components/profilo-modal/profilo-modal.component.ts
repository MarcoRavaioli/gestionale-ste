import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonNote,
  IonText,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { CollaboratoreService } from '../../services/collaboratore.service';
import { addIcons } from 'ionicons';
import {
  personOutline,
  keyOutline,
  textOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-profilo-modal',
  templateUrl: './profilo-modal.component.html',
  styleUrls: ['./profilo-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonNote,
    IonText,
    CommonModule,
    FormsModule,
  ],
})
export class ProfiloModalComponent implements OnInit {
  utente: any = {};
  passwordForm = { new: '', confirm: '' };
  userId: number | null = null;

  constructor(
    private modalCtrl: ModalController,
    private authService: AuthService,
    private collabService: CollaboratoreService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personOutline,
      keyOutline,
      textOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();

    // CORREZIONE: Usiamo 'id', che è la proprietà standard definita nella tua interfaccia Utente
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      this.caricaDati();
    }
  }

  caricaDati() {
    if (!this.userId) return;
    this.collabService.getOne(this.userId).subscribe({
      next: (res) => (this.utente = res),
      error: () => this.mostraToast('Errore caricamento profilo', 'danger'),
    });
  }

  salva() {
    const payload: any = {
      nome: this.utente.nome,
      cognome: this.utente.cognome,
    };

    // Aggiunge la password al payload SOLO se l'utente l'ha digitata
    if (this.passwordForm.new) {
      payload.password = this.passwordForm.new;
    }

    this.collabService.update(this.userId!, payload).subscribe({
      next: () => {
        this.mostraToast('Profilo aggiornato con successo!', 'success');
        this.modalCtrl.dismiss();
      },
      error: () => this.mostraToast('Errore durante il salvataggio.', 'danger'),
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  async mostraToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, color });
    t.present();
  }
}
