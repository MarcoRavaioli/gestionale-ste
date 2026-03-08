import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Commessa } from '../../interfaces/models';
import { IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  folderOutline,
  documentTextOutline,
  cashOutline,
  alertCircleOutline,
  businessOutline,
  constructOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-commessa-info',
  templateUrl: './commessa-info.component.html',
  styleUrls: ['./commessa-info.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonBadge],
  providers: [CurrencyPipe], // Provided locally for Euro formatting
})
export class CommessaInfoComponent {
  @Input() commessa: Commessa | null = null;

  constructor() {
    addIcons({
      folderOutline,
      documentTextOutline,
      cashOutline,
      alertCircleOutline,
      businessOutline,
      constructOutline,
    });
  }

  getStatoColor(stato: string | undefined): string {
    switch (stato) {
      case 'APERTA':
        return 'success';
      case 'CHIUSA':
        return 'medium';
      case 'IN_CORSO':
        return 'warning';
      default:
        return 'primary';
    }
  }

  formatStato(stato: string | undefined): string {
    return (stato || 'Sconosciuto').replace('_', ' ');
  }
}
