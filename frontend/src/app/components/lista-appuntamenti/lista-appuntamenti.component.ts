import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonItemGroup,
  IonItemDivider,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  createOutline,
  calendar,
  locationOutline,
  personOutline,
  calendarNumberOutline,
} from 'ionicons/icons';
import { Appuntamento } from '../../interfaces/models';

@Component({
  selector: 'app-lista-appuntamenti',
  templateUrl: './lista-appuntamenti.component.html',
  styleUrls: ['./lista-appuntamenti.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonItemGroup,
    IonItemDivider,
  ],
})
export class ListaAppuntamentiComponent {
  @Input() appuntamentiLista: Appuntamento[] = [];
  @Input() appuntamentiGruppi: { nome: string; items: Appuntamento[] }[] = [];
  @Input() isGrouped: boolean = false;
  // pass the string 'giorno', 'settimana', etc. to format the date correctly inside grouped views
  @Input() groupBySetting: string | undefined = undefined;

  @Output() itemClick = new EventEmitter<Appuntamento>();

  constructor() {
    addIcons({
      chevronForward,
      createOutline,
      calendar,
      locationOutline,
      personOutline,
      calendarNumberOutline,
    });
  }
}
