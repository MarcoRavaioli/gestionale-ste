import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonInput, ModalController, ToastController, IonItem, IonToggle
} from '@ionic/angular/standalone';
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Cliente } from '../../interfaces/models';
// IMPORTIAMO IL MODALE DEL CLIENTE
import { NuovoClienteModalComponent } from '../nuovo-cliente-modal/nuovo-cliente-modal.component';

import { addIcons } from 'ionicons';
import { personAddOutline, locationOutline, closeOutline, searchOutline, add } from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-cantiere-globale-modal',
  templateUrl: './nuovo-cantiere-globale-modal.component.html',
  styleUrls: ['./nuovo-cantiere-globale-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonIcon, IonInput, CommonModule, FormsModule, GenericSelectorComponent,
    IonItem, IonToggle
  ],
})
export class NuovoCantiereGlobaleModalComponent implements OnInit {
  listaClienti: Cliente[] = [];
  clienteSelezionatoId: number | null = null;
  usaClienteGenerico = false;

  indirizzo = { via: '', civico: '', citta: '', cap: '', provincia: '', stato: 'Italia' };

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService
  ) {
    addIcons({ personAddOutline, locationOutline, closeOutline, searchOutline, add });
  }

  ngOnInit() { this.caricaClienti(); }

  caricaClienti() {
    this.clienteService.getAll().subscribe((res) => (this.listaClienti = res));
  }

  chiudi() { this.modalCtrl.dismiss(); }

  // MODAL STACKING: Creiamo il cliente e lo selezioniamo!
  async creaNuovoClienteAlVolo() {
    const modal = await this.modalCtrl.create({ component: NuovoClienteModalComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato && data.data) {
      this.listaClienti.unshift(data.data);
      this.clienteSelezionatoId = data.data.id;
    }
  }

  isValid(): boolean {
    if (!this.indirizzo.via || this.indirizzo.via.trim() === '' || !this.indirizzo.citta) return false;
    if (!this.usaClienteGenerico && !this.clienteSelezionatoId) return false;
    return true;
  }

  salva() {
    const payload: any = { ...this.indirizzo };
    if (payload.cap) payload.cap = String(payload.cap);
    if (payload.civico) payload.civico = String(payload.civico);

    if (!this.usaClienteGenerico && this.clienteSelezionatoId) {
      payload.cliente = { id: this.clienteSelezionatoId };
    } else {
      payload.cliente = null;
    }

    this.indirizzoService.create(payload).subscribe({
      next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
      error: (err) => this.showToast('Errore creazione cantiere', 'danger'),
    });
  }

  async showToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, color, duration: 3000 });
    t.present();
  }
}