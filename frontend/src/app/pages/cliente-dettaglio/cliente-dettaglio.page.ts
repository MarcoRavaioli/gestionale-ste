import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  ModalController,
  ToastController,
  AlertController,
  NavController,
  IonicSafeString,
  ViewDidEnter,
  IonContent,
} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

// Services & Models
import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from 'src/app/services/indirizzo.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from '../../services/auth.service';
import {
  Cliente,
  Indirizzo,
  Commessa,
} from '../../interfaces/models';

// Modali
import { NuovoIndirizzoModalComponent } from '../../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';

// Componenti Figli
import { IndirizzoAccordionComponent } from '../../components/indirizzo-accordion/indirizzo-accordion.component';

import { addIcons } from 'ionicons';
import {
  mailOutline,
  callOutline,
  pencilOutline,
  closeOutline,
  saveOutline,
  trashOutline,
  addCircleOutline,
  searchOutline,
  locationOutline,
  businessOutline,
  calendarOutline,
  location,
  personOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-dettaglio',
  templateUrl: './cliente-dettaglio.page.html',
  styleUrls: ['./cliente-dettaglio.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    IndirizzoAccordionComponent,
  ],
})
export class ClienteDettaglioPage implements OnInit, ViewDidEnter {
  // FIX 1: Aggiunto '!' per dire a TS che Angular lo inizializzerà
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  cliente: Cliente | null = null;
  hasManagerAccess: boolean = false;
  isEditing: boolean = false;
  originalData: Partial<Cliente> = {};

  searchTerm: string = '';
  indirizziVisualizzati: Indirizzo[] = [];
  indirizziAperti: string[] = [];

  targetCantiereId: number | null = null;
  targetCommessaId: number | null = null;
  targetAppuntamentoId: number | null = null;

  private deepLinkGestito = false;

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
    private cd: ChangeDetectorRef
  ) {
    addIcons({
      mailOutline, callOutline, pencilOutline, closeOutline, saveOutline,
      trashOutline, addCircleOutline, searchOutline, locationOutline,
      businessOutline, calendarOutline, location, personOutline,
    });
  }

  ngOnInit() {
    this.hasManagerAccess = this.authService.hasManagerAccess();
    this.deepLinkGestito = false;

    const id = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe((params) => {
      this.targetCantiereId = params['cantiereId'] ? +params['cantiereId'] : null;
      this.targetCommessaId = params['commessaId'] ? +params['commessaId'] : null;
      this.targetAppuntamentoId = params['appuntamentoId'] ? +params['appuntamentoId'] : null;
      
      this.deepLinkGestito = false;
      
      if (this.cliente) {
        setTimeout(() => this.gestisciDeepLink(), 100);
      }
    });

    if (id) this.caricaDati(+id);
  }

  ionViewDidEnter() {
    if (this.cliente) {
      this.gestisciDeepLink();
    }
  }

  caricaDati(id: number) {
    this.clienteService.getOne(id).subscribe({
      next: (data) => {
        this.cliente = data;
        this.ordinaCantieriPerAttivita();
        this.filtraCantieri();
        
        this.cd.detectChanges(); 

        setTimeout(() => {
          this.gestisciDeepLink();
        }, 300);
      },
      error: (err) => console.error(err),
    });
  }

  gestisciDeepLink() {
    if (!this.targetCantiereId || this.deepLinkGestito) return;

    const visible = this.indirizziVisualizzati.find(i => i.id === this.targetCantiereId);
    if (!visible) {
      this.searchTerm = '';
      this.filtraCantieri();
      this.cd.detectChanges();
    }

    // Apriamo l'accordion
    this.indirizziAperti = [this.targetCantiereId.toString()];
    this.cd.detectChanges();

    // Avviamo la ricerca e scroll
    this.trovaEScorri(this.targetCantiereId, 0);
    
    this.deepLinkGestito = true;
  }

  private trovaEScorri(id: number, attempts: number) {
    if (attempts > 30) return; // Timeout ~3s

    const elementId = 'cantiere-header-' + id;
    const element = document.getElementById(elementId);

    if (element) {
      this.scrollaAElemento(element);

      if (!this.targetCommessaId) {
        this.flashElementCss(element);
      }
    } else {
      setTimeout(() => this.trovaEScorri(id, attempts + 1), 100);
    }
  }

  private scrollaAElemento(element: HTMLElement) {
    if (!this.content) return;

    const y = element.getBoundingClientRect().top + window.scrollY;
    const offset = y - 100;

    this.content.scrollToPoint(0, offset, 600);
  }

  flashElementCss(element: HTMLElement) {
    element.classList.remove('flash-highlight-target');
    void element.offsetWidth; 
    element.classList.add('flash-highlight-target');
    setTimeout(() => {
      element.classList.remove('flash-highlight-target');
    }, 3000);
  }

  ordinaCantieriPerAttivita() {
    if (!this.cliente?.indirizzi) return;
    this.cliente.indirizzi.sort((a, b) => {
      const dataA = this.getUltimaDataIndirizzo(a);
      const dataB = this.getUltimaDataIndirizzo(b);
      return dataB.getTime() - dataA.getTime();
    });
  }

  getUltimaDataIndirizzo(ind: Indirizzo): Date {
    let maxDate = new Date(0);
    if (ind.commesse) {
      for (const com of ind.commesse) {
        if (com.appuntamenti) {
          for (const app of com.appuntamenti) {
            const d = new Date(app.data_ora);
            if (d > maxDate) maxDate = d;
          }
        }
      }
    }
    return maxDate;
  }

  filtraCantieri() {
    if (!this.cliente?.indirizzi) return;
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.indirizziVisualizzati = [...this.cliente.indirizzi];
      return;
    }
    this.indirizziVisualizzati = this.cliente.indirizzi.filter((ind) => {
      if (ind.via.toLowerCase().includes(term) || ind.citta.toLowerCase().includes(term)) return true;
      if (ind.commesse?.some((c) => c.seriale.toLowerCase().includes(term) || c.descrizione?.toLowerCase().includes(term))) return true;
      if (ind.commesse?.some((c) => c.appuntamenti?.some((a) => a.nome.toLowerCase().includes(term) || a.descrizione?.toLowerCase().includes(term)))) return true;
      return false;
    });
  }

  abilitaModifica() {
    if (!this.cliente) return;
    this.originalData = { ...this.cliente };
    this.isEditing = true;
  }

  annullaModifica() {
    if (!this.cliente) return;
    this.cliente.nome = this.originalData.nome!;
    this.cliente.email = this.originalData.email;
    this.cliente.telefono = this.originalData.telefono;
    this.isEditing = false;
  }

  salvaModifica() {
    if (!this.cliente) return;
    this.clienteService.update(this.cliente.id, {
      nome: this.cliente.nome,
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
      message: new IonicSafeString(`Vuoi eliminare <strong>${indirizzo.via}</strong>?<br>Spariranno anche le commesse e appuntamenti collegati.`),
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

  isCantiereAperto(id: number): boolean {
    if (!this.indirizziAperti) return false;
    const idStr = id.toString();
    if (Array.isArray(this.indirizziAperti)) {
      return this.indirizziAperti.includes(idStr);
    } else {
      return this.indirizziAperti === idStr;
    }
  }

  accordionChange(ev: any) {
    this.indirizziAperti = ev.detail.value;
  }

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
              next: () => { 
                this.showToast('Commessa eliminata'); 
                this.caricaDati(this.cliente!.id); 
              },
              error: () => this.showToast('Errore eliminazione'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

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
          // FIX 2: Pulito sintassi 'handler' qui sotto
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