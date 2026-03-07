import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
} from '@ionic/angular/standalone';
import { ClienteService } from '../../services/cliente.service';
import { GestioneAllegatiComponent } from '../gestione-allegati/gestione-allegati.component';

@Component({
  selector: 'app-nuovo-cliente-modal',
  templateUrl: './nuovo-cliente-modal.component.html',
  styleUrls: ['./nuovo-cliente-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    GestioneAllegatiComponent,
  ],
})
export class NuovoClienteModalComponent {
  cliente: any = {
    nome: '',
    telefono: '',
    email: '',
  };

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private modalCtrl: ModalController,
    private clienteService: ClienteService,
  ) {}

  chiudi() {
    this.modalCtrl.dismiss();
  }

  salva() {
    if (!this.cliente.nome) return;

    // --- CORREZIONE: Pulizia Dati ---
    // Creiamo un payload pulito. Se un campo è vuoto (""), non lo inviamo proprio.
    const payload: any = {
      nome: this.cliente.nome,
    };

    if (this.cliente.telefono && this.cliente.telefono.trim() !== '') {
      payload.telefono = this.cliente.telefono;
    }

    if (this.cliente.email && this.cliente.email.trim() !== '') {
      payload.email = this.cliente.email;
    }

    // Ora inviamo 'payload' invece di 'this.cliente'
    this.clienteService.create(payload).subscribe({
      next: async (nuovoCliente) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(nuovoCliente.id);
        }
        this.modalCtrl.dismiss({ creato: true, data: nuovoCliente });
      },
      error: (err) => {
        console.error(err);
        // Suggerimento: mostra l'errore specifico se disponibile
        const msg = err.error?.message || 'Errore salvataggio cliente';
        alert(Array.isArray(msg) ? msg[0] : msg);
      },
    });
  }
}
