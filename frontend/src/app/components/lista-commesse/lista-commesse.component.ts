import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonItemGroup,
  IonItemDivider,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  createOutline,
  documents,
  personOutline,
  folderOpenOutline,
} from 'ionicons/icons';
import { Commessa } from '../../interfaces/models';

@Component({
  selector: 'app-lista-commesse',
  templateUrl: './lista-commesse.component.html',
  styleUrls: ['./lista-commesse.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonItemGroup,
    IonItemDivider,
  ],
})
export class ListaCommesseComponent {
  @Input() commesseLista: Commessa[] = [];
  @Input() commesseGruppi: { nome: string; items: Commessa[] }[] = [];
  @Input() isGrouped: boolean = false;

  @Output() itemClick = new EventEmitter<Commessa>();

  constructor() {
    addIcons({
      chevronForward,
      createOutline,
      documents,
      personOutline,
      folderOpenOutline,
    });
  }

  getColoreStato(stato: string): string {
    switch (stato) {
      case 'APERTA':
        return 'success';
      case 'IN_CORSO':
        return 'warning';
      case 'CHIUSA':
        return 'medium';
      default:
        return 'primary';
    }
  }
}
