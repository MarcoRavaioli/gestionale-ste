import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommessaService } from '../../services/commessa.service';
// 1. IMPORTA L'INTERFACCIA
import { Commessa } from '../../interfaces/models'; 

@Component({
  selector: 'app-nuova-commessa-modal',
  templateUrl: './nuova-commessa-modal.component.html',
  styleUrls: ['./nuova-commessa-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NuovaCommessaModalComponent {
  @Input() clienteId!: number;

  // 2. DEFINISCI IL TIPO ESPLICITO
  // Usiamo 'Partial' perché l'ID non c'è ancora (lo crea il DB)
  commessa: Partial<Commessa> = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA', // Ora TypeScript sa che questo valore è valido
    clienteId: 0
  };

  constructor(private modalCtrl: ModalController, private commessaService: CommessaService) {}

  chiudi() { this.modalCtrl.dismiss(); }

  salva() {
    this.commessa.clienteId = this.clienteId;
    
    // Ora il tipo combacia perfettamente
    this.commessaService.create(this.commessa).subscribe({
      next: (res) => this.modalCtrl.dismiss({ creato: true, data: res }),
      error: (err) => console.error(err)
    });
  }
}