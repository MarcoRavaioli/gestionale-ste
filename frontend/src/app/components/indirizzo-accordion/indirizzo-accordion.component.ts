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
import { AnimationController, IonicModule, ToastController } from '@ionic/angular';
import { Indirizzo, Commessa, Allegato } from '../../interfaces/models';
import { CommessaItemComponent } from '../commessa-item/commessa-item.component';
import { addIcons } from 'ionicons';
import {
  add,
  locationOutline,
  pencilOutline,
  trashOutline,
  calendarOutline,
  close,
} from 'ionicons/icons';
import { ActionSheetController } from '@ionic/angular/standalone';
import { AllegatoService } from 'src/app/services/allegato.service';

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

  constructor(
    private el: ElementRef,
    private animationCtrl: AnimationController,
    private actionSheetCtrl: ActionSheetController,
    private allegatoService: AllegatoService,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      add,
      locationOutline,
      pencilOutline,
      trashOutline,
      calendarOutline,
      close,
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
      const found = this.indirizzo.commesse.find(
        (c) => c.id == this.targetCommessaId,
      );

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

  async mostraAllegati(ev: Event, commessa: Commessa) {
    ev.stopPropagation(); // Evita che l'accordion si espanda/chiuda

    if (!commessa.allegati || commessa.allegati.length === 0) return;

    // Se c'è solo un file, scaricalo subito
    if (commessa.allegati.length === 1) {
      this.scaricaFile(commessa.allegati[0]);
      return;
    }

    // Altrimenti mostra menu di scelta
    const buttons = commessa.allegati.map(file => ({
      text: file.nome_file,
      icon: 'document-text-outline',
      handler: () => {
        this.scaricaFile(file);
      }
    }));

    buttons.push({
      text: 'Annulla',
      icon: 'close',
      role: 'cancel'
    } as any);

    const actionSheet = await this.actionSheetCtrl.create({
      header: `Allegati (${commessa.allegati.length})`,
      buttons: buttons
    });

    await actionSheet.present();
  }

  scaricaFile(file: Allegato) {
    this.allegatoService.download(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.nome_file;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.mostraToast('Errore durante il download')
    });
  }

  async mostraToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000, color: 'danger' });
    t.present();
  }
}
