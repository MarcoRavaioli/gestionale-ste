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
  IonSelect,
  IonSelectOption,
  ModalController,
  ToastController,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonFooter,
  IonItem,
} from '@ionic/angular/standalone';
import { CommessaService } from '../../services/commessa.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { ClienteService } from '../../services/cliente.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';
import { Indirizzo, Cliente, Commessa } from '../../interfaces/models';

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
  saveOutline,
  folderOutline,
  pricetagOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-commessa-globale-modal',
  templateUrl: './nuova-commessa-globale-modal.component.html',
  styleUrls: ['./nuova-commessa-globale-modal.component.scss'],
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
    IonSelect,
    IonSelectOption,
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
export class NuovaCommessaGlobaleModalComponent implements OnInit {
  @Input() commessa?: Commessa;
  @Input() cantiereIdPreselezionato?: number;
  @Input() clienteIdPreselezionato?: number;

  form!: FormGroup;
  isSubmitting = false;

  tipoCollegamento: 'cantiere' | 'cliente' | 'nessuno' = 'cantiere';
  listaCantieri: Indirizzo[] = [];
  selectedCantiereId: number | null = null;
  listaClienti: Cliente[] = [];
  selectedClienteId: number | null = null;

  isCollegamentoVincolato = false;

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private indService: IndirizzoService,
    private clienteService: ClienteService,
    private commessaService: CommessaService,
    private fb: FormBuilder,
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
      saveOutline,
      folderOutline,
      pricetagOutline,
    });
  }

  ngOnInit() {
    this.indService.getAll().subscribe((res) => (this.listaCantieri = res));
    this.clienteService.getAll().subscribe((res) => (this.listaClienti = res));

    if (this.commessa) {
      if (this.commessa.indirizzo?.id) {
        this.tipoCollegamento = 'cantiere';
        this.selectedCantiereId = this.commessa.indirizzo.id;
      } else if (this.commessa.cliente?.id) {
        this.tipoCollegamento = 'cliente';
        this.selectedClienteId = this.commessa.cliente.id;
      } else {
        this.tipoCollegamento = 'nessuno';
      }
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
      seriale: [this.commessa?.seriale || '', [Validators.required]],
      descrizione: [this.commessa?.descrizione || ''],
      valore_totale: [this.commessa?.valore_totale || null],
      stato: [this.commessa?.stato || 'APERTA', [Validators.required]],
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  isValid(): boolean {
    if (this.form.invalid) return false;
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
    const values = this.form.value;

    const payload: any = {
      seriale: values.seriale,
      descrizione: values.descrizione,
      valore_totale: values.valore_totale,
      stato: values.stato,
      indirizzo: null,
      cliente: null,
    };

    if (this.tipoCollegamento === 'cantiere' && this.selectedCantiereId) {
      payload.indirizzo = { id: this.selectedCantiereId };
    } else if (this.tipoCollegamento === 'cliente' && this.selectedClienteId) {
      payload.cliente = { id: this.selectedClienteId };
    }

    const req$ = this.commessa
      ? this.commessaService.update(this.commessa.id, payload)
      : this.commessaService.create(payload);

    req$.subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }
        this.isSubmitting = false;
        this.modalCtrl.dismiss({
          [this.commessa ? 'aggiornato' : 'creato']: true,
          data: res,
        });
      },
      error: async (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Errore salvataggio commessa.';
        const toast = await this.toastCtrl.create({
          message: Array.isArray(msg) ? msg[0] : msg,
          color: 'danger',
          duration: 3000,
        });
        toast.present();
      },
    });
  }

  getPreselectedName(): string {
    if (this.tipoCollegamento === 'cantiere') {
      const cant = this.listaCantieri.find(
        (c) => c.id === this.selectedCantiereId,
      );
      return cant ? `${cant.via} ${cant.civico}` : 'Cantiere Preselezionato';
    }
    const cli = this.listaClienti.find((c) => c.id === this.selectedClienteId);
    return cli ? cli.nome : 'Cliente Preselezionato';
  }
}
