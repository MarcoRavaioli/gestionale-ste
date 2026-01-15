import { Component, Input, ElementRef, OnChanges, SimpleChanges } from '@angular/core'; // <--- Aggiungi ElementRef, OnChanges, SimpleChanges
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Commessa } from '../../interfaces/models';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-commessa-item',
  templateUrl: './commessa-item.component.html',
  styleUrls: ['./commessa-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class CommessaItemComponent implements OnChanges { // <--- Implementa OnChanges
  @Input() commessa!: Commessa;
  @Input() isAdmin: boolean = false;
  @Input() targetAppuntamentoId: number | null = null; 

  // Inietta ElementRef per poter manipolare il DOM e scrollare
  constructor(private el: ElementRef) {
    addIcons({ calendarOutline });
  }

  // Quando cambia l'input (arriva l'ID target)...
  ngOnChanges(changes: SimpleChanges) {
    if (this.targetAppuntamentoId && this.commessa.appuntamenti) {
      // Controlliamo se l'appuntamento da cercare è in questa lista (usa ==)
      const found = this.commessa.appuntamenti.some(a => a.id == this.targetAppuntamentoId);
      
      if (found) {
        // Aspettiamo 600ms (tempo che l'accordion si apra) e poi scrolliamo
        setTimeout(() => {
          // Cerchiamo l'elemento con la classe .highlight-item DENTRO questo componente
          const highlightedElement = this.el.nativeElement.querySelector('.highlight-item');
          if (highlightedElement) {
            highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 600);
      }
    }
  }
}