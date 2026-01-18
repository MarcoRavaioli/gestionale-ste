import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { Commessa, Appuntamento } from '../../interfaces/models';
import { AppuntamentoService } from 'src/app/services/appuntamento.service';
import { NuovoAppuntamentoGlobaleModalComponent } from '../nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { addIcons } from 'ionicons';
import { calendarOutline, pencil, trash, add, timeOutline } from 'ionicons/icons';

// --- IMPORT DATE-FNS PER ITALIANO ---
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

@Component({
  selector: 'app-commessa-item',
  templateUrl: './commessa-item.component.html',
  styleUrls: ['./commessa-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class CommessaItemComponent implements OnChanges {
  @Input() commessa!: Commessa;
  @Input() hasManagerAccess: boolean = false;
  @Input() targetAppuntamentoId: number | null = null;
  @Output() refreshReq = new EventEmitter<void>();

  constructor(
    private el: ElementRef,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private appService: AppuntamentoService
  ) {
    addIcons({ calendarOutline, pencil, trash, add, timeOutline });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.targetAppuntamentoId && this.commessa.appuntamenti) {
      const found = this.commessa.appuntamenti.some(
        (a) => a.id == this.targetAppuntamentoId
      );
      if (found) {
        setTimeout(() => {
          const highlightedElement =
            this.el.nativeElement.querySelector('.highlight-item');
          if (highlightedElement) {
            highlightedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 600);
      }
    }
  }

  // --- FORMATTAZIONE DATE (Italiano) ---
  getGiorno(isoString: string): string {
    if (!isoString) return '-';
    return format(new Date(isoString), 'dd');
  }

  getMese(isoString: string): string {
    if (!isoString) return '-';
    // 'MMM' restituisce 'gen', 'feb'. Lo rendiamo maiuscolo nell'HTML.
    return format(new Date(isoString), 'MMM', { locale: it });
  }

  getAnno(isoString: string): string {
    if (!isoString) return '-';
    return format(new Date(isoString), 'yyyy');
  }

  getOra(isoString: string): string {
    if (!isoString) return '--:--';
    return format(new Date(isoString), 'HH:mm');
  }

  // --- AZIONI ---
  async nuovoAppuntamento() {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        commessaId: this.commessa.id,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) {
      this.refreshReq.emit();
    }
  }

  async modificaApp(app: Appuntamento) {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        appuntamento: app,
        commessaId: this.commessa.id,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) {
      this.refreshReq.emit();
    }
  }

  async eliminaApp(app: Appuntamento) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Appuntamento',
      message: 'Sei sicuro di voler eliminare questo appuntamento?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.appService.delete(app.id).subscribe(() => {
              this.refreshReq.emit();
            });
          },
        },
      ],
    });
    await alert.present();
  }
}