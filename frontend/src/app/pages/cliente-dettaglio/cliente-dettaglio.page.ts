import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, AlertController, NavController, IonicSafeString, AnimationController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

// Services & Models
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from 'src/app/services/indirizzo.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from '../../services/auth.service';
import { Cliente, Indirizzo, Commessa } from '../../interfaces/models';

// Modali
import { NuovoIndirizzoModalComponent } from '../../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';

// Componenti Figli
import { IndirizzoAccordionComponent } from '../../components/indirizzo-accordion/indirizzo-accordion.component';

import { addIcons } from 'ionicons';
import { mailOutline, callOutline, pencilOutline, closeOutline, saveOutline, trashOutline, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cliente-dettaglio',
  templateUrl: './cliente-dettaglio.page.html',
  styleUrls: ['./cliente-dettaglio.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, IndirizzoAccordionComponent] // <--- Importiamo il figlio
})
export class ClienteDettaglioPage implements OnInit {
  cliente: Cliente | null = null;
  isAdmin: boolean = false;
  isEditing: boolean = false;
  originalData: Partial<Cliente> = {};
  
  // Per l'accordion multiplo
  indirizziAperti: string[] = [];

  // VARIABILI PER IL DEEP LINKING
  targetCantiereId: number | null = null;
  targetCommessaId: number | null = null;
  targetAppuntamentoId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private indirizzoService: IndirizzoService,
    private commessaService: CommessaService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private animationCtrl: AnimationController
  ) {
    addIcons({ mailOutline, callOutline, pencilOutline, closeOutline, saveOutline, trashOutline, addCircleOutline });
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin;
    const id = this.route.snapshot.paramMap.get('id');

    // 1. LEGGIAMO I PARAMETRI DALL'URL
    this.route.queryParams.subscribe(params => {
      this.targetCantiereId = params['cantiereId'] ? +params['cantiereId'] : null;
      this.targetCommessaId = params['commessaId'] ? +params['commessaId'] : null;
      this.targetAppuntamentoId = params['appuntamentoId'] ? +params['appuntamentoId'] : null;
    });

    if (id) this.caricaDati(+id);
  }

  caricaDati(id: number) {
    this.clienteService.getOne(id).subscribe({
      next: (data) => {
        this.cliente = data;
        
        // Timeout aumentato a 600ms per garantire che la pagina sia renderizzata
        setTimeout(() => {
          if (this.targetCantiereId) {
            this.indirizziAperti = [this.targetCantiereId.toString()];
            
            const elementId = 'cantiere-header-' + this.targetCantiereId;
            const element = document.getElementById(elementId);
            
            console.log('Cerco Cantiere:', elementId, 'Trovato?', !!element); // DEBUG

            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Lampeggia solo se NON stiamo andando verso una commessa specifica
              if (!this.targetCommessaId) {
                this.flashElement(element);
              }
            }

          } else if (this.cliente?.indirizzi) {
            this.indirizziAperti = this.cliente.indirizzi.map((ind) => ind.id.toString());
          }
        }, 600); // <--- AUMENTATO A 600ms
      },
      error: (err) => console.error(err),
    });
  }

  flashElement(element: HTMLElement) {
    const animation = this.animationCtrl.create()
      .addElement(element)
      .duration(2000)
      .iterations(1)
      .keyframes([
        { offset: 0, '--background': 'rgba(var(--ion-color-warning-rgb), 0)' },
        { offset: 0.2, '--background': 'rgba(var(--ion-color-warning-rgb), 0.5)' }, // Flash Giallo
        { offset: 1, '--background': 'rgba(var(--ion-color-warning-rgb), 0)' }
      ]);
    animation.play();
  }

  // --- GESTIONE CLIENTE ---
  abilitaModifica() {
    if (!this.cliente) return;
    this.originalData = { ...this.cliente };
    this.isEditing = true;
  }

  annullaModifica() {
    if (!this.cliente) return;
    this.cliente.email = this.originalData.email;
    this.cliente.telefono = this.originalData.telefono;
    this.isEditing = false;
  }

  salvaModifica() {
    if (!this.cliente) return;
    this.clienteService.update(this.cliente.id, {
      email: this.cliente.email,
      telefono: this.cliente.telefono,
    }).subscribe({
      next: () => {
        this.isEditing = false;
        this.showToast('Contatti aggiornati!');
      },
      error: () => this.showToast('Errore salvataggio'),
    });
  }

  // --- GESTIONE INDIRIZZI (Azioni triggerate dal componente figlio) ---
  
  async apriModalIndirizzo(esistente?: Indirizzo) {
    const modal = await this.modalCtrl.create({
      component: NuovoIndirizzoModalComponent,
      componentProps: {
        clienteId: this.cliente?.id,
        indirizzoEsistente: esistente,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati(this.cliente!.id);
  }

  async eliminaIndirizzo(indirizzo: Indirizzo) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Cantiere',
      message: new IonicSafeString(`Vuoi eliminare <strong>${indirizzo.via}</strong>?<br>Spariranno anche le commesse.`),
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina', role: 'destructive',
          handler: () => {
            this.indirizzoService.delete(indirizzo.id).subscribe({
              next: () => { this.showToast('Cantiere eliminato'); this.caricaDati(this.cliente!.id); },
              error: () => this.showToast('Errore eliminazione'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  // --- GESTIONE COMMESSE (Azioni triggerate dal componente figlio) ---

  async apriModalCommessa(indirizzoId: number, esistente?: Commessa) {
    const modal = await this.modalCtrl.create({
      component: NuovaCommessaModalComponent,
      componentProps: {
        indirizzoId: indirizzoId,
        commessaEsistente: esistente,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati(this.cliente!.id);
  }

  async eliminaCommessa(commessa: Commessa) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Commessa',
      message: new IonicSafeString(`Vuoi eliminare la commessa <strong>${commessa.seriale}</strong>?`),
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina', role: 'destructive',
          handler: () => {
            this.commessaService.delete(commessa.id).subscribe({
              next: () => { this.showToast('Commessa eliminata'); this.caricaDati(this.cliente!.id); },
              error: () => this.showToast('Errore eliminazione'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  // --- CANCELLAZIONE CLIENTE ---
  async chiediConfermaCancellazione() {
    if (!this.cliente) return;
    const alert = await this.alertCtrl.create({
      header: 'Attenzione!',
      subHeader: 'Cancellazione Irreversibile',
      message: new IonicSafeString(`Stai per eliminare <strong>${this.cliente.nome}</strong>.<br>Verrà cancellato tutto. Sei sicuro?`),
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'ELIMINA TUTTO', role: 'destructive',
          handler: () => {
            this.clienteService.delete(this.cliente!.id).subscribe({
              next: () => { this.showToast('Cliente eliminato'); this.navCtrl.navigateBack('/tabs/tab3'); },
              error: () => this.showToast('Errore cancellazione'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async showToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
    t.present();
  }
}