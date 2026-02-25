import { Component, Input, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  ModalController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndirizzoService } from '../../services/indirizzo.service';
import { Indirizzo } from '../../interfaces/models';

@Component({
  selector: 'app-nuovo-indirizzo-modal',
  templateUrl: './nuovo-indirizzo-modal.component.html',
  styleUrls: ['./nuovo-indirizzo-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    ModalController,
    CommonModule,
    FormsModule,
  ],
})
export class NuovoIndirizzoModalComponent implements OnInit {
  @Input() clienteId!: number;
  @Input() indirizzoEsistente?: Indirizzo; // Se passato, siamo in modifica

  indirizzo = {
    via: '',
    civico: '',
    citta: '',
    cap: '',
    provincia: '',
    stato: 'Italia',
  };

  constructor(
    private modalCtrl: ModalController,
    private indirizzoService: IndirizzoService,
  ) {}

  ngOnInit() {
    // Se stiamo modificando, pre-compiliamo i campi
    if (this.indirizzoEsistente) {
      this.indirizzo = {
        via: this.indirizzoEsistente.via,
        civico: this.indirizzoEsistente.civico,
        citta: this.indirizzoEsistente.citta,
        cap: this.indirizzoEsistente.cap,
        provincia: this.indirizzoEsistente.provincia || '',
        stato: this.indirizzoEsistente.stato,
      };
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  salva() {
    // Creiamo il payload. Usiamo 'as any' per evitare noie sui campi mancanti
    const payload = {
      ...this.indirizzo,
      cliente: { id: this.clienteId },
    } as any;

    if (this.indirizzoEsistente) {
      // CASO MODIFICA
      this.indirizzoService
        .update(this.indirizzoEsistente.id, payload)
        .subscribe({
          next: (res) =>
            this.modalCtrl.dismiss({ aggiornato: true, data: res }),
          error: (err) => console.error(err),
        });
    } else {
      // CASO CREAZIONE
      this.indirizzoService.create(payload).subscribe({
        next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
        error: (err) => console.error(err),
      });
    }
  }
}
