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
} from 'ionicons/icons'; 

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
  
  // NUOVO: Evento per propagare la richiesta di refresh al padre (ClienteDettaglioPage)
  @Output() onRefresh = new EventEmitter<void>();

  commesseAperte: string[] = [];

  constructor(private el: ElementRef, private animationCtrl: AnimationController) {
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
      const found = this.indirizzo.commesse.find(c => c.id == this.targetCommessaId);
      
      if (found) {
        this.commesseAperte = ['commessa-' + this.targetCommessaId];

        if (!this.targetAppuntamentoId) {
          setTimeout(() => {
            const headerId = 'commessa-header-' + this.targetCommessaId;
            const element = document.getElementById(headerId); 
            
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              this.flashElement(element);
            }
          }, 800);
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

  getColoreStato(stato: string): string {
    switch (stato) {
      case 'APERTA': return 'success';
      case 'IN_CORSO': return 'warning';
      case 'CHIUSA': return 'medium';
      default: return 'primary';
    }
  }
}