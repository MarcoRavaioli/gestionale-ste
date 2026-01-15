import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommessaService } from '../../services/commessa.service';
import { GenericSelectorComponent } from '../generic-selector/generic-selector.component';
import { Commessa } from '../../interfaces/models';

@Component({
  selector: 'app-nuova-commessa-modal',
  templateUrl: './nuova-commessa-modal.component.html',
  styleUrls: ['./nuova-commessa-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, GenericSelectorComponent],
})
export class NuovaCommessaModalComponent {
  // CORREZIONE 1: Non riceviamo più clienteId, ma indirizzoId
  @Input() indirizzoId!: number;
  @Input() commessaEsistente?: Commessa;

  commessa: Partial<Commessa> = {
    seriale: '',
    descrizione: '',
    stato: 'APERTA',
    valore_totale: 0,
  };

  constructor(
    private modalCtrl: ModalController,
    private commessaService: CommessaService
  ) {}

  ngOnInit() {
    if (this.commessaEsistente) {
      this.commessa = { ...this.commessaEsistente };
    }
  }

  chiudi() {
    this.modalCtrl.dismiss();
  }

  salva() {
    const payload = {
      ...this.commessa,
      indirizzo: { id: this.indirizzoId },
    };

    if (this.commessaEsistente) {
      // AGGIUNTO 'as any' qui sotto
      this.commessaService
        .update(this.commessaEsistente.id, payload as any)
        .subscribe({
          next: (res) =>
            this.modalCtrl.dismiss({ aggiornato: true, data: res }),
          error: (err) => console.error(err),
        });
    } else {
      // AGGIUNTO 'as any' qui sotto
      this.commessaService.create(payload as any).subscribe({
        next: (res) => this.modalCtrl.dismiss({ aggiornato: true, data: res }),
        error: (err) => console.error(err),
      });
    }
  }
}
