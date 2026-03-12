import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSpinner,
  ModalController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { CollaboratoreService } from '../../services/collaboratore.service';
import { NuovoCollaboratoreModalComponent } from '../nuovo-collaboratore-modal/nuovo-collaboratore-modal.component';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, trash } from 'ionicons/icons';

@Component({
  selector: 'app-gestione-utenti-modal',
  templateUrl: './gestione-utenti-modal.component.html',
  styleUrls: ['./gestione-utenti-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSpinner,
    CommonModule,
  ],
})
export class GestioneUtentiModalComponent implements OnInit {
  utenti = signal<any[]>([]);
  caricamento = signal<boolean>(false);

  constructor(
    private collaboratoreService: CollaboratoreService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ pencilOutline, trashOutline, trash });
  }

  ngOnInit() {
    this.caricaUtenti();
  }

  caricaUtenti() {
    this.caricamento.set(true);
    this.collaboratoreService.getAll().subscribe({
      next: (res) => {
        this.utenti.set(res);
        this.caricamento.set(false);
      },
      error: (err) => {
        console.error('Errore caricamento utenti', err);
        this.caricamento.set(false);
      },
    });
  }

  getRoleColor(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'danger';
      case 'MANAGER':
        return 'warning';
      default:
        return 'primary';
    }
  }

  async modifica(user: any) {
    const modal = await this.modalCtrl.create({
      component: NuovoCollaboratoreModalComponent,
      componentProps: { collaboratore: user },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) {
      this.caricaUtenti();
    }
  }

  async elimina(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'Conferma eliminazione',
      message: `Sei sicuro di voler eliminare l'utente ${user.nome} ${user.cognome}?`,
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
        },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.procediEliminazione(user.id);
          },
        },
      ],
    });
    await alert.present();
  }

  procediEliminazione(id: number) {
    this.collaboratoreService.remove(id).subscribe({
      next: () => {
        this.showToast('Utente eliminato con successo', 'success');
        this.caricaUtenti();
      },
      error: (err) => {
        console.error('Errore eliminazione utente', err);
        const msg = err.error?.message || 'Errore durante l\'eliminazione';
        this.showToast(msg, 'danger');
      },
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }
}
