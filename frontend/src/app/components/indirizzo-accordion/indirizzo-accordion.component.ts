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
  @Input() hasManagerAccess: boolean = false;

  @Input() targetCommessaId: number | null = null;
  @Input() targetAppuntamentoId: number | null = null;

  @Output() onAddCommessa = new EventEmitter<number>();
  @Output() onEditCommessa = new EventEmitter<Commessa>();
  @Output() onDeleteCommessa = new EventEmitter<Commessa>();
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

  isCommessaAperta(id: number): boolean {
    const idStr = 'commessa-' + id;
    if (!this.commesseAperte) return false;
    
    if (Array.isArray(this.commesseAperte)) {
      return this.commesseAperte.includes(idStr);
    } else {
      return this.commesseAperte === idStr;
    }
  }

  accordionChange(ev: any) {
    this.commesseAperte = ev.detail.value;
  }

  apriCommessaTarget() {
    if (this.targetCommessaId && this.indirizzo?.commesse) {
      const found = this.indirizzo.commesse.find(c => c.id == this.targetCommessaId);
      
      if (found) {
        // Apri l'accordion
        this.commesseAperte = ['commessa-' + this.targetCommessaId];

        // Se dobbiamo fermarci qui (no appuntamento target), scrolliamo ed evidenziamo
        if (!this.targetAppuntamentoId) {
          // Aspettiamo che l'accordion genitore (cantiere) si apra completamente
          setTimeout(() => {
            this.trovaEScorriCommessa(this.targetCommessaId!);
          }, 600);
        }
      }
    }
  }

  trovaEScorriCommessa(id: number, attempts = 0) {
    if (attempts > 20) return;

    const headerId = 'commessa-header-' + id;
    const element = document.getElementById(headerId); 
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.flashElement(element);
    } else {
      setTimeout(() => this.trovaEScorriCommessa(id, attempts + 1), 100);
    }
  }

  flashElement(element: HTMLElement) {
    // Usiamo una classe CSS per l'animazione per evitare conflitti JS
    element.classList.remove('flash-highlight-target');
    void element.offsetWidth; // Force reflow
    element.classList.add('flash-highlight-target');
    
    setTimeout(() => {
      element.classList.remove('flash-highlight-target');
    }, 3000);
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