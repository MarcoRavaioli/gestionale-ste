import { Component, Input, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommessaService } from '../../services/commessa.service';
import { AllegatoService } from '../../services/allegato.service'; // <--- NUOVO
import { Commessa } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentAttachOutline,
  closeCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-modal',
  templateUrl: './nuova-commessa-modal.component.html',
  styleUrls: ['./nuova-commessa-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonIcon,
    CommonModule,
    FormsModule,
  ],
})
export class NuovaCommessaModalComponent implements OnInit {
  @Input() indirizzoId!: number;
  @Input() commessaEsistente?: Commessa;

  commessa: Partial<Commessa> = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: 0,
  };

  selectedFile: File | null = null; // <--- File selezionato

  constructor(
    private modalCtrl: ModalController,
    private commessaService: CommessaService,
    private allegatoService: AllegatoService, // <--- Inject
    private toastCtrl: ToastController,
  ) {
    addIcons({ cloudUploadOutline, documentAttachOutline, closeCircle });
  }

  ngOnInit() {
    if (this.commessaEsistente) {
      this.commessa = { ...this.commessaEsistente };
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  // --- GESTIONE FILE ---
  triggerFileInput() {
    document.getElementById('fileInput')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  rimuoviFile(ev: Event) {
    ev.stopPropagation();
    this.selectedFile = null;
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  // --- SALVATAGGIO ---
  salva() {
    const payload = {
      ...this.commessa,
      indirizzo: { id: this.indirizzoId },
    };

    // 1. Crea o Aggiorna Commessa
    let obs$;
    if (this.commessaEsistente) {
      obs$ = this.commessaService.update(
        this.commessaEsistente.id,
        payload as any,
      );
    } else {
      obs$ = this.commessaService.create(payload as any);
    }

    obs$.subscribe({
      next: async (res) => {
        // 2. Se c'è un file, caricalo ora usando l'ID della commessa (res.id)
        if (this.selectedFile) {
          try {
            // Se stiamo modificando, usa l'ID esistente, altrimenti quello nuovo
            const idCommessa = this.commessaEsistente
              ? this.commessaEsistente.id
              : res.id;
            await this.uploadFilePromise(idCommessa, this.selectedFile);
          } catch (err) {
            console.error('Errore upload', err);
            this.showToast(
              'Commessa salvata, ma errore nel caricamento allegato.',
              'warning',
            );
          }
        }

        this.modalCtrl.dismiss({ aggiornato: true, data: res });
      },
      error: (err) => {
        console.error(err);
        this.showToast('Errore nel salvataggio commessa.', 'danger');
      },
    });
  }

  // Helper per trasformare l'observable upload in promise
  uploadFilePromise(commessaId: number, file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.allegatoService.upload(commessaId, file).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      color,
      duration: 3000,
    });
    toast.present();
  }
}
