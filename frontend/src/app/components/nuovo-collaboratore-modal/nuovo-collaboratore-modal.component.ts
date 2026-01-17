import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { CollaboratoreService } from '../../services/collaboratore.service';
import { addIcons } from 'ionicons';
import { personAddOutline, closeOutline, saveOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-collaboratore-modal',
  templateUrl: './nuovo-collaboratore-modal.component.html',
  styleUrls: ['./nuovo-collaboratore-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NuovoCollaboratoreModalComponent {

  nuovoUtente = {
    nome: '',
    cognome: '',
    nickname: '',
    password: '',
    telefono: '',
    email: '',
    ruolo: 'COLLABORATORE' // Default
  };

  showPassword = false;

  constructor(
    private modalCtrl: ModalController,
    private collabService: CollaboratoreService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({ personAddOutline, closeOutline, saveOutline, eyeOutline, eyeOffOutline });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isValid(): boolean {
    // Campi obbligatori minimi
    return !!(this.nuovoUtente.nome && this.nuovoUtente.nickname && this.nuovoUtente.password);
  }

  async salva() {
    if (!this.isValid()) return;

    const loader = await this.loadingCtrl.create({ message: 'Creazione utente...' });
    await loader.present();

    // Pulizia dati (email vuota manda null per evitare conflitti unique)
    const payload = { ...this.nuovoUtente };
    if (!payload.email) delete (payload as any).email;

    this.collabService.create(payload).subscribe({
      next: async (res) => {
        await loader.dismiss();
        this.mostraToast('Utente creato con successo!', 'success');
        this.modalCtrl.dismiss({ creato: true });
      },
      error: async (err) => {
        await loader.dismiss();
        console.error(err);
        this.mostraToast('Errore creazione. Nickname già in uso?', 'danger');
      }
    });
  }

  async mostraToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color: color });
    t.present();
  }
}