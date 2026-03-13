import { Component, Input, OnInit, ViewChild, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  IonLabel,
  IonSegment,
  IonSegmentButton,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';

import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Cliente, Indirizzo, Commessa } from '../../interfaces/models';
import { NuovoClienteModalComponent } from '../nuovo-cliente-modal/nuovo-cliente-modal.component';
import { NuovoCantiereGlobaleModalComponent } from '../nuovo-cantiere-globale-modal/nuovo-cantiere-globale-modal.component';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentAttachOutline,
  closeCircle,
  add,
  personOutline,
  locationOutline,
  saveOutline,
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
    IonLabel,
    IonSegment,
    IonSegmentButton,
    CommonModule,
    FormsModule,
    GestioneAllegatiComponent,
    GenericSelectorComponent,
  ],
})
export class NuovaCommessaModalComponent implements OnInit {
  @Input() indirizzoId?: number;
  @Input() commessaEsistente?: Commessa;

  tipoCollegamento: 'cantiere' | 'cliente' = 'cantiere';
  listaCantieri: Indirizzo[] = [];
  selectedCantiereId: number | null = null;
  listaClienti: Cliente[] = [];
  selectedClienteId: number | null = null;

  commessa: Partial<Commessa> = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: 0,
  };

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  private destroyRef = inject(DestroyRef);

  constructor(
    private modalCtrl: ModalController,
    private commessaService: CommessaService,
    private indirizzoService: IndirizzoService,
    private clienteService: ClienteService,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      cloudUploadOutline,
      documentAttachOutline,
      closeCircle,
      add,
      personOutline,
      locationOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    this.indirizzoService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => (this.listaCantieri = res));
    this.clienteService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => (this.listaClienti = res));

    if (this.commessaEsistente) {
      this.commessa = { ...this.commessaEsistente };
      if (this.commessaEsistente.indirizzo?.id) {
        this.tipoCollegamento = 'cantiere';
        this.selectedCantiereId = this.commessaEsistente.indirizzo.id;
      } else if (this.commessaEsistente.cliente?.id) {
        this.tipoCollegamento = 'cliente';
        this.selectedClienteId = this.commessaEsistente.cliente.id;
      }
    } else if (this.indirizzoId) {
      this.tipoCollegamento = 'cantiere';
      this.selectedCantiereId = this.indirizzoId;
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  async apriCreazioneRapidaCliente() {
    const modal = await this.modalCtrl.create({
      component: NuovoClienteModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato && data.data) {
      this.listaClienti.unshift(data.data);
      this.selectedClienteId = data.data.id;
      this.tipoCollegamento = 'cliente';
    }
  }

  async apriCreazioneRapidaCantiere() {
    const modal = await this.modalCtrl.create({
      component: NuovoCantiereGlobaleModalComponent,
      componentProps: {
        clienteIdPreselezionato: this.selectedClienteId,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato && data.data) {
      this.listaCantieri.unshift(data.data);
      this.selectedCantiereId = data.data.id;
      this.tipoCollegamento = 'cantiere';
    }
  }

  // --- SALVATAGGIO ---
  salva() {
    const payload: any = {
      ...this.commessa,
    };

    if (this.tipoCollegamento === 'cantiere' && this.selectedCantiereId) {
      payload.indirizzo = { id: this.selectedCantiereId };
      payload.cliente = null;
    } else if (this.tipoCollegamento === 'cliente' && this.selectedClienteId) {
      payload.cliente = { id: this.selectedClienteId };
      payload.indirizzo = null;
    }

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

    obs$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: async (res) => {
        const idCommessa = this.commessaEsistente
          ? this.commessaEsistente.id
          : res.id;
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(idCommessa);
        }
        this.modalCtrl.dismiss({ aggiornato: true, data: res });
      },
      error: (err) => {
        console.error(err);
        this.showToast('Errore nel salvataggio commessa.', 'danger');
      },
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
