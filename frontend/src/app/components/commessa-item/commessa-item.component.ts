import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Commessa } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-commessa-item',
  templateUrl: './commessa-item.component.html',
  styleUrls: ['./commessa-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CommessaItemComponent {
  @Input() commessa!: Commessa;
  @Input() isAdmin: boolean = false;

  // Eventi che mandiamo al padre quando si clicca
  @Output() onEdit = new EventEmitter<Commessa>();
  @Output() onDelete = new EventEmitter<Commessa>();

  constructor() {
    addIcons({ pencilOutline, trashOutline, calendarOutline });
  }

  handleEdit(event: Event) {
    event.stopPropagation();
    this.onEdit.emit(this.commessa);
  }

  handleDelete(event: Event) {
    event.stopPropagation();
    this.onDelete.emit(this.commessa);
  }

  getColoreStato(stato: string): string {
    switch (stato) {
      case 'APERTA': return 'success';
      case 'IN_CORSO': return 'warning';
      case 'CHIUSA': return 'medium';
      default: return 'primary';
    }
  }
}