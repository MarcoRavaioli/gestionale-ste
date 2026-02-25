import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonInput, IonTextarea, IonSelect,
  IonSelectOption, ModalController, ToastController, IonItem, IonToggle
} from '@ionic/angular/standalone';
import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { AllegatoService } from '../../services/allegato.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Indirizzo } from '../../interfaces/models';
// IMPORTIAMO IL MODALE DEL CANTIERE
import { NuovoCantiereGlobaleModalComponent } from '../nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';

import { addIcons } from 'ionicons';
import { locationOutline, documentsOutline, closeOutline, searchOutline, cloudUploadOutline, documentAttachOutline, closeCircle, add } from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-globale-modal',
  templateUrl: './nuova-commessa-globale-modal.component.html',
  styleUrls: ['./nuova-commessa-globale-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonIcon, IonInput, IonTextarea, IonSelect,
    IonSelectOption, CommonModule, FormsModule, GenericSelectorComponent,
    IonItem, IonToggle
  ],
})
export class NuovaCommessaGlobaleModalComponent implements OnInit {
  listaCantieri: Indirizzo[] = [];
  selectedCantiereId: number | null = null;
  usaCantiereGenerico = false;

  commessa = { seriale: '', descrizione: '', valore_totale: null as number | null, stato: 'APERTA' };
  selectedFile: File | null = null;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private indService: IndirizzoService,
    private commessaService: CommessaService,
    private allegatoService: AllegatoService
  ) {
    addIcons({ locationOutline, documentsOutline, closeOutline, searchOutline, cloudUploadOutline, documentAttachOutline, closeCircle, add });
  }

  ngOnInit() { this.caricaCantieri(); }

  caricaCantieri() {
    this.indService.getAll().subscribe((res) => (this.listaCantieri = res));
  }

  chiudi() { this.modalCtrl.dismiss(); }

  // MODAL STACKING: Creiamo il cantiere e lo selezioniamo!
  async creaNuovoCantiereAlVolo() {
    const modal = await this.modalCtrl.create({ component: NuovoCantiereGlobaleModalComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato && data.data) {
      this.listaCantieri.unshift(data.data);
      this.selectedCantiereId = data.data.id;
    }
  }

  // --- LOGICA ALLEGATI RIMASTA INVARIATA ---
  triggerFileInput() { document.getElementById('fileInputGlobal')?.click(); }
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) this.selectedFile = file;
  }
  rimuoviFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    const input = document.getElementById('fileInputGlobal') as HTMLInputElement;
    if (input) input.value = '';
  }
  uploadFilePromise(commessaId: number, file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.allegatoService.upload(commessaId, file).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  isValid(): boolean {
    if (!this.commessa.seriale || this.commessa.seriale.trim() === '' || !this.commessa.stato) return false;
    if (!this.usaCantiereGenerico && !this.selectedCantiereId) return false;
    return true;
  }

  salva() {
    const payload: any = { ...this.commessa };
    
    if (!this.usaCantiereGenerico && this.selectedCantiereId) {
      payload.indirizzo = { id: this.selectedCantiereId };
    } else {
      payload.indirizzo = null;
    }

    this.commessaService.create(payload).subscribe({
      next: async (res) => {
        if (this.selectedFile) {
          try { await this.uploadFilePromise(res.id, this.selectedFile); } 
          catch (err) { this.showToast('Commessa creata, ma allegato fallito.', 'warning'); }
        }
        this.modalCtrl.dismiss({ creato: true, data: res });
      },
      error: (err) => this.showToast('Errore creazione commessa.', 'danger'),
    });
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, color, duration: 3000 });
    toast.present();
  }
}