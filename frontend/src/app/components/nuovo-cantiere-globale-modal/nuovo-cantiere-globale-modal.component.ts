import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from '../../services/indirizzo.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Cliente } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import { personAddOutline, searchOutline, closeOutline, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-nuovo-cantiere-globale-modal',
  templateUrl: './nuovo-cantiere-globale-modal.component.html',
  styleUrls: ['./nuovo-cantiere-globale-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, GenericSelectorComponent],
})
export class NuovoCantiereGlobaleModalComponent implements OnInit {
  // Dati per la selezione
  listaClienti: Cliente[] = [];

  // Modalità: 'esistente' o 'nuovo'
  mode: 'esistente' | 'nuovo' = 'esistente';

  // Dati del form
  clienteSelezionatoId: number | null = null;

  nuovoCliente = {
    nome: '',
    email: '',
    telefono: '',
  };

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
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService
  ) {
    addIcons({ personAddOutline, searchOutline, closeOutline, locationOutline });
  }

  ngOnInit() {
    // Carichiamo tutti i clienti per la tendina
    this.clienteService.getAll().subscribe((data) => {
      // Li ordiniamo alfabeticamente per comodità
      this.listaClienti = data.sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  toggleMode() {
    this.mode = this.mode === 'esistente' ? 'nuovo' : 'esistente';
    // Reset delle scelte per evitare confusione
    this.clienteSelezionatoId = null;
  }

  salva() {
    if (this.mode === 'esistente' && this.clienteSelezionatoId) {
      // CASO 1: Cliente Esistente -> Creo solo indirizzo
      this.creaIndirizzo(this.clienteSelezionatoId);
    } else if (this.mode === 'nuovo' && this.nuovoCliente.nome) {
      // CASO 2: Nuovo Cliente -> Creo Cliente POI Indirizzo
      this.clienteService.create(this.nuovoCliente).subscribe({
        next: (clienteCreato) => {
          this.creaIndirizzo(clienteCreato.id);
        },
        error: (err) => console.error('Errore creazione cliente', err),
      });
    }
  }

  creaIndirizzo(clienteId: number) {
    const payload = {
      ...this.indirizzo,
      cliente: { id: clienteId },
    } as any;

    if (payload.cap) payload.cap = String(payload.cap);
    if (payload.civico) payload.civico = String(payload.civico);

    this.indirizzoService.create(payload).subscribe({
      next: (res) => {
        this.modalCtrl.dismiss({ creato: true, data: res });
      },
      error: (err) => console.error('Errore creazione indirizzo', err),
    });
  }

  // Helper per validare il form
  isFormValid(): boolean {
    const isIndirizzoValid = this.indirizzo.via && this.indirizzo.citta;

    if (this.mode === 'esistente') {
      return !!(isIndirizzoValid && this.clienteSelezionatoId);
    } else {
      return !!(isIndirizzoValid && this.nuovoCliente.nome);
    }
  }
}
