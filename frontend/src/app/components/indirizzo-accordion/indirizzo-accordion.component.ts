import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Indirizzo, Commessa } from '../../interfaces/models';
import { CommessaItemComponent } from '../commessa-item/commessa-item.component'; // Importiamo il nipote
import { addIcons } from 'ionicons';
import { locationOutline, pencilOutline, trashOutline, add } from 'ionicons/icons';

@Component({
  selector: 'app-indirizzo-accordion',
  templateUrl: './indirizzo-accordion.component.html',
  styleUrls: ['./indirizzo-accordion.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, CommessaItemComponent] // <--- Nota qui
})
export class IndirizzoAccordionComponent {
  @Input() indirizzo!: Indirizzo;
  @Input() isAdmin: boolean = false;

  // Eventi propri dell'indirizzo
  @Output() onEditIndirizzo = new EventEmitter<Indirizzo>();
  @Output() onDeleteIndirizzo = new EventEmitter<Indirizzo>();
  @Output() onAddCommessa = new EventEmitter<number>(); // Emette l'ID indirizzo

  // Eventi delle commesse (rimbalzati dal nipote al padre)
  @Output() onEditCommessa = new EventEmitter<Commessa>();
  @Output() onDeleteCommessa = new EventEmitter<Commessa>();

  constructor() {
    addIcons({ locationOutline, pencilOutline, trashOutline, add });
  }

  // Gestori locali
  handleEditIndirizzo(ev: Event) {
    ev.stopPropagation();
    this.onEditIndirizzo.emit(this.indirizzo);
  }

  handleAddCommessa() {
    this.onAddCommessa.emit(this.indirizzo.id);
  }
}