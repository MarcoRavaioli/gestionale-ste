import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  ModalController,
  IonIcon,
  IonSpinner,
  IonFooter,
} from '@ionic/angular/standalone';

import { ClienteService } from '../../services/cliente.service';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';
import { Cliente } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  saveOutline,
  personOutline,
  mailOutline,
  callOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-cliente-modal',
  templateUrl: './nuovo-cliente-modal.component.html',
  styleUrls: ['./nuovo-cliente-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonIcon,
    IonSpinner,
    IonFooter,
    GestioneAllegatiComponent,
  ],
})
export class NuovoClienteModalComponent implements OnInit {
  @Input() cliente?: Cliente;

  form!: FormGroup;
  isSubmitting = false;

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private clienteService: ClienteService,
    private fb: FormBuilder,
  ) {
    addIcons({
      closeOutline,
      saveOutline,
      personOutline,
      mailOutline,
      callOutline,
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      nome: [
        this.cliente?.nome || '',
        [Validators.required, Validators.minLength(2)],
      ],
      telefono: [this.cliente?.telefono || ''],
      email: [this.cliente?.email || '', [Validators.email]],
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  salva() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const values = this.form.value;
    const payload: any = { nome: values.nome };

    if (values.telefono?.trim()) payload.telefono = values.telefono;
    if (values.email?.trim()) payload.email = values.email;

    const req$ = this.cliente
      ? this.clienteService.update(this.cliente.id, payload)
      : this.clienteService.create(payload);

    req$.subscribe({
      next: async (resCliente) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(resCliente.id);
        }
        this.isSubmitting = false;
        this.modalCtrl.dismiss({
          [this.cliente ? 'aggiornato' : 'creato']: true,
          data: resCliente,
        });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        const msg = err.error?.message || 'Errore salvataggio committente';
        alert(Array.isArray(msg) ? msg[0] : msg);
      },
    });
  }
}
