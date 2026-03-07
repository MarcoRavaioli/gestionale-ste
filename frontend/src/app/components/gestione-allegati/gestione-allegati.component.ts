import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonBadge,
  ToastController,
  AlertController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentOutline,
  cloudUploadOutline,
  trashOutline,
  addCircleOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { AllegatoService } from '../../services/allegato.service';
import { Allegato } from '../../interfaces/models';

@Component({
  selector: 'app-gestione-allegati',
  templateUrl: './gestione-allegati.component.html',
  styleUrls: ['./gestione-allegati.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonBadge,
    IonSpinner,
  ],
})
export class GestioneAllegatiComponent implements OnInit {
  @Input() entityType!: 'commessa' | 'cliente' | 'indirizzo' | 'appuntamento';
  // L'ID è opzionale: se mancante siamo in CREATE, se presente siamo in EDIT
  @Input() entityId?: number | null;
  @Input() allegatiEsistenti: Allegato[] = [];

  // File selezionati dall'utente che non sono stati ancora caricati (per la fase di CREATE o EDIT asincrono)
  pendingFiles: File[] = [];

  isUploading = false;

  constructor(
    private allegatoService: AllegatoService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      documentOutline,
      cloudUploadOutline,
      trashOutline,
      addCircleOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {}

  triggerFileInput() {
    // Usiamo un ID dinamico nel caso ci siano più istanze (non dovrebbe)
    const fileInput = document.getElementById(
      `fileInput-${this.entityType}`,
    ) as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  async onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (this.entityId) {
        // Siamo in EDIT mode, carica immediatamente il file tramite il service!
        await this.eseguiUploadImmediato(file);
      } else {
        // Siamo in CREATE mode, lo parcheggi a lato e il parent lo caricherà dopo
        this.pendingFiles.push(file);
      }
    }

    // reset dell'input
    event.target.value = '';
  }

  async eseguiUploadImmediato(file: File) {
    if (!this.entityId) return;
    this.isUploading = true;
    try {
      const nuovoAllegato = await this.allegatoService
        .upload(this.entityType, this.entityId, file)
        .toPromise();
      if (nuovoAllegato) {
        // Usa un nuovo array per innescare ChangeDetection
        this.allegatiEsistenti = [nuovoAllegato, ...this.allegatiEsistenti];
        this.mostraToast('File caricato con successo!', 'success');
      }
    } catch (err) {
      console.error(err);
      this.mostraToast('Errore durante il caricamento', 'danger');
    } finally {
      this.isUploading = false;
    }
  }

  rimuoviPendingFile(index: number, event: Event) {
    event.stopPropagation();
    this.pendingFiles.splice(index, 1);
  }

  async eliminaAllegatoEsistente(allegatoId: number, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Conferma Eliminazione',
      message: 'Vuoi eliminare fisicamente questo file dal server?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.allegatoService.delete(allegatoId).subscribe({
              next: () => {
                this.allegatiEsistenti = this.allegatiEsistenti.filter(
                  (a) => a.id !== allegatoId,
                );
                this.mostraToast('Allegato eliminato!', 'success');
              },
              error: () =>
                this.mostraToast("Errore durante l'eliminazione", 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  apriAllegato(id: number) {
    this.allegatoService.apriFileSicuro(id);
  }

  // --- PUBBLICHE PER IL PARENT ---

  // Il componente padre la chiama subito dopo aver salvato un nuovo record
  async uploadAllPendingFiles(newEntityId: number): Promise<void> {
    for (const file of this.pendingFiles) {
      try {
        await this.allegatoService
          .upload(this.entityType, newEntityId, file)
          .toPromise();
      } catch (e) {
        console.error('Errore upload pending file', e);
        this.mostraToast(
          'Errore upload allegato, il task principale è salvato.',
          'warning',
        );
      }
    }
    this.pendingFiles = [];
  }

  async mostraToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      color,
      duration: 2000,
    });
    toast.present();
  }
}
