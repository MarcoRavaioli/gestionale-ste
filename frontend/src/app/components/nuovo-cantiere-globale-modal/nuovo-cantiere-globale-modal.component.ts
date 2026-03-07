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
  ModalController,
  ToastController,
  IonItem,
  IonToggle,
  IonSpinner,
  IonFooter,
  IonLabel,
} from '@ionic/angular/standalone';

import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Cliente, Indirizzo } from '../../interfaces/models';
import { NuovoClienteModalComponent } from '../nuovo-cliente-modal/nuovo-cliente-modal.component';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';

import { addIcons } from 'ionicons';
import {
  personAddOutline,
  locationOutline,
  closeOutline,
  searchOutline,
  add,
  saveOutline,
  businessOutline,
  personOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-cantiere-globale-modal',
  templateUrl: './nuovo-cantiere-globale-modal.component.html',
  styleUrls: ['./nuovo-cantiere-globale-modal.component.scss'],
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
    GenericSelectorComponent,
    IonItem,
    IonToggle,
    GestioneAllegatiComponent,
    IonSpinner,
    IonFooter,
    IonLabel,
  ],
})
export class NuovoCantiereGlobaleModalComponent implements OnInit {
  @Input() cantiere?: Indirizzo;
  @Input() clienteIdPreselezionato?: number;

  form!: FormGroup;
  isSubmitting = false;

  listaClienti: Cliente[] = [];
  clienteSelezionatoId: number | null = null;
  usaClienteGenerico = false;

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private fb: FormBuilder,
  ) {
    addIcons({
      personAddOutline,
      locationOutline,
      closeOutline,
      searchOutline,
      add,
      saveOutline,
      businessOutline,
      personOutline,
    });
  }

  ngOnInit() {
    this.clienteService.getAll().subscribe((res) => (this.listaClienti = res));

    if (this.cantiere) {
      this.clienteSelezionatoId = this.cantiere.cliente?.id || null;
      this.usaClienteGenerico = !this.clienteSelezionatoId;
    } else if (this.clienteIdPreselezionato) {
      this.clienteSelezionatoId = this.clienteIdPreselezionato;
      this.usaClienteGenerico = false;
    }

    this.form = this.fb.group({
      via: [this.cantiere?.via || '', [Validators.required]],
      civico: [this.cantiere?.civico || '', [Validators.required]],
      citta: [this.cantiere?.citta || '', [Validators.required]],
      cap: [this.cantiere?.cap || ''],
      provincia: [this.cantiere?.provincia || ''],
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  async creaNuovoClienteAlVolo() {
    const modal = await this.modalCtrl.create({
      component: NuovoClienteModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato && data.data) {
      this.listaClienti.unshift(data.data);
      this.clienteSelezionatoId = data.data.id;
    }
  }

  isValid(): boolean {
    if (this.form.invalid) return false;
    if (!this.usaClienteGenerico && !this.clienteSelezionatoId) return false;
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
      via: values.via,
      civico: String(values.civico),
      citta: values.citta,
      stato: 'Italia',
    };

    if (values.cap) payload.cap = String(values.cap);
    if (values.provincia) payload.provincia = values.provincia;

    if (!this.usaClienteGenerico && this.clienteSelezionatoId) {
      payload.cliente = { id: this.clienteSelezionatoId };
    } else {
      payload.cliente = null;
    }

    const req$ = this.cantiere
      ? this.indirizzoService.update(this.cantiere.id, payload)
      : this.indirizzoService.create(payload);

    req$.subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }
        this.isSubmitting = false;
        this.modalCtrl.dismiss({
          [this.cantiere ? 'aggiornato' : 'creato']: true,
          data: res,
        });
      },
      error: async (err) => {
        console.error(err);
        this.isSubmitting = false;
        const msg = err.error?.message || 'Errore salvataggio cantiere';
        const t = await this.toastCtrl.create({
          message: Array.isArray(msg) ? msg[0] : msg,
          color: 'danger',
          duration: 3000,
        });
        t.present();
      },
    });
  }

  get preselectedClienteNome(): string {
    return (
      this.listaClienti.find((c) => c.id === this.clienteIdPreselezionato)
        ?.nome || 'Cliente Preselezionato'
    );
  }
}
