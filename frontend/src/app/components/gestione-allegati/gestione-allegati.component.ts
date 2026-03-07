import {
  Component,
  Input,
  OnInit,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  ToastController,
  AlertController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentOutline,
  cloudUploadOutline,
  trashOutline,
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
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonSpinner,
  ],
})
export class GestioneAllegatiComponent implements OnInit, OnChanges {
  @Input() entityType!: 'commessa' | 'cliente' | 'indirizzo' | 'appuntamento';
  @Input() entityId?: number | null;
  @Input() allegatiEsistenti: Allegato[] = [];

  pendingFiles = signal<File[]>([]);
  isUploading = signal<boolean>(false);
  allegati = signal<Allegato[]>([]);

  constructor(
    private allegatoService: AllegatoService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      documentOutline,
      cloudUploadOutline,
      trashOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {
    this.allegati.set([...this.allegatiEsistenti]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['allegatiEsistenti'] &&
      !changes['allegatiEsistenti'].firstChange
    ) {
      this.allegati.set([...this.allegatiEsistenti]);
    }
  }

  triggerFileInput() {
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
        await this.eseguiUploadImmediato(file);
      } else {
        this.pendingFiles.update((pf) => [...pf, file]);
      }
    }
    event.target.value = '';
  }

  async eseguiUploadImmediato(file: File) {
    if (!this.entityId) return;
    this.isUploading.set(true);
    try {
      const nuovoAllegato = await this.allegatoService
        .upload(this.entityType, this.entityId, file)
        .toPromise();
      if (nuovoAllegato) {
        this.allegati.update((a) => [nuovoAllegato, ...a]);
        this.mostraToast('File caricato con successo!', 'success');
      }
    } catch (err) {
      console.error(err);
      this.mostraToast('Errore durante il caricamento', 'danger');
    } finally {
      this.isUploading.set(false);
    }
  }

  rimuoviPendingFile(index: number, event: Event) {
    event.stopPropagation();
    this.pendingFiles.update((pf) => pf.filter((_, i) => i !== index));
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
                this.allegati.update((a) =>
                  a.filter((al) => al.id !== allegatoId),
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

  async uploadAllPendingFiles(newEntityId: number): Promise<void> {
    for (const file of this.pendingFiles()) {
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
    this.pendingFiles.set([]);
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
