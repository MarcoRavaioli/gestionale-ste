import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationController, IonicModule } from '@ionic/angular';
import { Indirizzo, Commessa } from '../../interfaces/models';
import { CommessaItemComponent } from '../commessa-item/commessa-item.component';
import { addIcons } from 'ionicons';
import {
  add,
  locationOutline,
  pencilOutline,
  trashOutline,
  calendarOutline,
} from 'ionicons/icons'; // Aggiungi icone che servono nell'HTML

@Component({
  selector: 'app-indirizzo-accordion',
  templateUrl: './indirizzo-accordion.component.html',
  styleUrls: ['./indirizzo-accordion.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, CommessaItemComponent],
})
export class IndirizzoAccordionComponent implements OnChanges {
  @Input() indirizzo!: Indirizzo;
  @Input() isAdmin: boolean = false;

  @Input() targetCommessaId: number | null = null;
  @Input() targetAppuntamentoId: number | null = null;

  @Output() onAddCommessa = new EventEmitter<number>();
  @Output() onEditCommessa = new EventEmitter<Commessa>();
  @Output() onDeleteCommessa = new EventEmitter<Commessa>();

  commesseAperte: string[] = [];

  constructor(private el: ElementRef, private animationCtrl: AnimationController) {
    // Registra tutte le icone necessarie per l'intestazione che sposteremo qui
    addIcons({
      add,
      locationOutline,
      pencilOutline,
      trashOutline,
      calendarOutline,
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['indirizzo'] || changes['targetCommessaId']) {
      this.apriCommessaTarget();
    }
  }

  apriCommessaTarget() {
    if (this.targetCommessaId && this.indirizzo?.commesse) {
      // Usa == per sicurezza (stringa vs numero)
      const found = this.indirizzo.commesse.find(c => c.id == this.targetCommessaId);
      
      if (found) {
        this.commesseAperte = ['commessa-' + this.targetCommessaId];

        // Se NON cerchiamo un appuntamento, evidenziamo la commessa
        if (!this.targetAppuntamentoId) {
          
          // Timeout aumentato a 800ms: deve aspettare che si apra il Cantiere (padre)
          setTimeout(() => {
            const headerId = 'commessa-header-' + this.targetCommessaId;
            const element = document.getElementById(headerId); 
            
            console.log('Cerco Commessa:', headerId, 'Trovato?', !!element); // DEBUG

            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              this.flashElement(element);
            } else {
              console.warn('Elemento commessa non trovato nel DOM (forse accordion chiuso?)');
            }
          }, 800); // <--- AUMENTATO A 800ms
        }
      }
    }
  }

  flashElement(element: HTMLElement) {
    const animation = this.animationCtrl.create()
      .addElement(element)
      .duration(2000)
      .iterations(1)
      .keyframes([
        { offset: 0, '--background': 'rgba(var(--ion-color-warning-rgb), 0)' },
        { offset: 0.2, '--background': 'rgba(var(--ion-color-warning-rgb), 0.5)' },
        { offset: 1, '--background': 'rgba(var(--ion-color-warning-rgb), 0)' }
      ]);
    animation.play();
  }

  handleAddCommessa() {
    this.onAddCommessa.emit(this.indirizzo.id);
  }

  // --- SPOSTATA DAL FIGLIO ---
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
