import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
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
  ModalController,
  ToastController,
  AlertController,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonFooter,
  IonItem,
} from '@ionic/angular/standalone';
import { AppuntamentoService } from '../../services/appuntamento.service';
import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import {
  Appuntamento,
  Commessa,
  Indirizzo,
  Cliente,
} from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { addIcons } from 'ionicons';
import {
  calendarOutline,
  documentsOutline,
  closeOutline,
  add,
  trashOutline,
  locationOutline,
  personOutline,
  linkOutline,
  saveOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-appuntamento-globale-modal',
  templateUrl: './nuovo-appuntamento-globale-modal.component.html',
  styleUrls: ['./nuovo-appuntamento-globale-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonFooter,
    IonItem,
    GenericSelectorComponent,
    GestioneAllegatiComponent,
  ],
})
export class NuovoAppuntamentoGlobaleModalComponent implements OnInit {
  @Input() appuntamento?: Appuntamento;
  @Input() commessaIdPreselezionato?: number;
  @Input() cantiereIdPreselezionato?: number;
  @Input() clienteIdPreselezionato?: number;

  isEditing = false;
  isSubmitting = false;
  isDeleting = false;

  tipoCollegamento: 'commessa' | 'cantiere' | 'cliente' | 'nessuno' =
    'commessa';
  isCollegamentoVincolato = false;

  listaCommesse: Commessa[] = [];
  selectedCommessaId: number | null = null;
  listaCantieri: Indirizzo[] = [];
  selectedCantiereId: number | null = null;
  listaClienti: Cliente[] = [];
  selectedClienteId: number | null = null;

  form!: FormGroup;

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private appService: AppuntamentoService,
    private comService: CommessaService,
    private indService: IndirizzoService,
    private clienteService: ClienteService,
    private fb: FormBuilder,
  ) {
    addIcons({
      calendarOutline,
      documentsOutline,
      closeOutline,
      add,
      trashOutline,
      locationOutline,
      personOutline,
      linkOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    this.caricaDatiBase();

    if (this.appuntamento) {
      this.isEditing = true;
      if (this.appuntamento.commessa) {
        this.tipoCollegamento = 'commessa';
        this.selectedCommessaId = this.appuntamento.commessa.id;
      } else if (this.appuntamento.indirizzo) {
        this.tipoCollegamento = 'cantiere';
        this.selectedCantiereId = this.appuntamento.indirizzo.id;
      } else if (this.appuntamento.cliente) {
        this.tipoCollegamento = 'cliente';
        this.selectedClienteId = this.appuntamento.cliente.id;
      } else {
        this.tipoCollegamento = 'nessuno';
      }
    } else if (this.commessaIdPreselezionato) {
      this.tipoCollegamento = 'commessa';
      this.selectedCommessaId = this.commessaIdPreselezionato;
      this.isCollegamentoVincolato = true;
    } else if (this.cantiereIdPreselezionato) {
      this.tipoCollegamento = 'cantiere';
      this.selectedCantiereId = this.cantiereIdPreselezionato;
      this.isCollegamentoVincolato = true;
    } else if (this.clienteIdPreselezionato) {
      this.tipoCollegamento = 'cliente';
      this.selectedClienteId = this.clienteIdPreselezionato;
      this.isCollegamentoVincolato = true;
    }

    this.form = this.fb.group({
      data_ora: [
        this.appuntamento?.data_ora
          ? new Date(this.appuntamento.data_ora).toISOString().slice(0, 16)
          : '',
        [Validators.required],
      ],
      descrizione: [this.appuntamento?.descrizione || ''],
    });
  }

  caricaDatiBase() {
    this.comService.getAll().subscribe((res) => (this.listaCommesse = res));
    this.indService.getAll().subscribe((res) => (this.listaCantieri = res));
    this.clienteService.getAll().subscribe((res) => (this.listaClienti = res));
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  isValid(): boolean {
    if (this.form.invalid) return false;
    if (this.tipoCollegamento === 'commessa' && !this.selectedCommessaId)
      return false;
    if (this.tipoCollegamento === 'cantiere' && !this.selectedCantiereId)
      return false;
    if (this.tipoCollegamento === 'cliente' && !this.selectedClienteId)
      return false;
    return true;
  }

  salva() {
    if (!this.isValid()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload: any = { ...this.form.value };
    payload.nome = 'Intervento'; // default name

    payload.commessa = null;
    payload.indirizzo = null;
    payload.cliente = null;

    if (this.tipoCollegamento === 'commessa' && this.selectedCommessaId) {
      payload.commessa = { id: this.selectedCommessaId };
    } else if (
      this.tipoCollegamento === 'cantiere' &&
      this.selectedCantiereId
    ) {
      payload.indirizzo = { id: this.selectedCantiereId };
    } else if (this.tipoCollegamento === 'cliente' && this.selectedClienteId) {
      payload.cliente = { id: this.selectedClienteId };
    }

    if (Haptics) Haptics.impact({ style: ImpactStyle.Light });

    const req$ =
      this.isEditing && this.appuntamento
        ? this.appService.update(this.appuntamento.id, payload)
        : this.appService.create(payload);

    req$.subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }
        this.isSubmitting = false;
        this.modalCtrl.dismiss({
          [this.isEditing ? 'aggiornato' : 'creato']: true,
          data: res,
        });
      },
      error: () => {
        this.isSubmitting = false;
        this.mostraToast('Errore salvataggio', 'danger');
      },
    });
  }

  async elimina() {
    if (Haptics) Haptics.impact({ style: ImpactStyle.Medium });
    const alert = await this.alertCtrl.create({
      header: 'Elimina Appuntamento',
      message: 'Sei sicuro di voler eliminare questo appuntamento?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => this.confermaEliminazione(),
        },
      ],
    });
    await alert.present();
  }

  confermaEliminazione() {
    if (!this.appuntamento) return;
    this.isDeleting = true;
    this.appService.delete(this.appuntamento.id).subscribe({
      next: async () => {
        if (Haptics) await Haptics.notification({ type: 'SUCCESS' } as any);
        this.mostraToast('Appuntamento eliminato', 'success');
        this.isDeleting = false;
        this.modalCtrl.dismiss({ eliminato: true });
      },
      error: async () => {
        this.isDeleting = false;
        this.mostraToast('Errore eliminazione', 'danger');
      },
    });
  }

  async mostraToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      color,
      duration: 2000,
    });
    toast.present();
  }

  getPreselectedName(): string {
    if (this.tipoCollegamento === 'commessa') {
      const c = this.listaCommesse.find(
        (l) => l.id === this.selectedCommessaId,
      );
      return c
        ? c.seriale + (c.descrizione ? ' - ' + c.descrizione : '')
        : 'Commessa Selezionata';
    } else if (this.tipoCollegamento === 'cantiere') {
      const c = this.listaCantieri.find(
        (l) => l.id === this.selectedCantiereId,
      );
      return c ? `${c.via} ${c.civico}` : 'Cantiere Selezionato';
    } else {
      const c = this.listaClienti.find((l) => l.id === this.selectedClienteId);
      return c ? c.nome : 'Cliente Selezionato';
    }
  }
}
