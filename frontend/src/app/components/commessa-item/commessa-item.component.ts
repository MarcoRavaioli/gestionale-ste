import { Component, Input, Output, EventEmitter, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { Commessa, Appuntamento } from '../../interfaces/models'; // Assicurati di importare Appuntamento
import { AppuntamentoService } from 'src/app/services/appuntamento.service'; // Importa il service
import { NuovoAppuntamentoGlobaleModalComponent } from '../nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component'; // Importa il modale di modifica
import { addIcons } from 'ionicons';
import { calendarOutline, pencil, trash } from 'ionicons/icons'; // Aggiungi pencil e trash

@Component({
  selector: 'app-commessa-item',
  templateUrl: './commessa-item.component.html',
  styleUrls: ['./commessa-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class CommessaItemComponent implements OnChanges {
  @Input() commessa!: Commessa;
  @Input() isAdmin: boolean = false;
  @Input() targetAppuntamentoId: number | null = null;
  
  // Evento per dire al padre di ricaricare i dati
  @Output() refreshReq = new EventEmitter<void>();

  constructor(
    private el: ElementRef,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private appService: AppuntamentoService
  ) {
    addIcons({ calendarOutline, pencil, trash });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.targetAppuntamentoId && this.commessa.appuntamenti) {
      const found = this.commessa.appuntamenti.some(a => a.id == this.targetAppuntamentoId);
      
      if (found) {
        setTimeout(() => {
          const highlightedElement = this.el.nativeElement.querySelector('.highlight-item');
          if (highlightedElement) {
            highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 600);
      }
    }
  }

  // --- LOGICA MODIFICA ---
  async modificaApp(app: Appuntamento) {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: { 
        appuntamento: app, // Passiamo l'appuntamento esistente per la modifica
        commessaId: this.commessa.id // Manteniamo il riferimento alla commessa
      }
    });
    
    await modal.present();
    
    const { data } = await modal.onWillDismiss();
    if (data && data.creato) { // O 'aggiornato', dipende da come gestisci il ritorno nel modale
      this.refreshReq.emit(); // Chiediamo al padre di ricaricare
    }
  }

  // --- LOGICA ELIMINAZIONE ---
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
              this.refreshReq.emit(); // Ricarichiamo i dati dopo l'eliminazione
            });
          }
        }
      ]
    });
    await alert.present();
  }
}