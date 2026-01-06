import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-nuovo-cliente-modal',
  templateUrl: './nuovo-cliente-modal.component.html',
  styleUrls: ['./nuovo-cliente-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NuovoClienteModalComponent {
  
  // Oggetto temporaneo per il form
  cliente = {
    nome: '',
    telefono: '',
    email: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private clienteService: ClienteService
  ) {}

  chiudi() {
    this.modalCtrl.dismiss();
  }

  salva() {
    if (!this.cliente.nome) return;

    // Chiamiamo il backend
    this.clienteService.create(this.cliente).subscribe({
      next: (nuovoCliente) => {
        // Chiudiamo la modale e passiamo il nuovo cliente alla pagina sotto
        this.modalCtrl.dismiss({ creato: true, data: nuovoCliente });
      },
      error: (err) => {
        console.error(err);
        alert('Errore salvataggio cliente');
      }
    });
  }
}