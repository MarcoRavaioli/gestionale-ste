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
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Commessa, Appuntamento, Allegato } from '../../interfaces/models';
import { AppuntamentoService } from 'src/app/services/appuntamento.service';
import { AllegatoService } from 'src/app/services/allegato.service'; // <--- NUOVO
import { NuovoAppuntamentoGlobaleModalComponent } from '../nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, pencil, trash, add, timeOutline, 
  attachOutline, documentTextOutline, cloudDownloadOutline // <--- ICONE NUOVE
} from 'ionicons/icons';

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
    private toastCtrl: ToastController,
    private appService: AppuntamentoService,
    private allegatoService: AllegatoService // <--- Inject
  ) {
    addIcons({ 
      calendarOutline, pencil, trash, add, timeOutline, 
      attachOutline, documentTextOutline, cloudDownloadOutline 
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // ... logica esistente ...
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

  // ... Metodi data (getGiorno, ecc) esistenti ...
  getGiorno(isoString: string): string {
    if (!isoString) return '-';
    return format(new Date(isoString), 'dd');
  }

  getMese(isoString: string): string {
    if (!isoString) return '-';
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

  // --- AZIONI ESISTENTI (nuovoAppuntamento, modificaApp, eliminaApp) ---
  async nuovoAppuntamento() {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: { commessaId: this.commessa.id },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) { this.refreshReq.emit(); }
  }

  async modificaApp(app: Appuntamento) {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: { appuntamento: app, commessaId: this.commessa.id },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) { this.refreshReq.emit(); }
  }

  async eliminaApp(app: Appuntamento) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Appuntamento',
      message: 'Sei sicuro di voler eliminare questo appuntamento?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina', role: 'destructive',
          handler: () => {
            this.appService.delete(app.id).subscribe(() => { this.refreshReq.emit(); });
          },
        },
      ],
    });
    await alert.present();
  }

  // --- NUOVI METODI ALLEGATI ---
  scaricaAllegato(file: Allegato) {
    this.allegatoService.download(file.id).subscribe({
      next: (blob) => {
        // Crea un URL temporaneo per il blob e simula il click
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.nome_file; // Nome file originale
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Err download', err)
    });
  }

  async eliminaAllegato(file: Allegato) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Allegato',
      message: `Vuoi eliminare il file ${file.nome_file}?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina', role: 'destructive',
          handler: () => {
            this.allegatoService.delete(file.id).subscribe({
              next: () => { 
                this.mostraToast('File eliminato');
                this.refreshReq.emit(); 
              },
              error: () => this.mostraToast('Errore eliminazione')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async mostraToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
    t.present();
  }
}