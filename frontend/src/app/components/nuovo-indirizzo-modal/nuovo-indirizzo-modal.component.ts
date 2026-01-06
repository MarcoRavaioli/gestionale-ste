import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndirizzoService } from '../../services/indirizzo';

@Component({
  selector: 'app-nuovo-indirizzo-modal',
  templateUrl: './nuovo-indirizzo-modal.component.html',
  styleUrls: ['./nuovo-indirizzo-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NuovoIndirizzoModalComponent {
  @Input() clienteId!: number; // Riceviamo l'ID del cliente da fuori

  indirizzo = {
    via: '',
    civico: '',
    citta: '',
    cap: '',
    provincia: '',
    stato: 'Italia',
    cliente: null as any // Lo imposteremo col clienteId
  };

  constructor(private modalCtrl: ModalController, private indirizzoService: IndirizzoService) {}

  chiudi() { this.modalCtrl.dismiss(); }

  salva() {
    // Prepariamo l'oggetto come lo vuole il backend (con la relazione cliente)
    const payload = { ...this.indirizzo, cliente: { id: this.clienteId } };
    
    this.indirizzoService.create(payload as any).subscribe({
      next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
      error: (err) => console.error(err)
    });
  }
}