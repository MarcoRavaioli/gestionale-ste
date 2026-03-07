import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  ModalController,
  ToastController,
  IonSegment,
  IonSegmentButton,
  IonLabel, // <--- AGGIUNTO IonLabel
} from '@ionic/angular/standalone';
import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { AllegatoService } from '../../services/allegato.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';
import { Indirizzo, Cliente } from '../../interfaces/models';

import { addIcons } from 'ionicons';
import {
  locationOutline,
  documentsOutline,
  closeOutline,
  searchOutline,
  cloudUploadOutline,
  documentAttachOutline,
  closeCircle,
  add,
  personOutline,
  linkOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-globale-modal',
  templateUrl: './nuova-commessa-globale-modal.component.html',
  styleUrls: ['./nuova-commessa-globale-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    CommonModule,
    FormsModule,
    GenericSelectorComponent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    GestioneAllegatiComponent, // <--- AGGIUNTO IonLabel E GestioneAllegatiComponent
  ],
})
export class NuovaCommessaGlobaleModalComponent implements OnInit {
  tipoCollegamento: 'cantiere' | 'cliente' | 'nessuno' = 'cantiere';

  listaCantieri: Indirizzo[] = [];
  selectedCantiereId: number | null = null;

  listaClienti: Cliente[] = [];
  selectedClienteId: number | null = null;

  commessa = {
    seriale: '',
    descrizione: '',
    valore_totale: null as number | null,
    stato: 'APERTA',
  };

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private indService: IndirizzoService,
    private clienteService: ClienteService,
    private commessaService: CommessaService,
    private allegatoService: AllegatoService,
  ) {
    addIcons({
      locationOutline,
      documentsOutline,
      closeOutline,
      searchOutline,
      cloudUploadOutline,
      documentAttachOutline,
      closeCircle,
      add,
      personOutline,
      linkOutline,
    });
  }

  ngOnInit() {
    this.caricaDati();
  }

  caricaDati() {
    this.indService.getAll().subscribe((res) => (this.listaCantieri = res));
    this.clienteService.getAll().subscribe((res) => (this.listaClienti = res));
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  isValid(): boolean {
    if (
      !this.commessa.seriale ||
      this.commessa.seriale.trim() === '' ||
      !this.commessa.stato
    )
      return false;
    if (this.tipoCollegamento === 'cantiere' && !this.selectedCantiereId)
      return false;
    if (this.tipoCollegamento === 'cliente' && !this.selectedClienteId)
      return false;
    return true;
  }

  salva() {
    const payload: any = { ...this.commessa };
    payload.indirizzo = null;
    payload.cliente = null;

    if (this.tipoCollegamento === 'cantiere' && this.selectedCantiereId) {
      payload.indirizzo = { id: this.selectedCantiereId };
    } else if (this.tipoCollegamento === 'cliente' && this.selectedClienteId) {
      payload.cliente = { id: this.selectedClienteId };
    }

    this.commessaService.create(payload).subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }
        this.modalCtrl.dismiss({ creato: true, data: res });
      },
      error: (err) => this.showToast('Errore creazione commessa.', 'danger'),
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
