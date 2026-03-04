import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ModalController, ToastController, AlertController, NavController,
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonContent, IonInput, IonSearchbar,
  IonAccordionGroup, IonAccordion, IonItem, IonBadge, IonSegment, IonSegmentButton, IonLabel
} from '@ionic/angular/standalone';

import { IonicSafeString, ViewDidEnter } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from 'src/app/services/indirizzo.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from '../../services/auth.service';
import { Cliente, Indirizzo, Commessa, Appuntamento } from '../../interfaces/models';

import { NuovoIndirizzoModalComponent } from '../../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';
import { IndirizzoAccordionComponent } from '../../components/indirizzo-accordion/indirizzo-accordion.component';

// Nuovo: Importa il componente per mostrare il contenuto della commessa orfana (lo stesso usato nell'accordion)
import { CommessaItemComponent } from '../../components/commessa-item/commessa-item.component'; 

import { addIcons } from 'ionicons';
import {
  mailOutline, callOutline, pencilOutline, closeOutline, saveOutline,
  trashOutline, addCircleOutline, searchOutline, locationOutline,
  businessOutline, calendarOutline, location, personOutline, documentsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-dettaglio',
  templateUrl: './cliente-dettaglio.page.html',
  styleUrls: ['./cliente-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IndirizzoAccordionComponent, CommessaItemComponent,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonButton, IonIcon, IonContent, IonInput, IonSearchbar,
    IonAccordionGroup, IonAccordion, IonItem, IonBadge, IonSegment, IonSegmentButton, IonLabel
  ],
})
export class ClienteDettaglioPage implements OnInit, ViewDidEnter {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  cliente: Cliente | null = null;
  hasManagerAccess: boolean = false;
  isEditing: boolean = false;
  originalData: Partial<Cliente> = {};

  // NUOVA GESTIONE A SCHEDE
  currentTab: 'cantieri' | 'commesse' | 'appuntamenti' = 'cantieri';

  searchTerm: string = '';
  indirizziVisualizzati: Indirizzo[] = [];
  indirizziAperti: string[] = [];

  // Nuove liste per gli elementi orfani
  commesseDirette: Commessa[] = [];
  appuntamentiDiretti: Appuntamento[] = [];
  commesseDiretteAperte: string[] = []; // Per l'accordion

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
      businessOutline, calendarOutline, location, personOutline, documentsOutline
    });
  }

  ngOnInit() {
    this.hasManagerAccess = this.authService.hasManagerAccess();
    this.deepLinkGestito = false;

    const idParam = this.route.snapshot.paramMap.get('id');
    const clienteId = parseInt(idParam || '', 10);

    if (isNaN(clienteId) || !clienteId) {
      this.toastCtrl.create({ message: 'Nessun cliente associato.', duration: 2500, color: 'warning' }).then(t => t.present());
      this.navCtrl.navigateRoot('/tabs/tab3');
      return;
    }

    this.route.queryParams.subscribe((params) => {
      this.targetCantiereId = params['cantiereId'] ? +params['cantiereId'] : null;
      this.targetCommessaId = params['commessaId'] ? +params['commessaId'] : null;
      this.targetAppuntamentoId = params['appuntamentoId'] ? +params['appuntamentoId'] : null;
      
      // LOGICA TABS INTELLIGENTE
      if (this.targetCommessaId && !this.targetCantiereId) {
        this.currentTab = 'commesse';
      } else if (this.targetAppuntamentoId && !this.targetCantiereId && !this.targetCommessaId) {
        this.currentTab = 'appuntamenti';
      }

      this.deepLinkGestito = false;
      if (this.cliente) setTimeout(() => this.gestisciDeepLink(), 100);
    });

    this.caricaDati(clienteId);
  }

  ionViewDidEnter() {
    if (this.cliente) this.gestisciDeepLink();
  }

  caricaDati(id: number) {
    this.clienteService.getOne(id).subscribe({
      next: (data) => {
        this.cliente = data;
        
        // Popoliamo le liste orfane grazie al Backend aggiornato in Fase 2!
        this.commesseDirette = this.cliente.commesse || [];
        this.appuntamentiDiretti = this.cliente.appuntamenti || [];

        this.ordinaCantieriPerAttivita();
        this.filtraCantieri();
        this.cd.detectChanges(); 
        setTimeout(() => this.gestisciDeepLink(), 300);
      },
      error: (err) => console.error(err),
    });
  }

  // Il resto dei metodi di gestione DeepLink, Cantiere e Modifica restano identici
  gestisciDeepLink() {
    if (this.deepLinkGestito) return;

    if (this.targetCantiereId && this.currentTab === 'cantieri') {
      const visible = this.indirizziVisualizzati.find(i => i.id === this.targetCantiereId);
      if (!visible) { this.searchTerm = ''; this.filtraCantieri(); this.cd.detectChanges(); }
      this.indirizziAperti = [this.targetCantiereId.toString()];
      this.cd.detectChanges();
      this.trovaEScorri(this.targetCantiereId, 0, 'cantiere-header-');
    } 
    else if (this.targetCommessaId && this.currentTab === 'commesse') {
      this.commesseDiretteAperte = [this.targetCommessaId.toString()];
      this.cd.detectChanges();
      this.trovaEScorri(this.targetCommessaId, 0, 'commessa-diretta-header-');
    }

    this.deepLinkGestito = true;
  }

  private trovaEScorri(id: number, attempts: number, prefix: string) {
    if (attempts > 30) return;
    const element = document.getElementById(prefix + id);
    if (element) {
      this.scrollaAElemento(element);
      this.flashElementCss(element);
    } else {
      setTimeout(() => this.trovaEScorri(id, attempts + 1, prefix), 100);
    }
  }

  private scrollaAElemento(element: HTMLElement) {
    if (!this.content) return;
    const y = element.getBoundingClientRect().top + window.scrollY;
    this.content.scrollToPoint(0, y - 100, 600);
  }

  flashElementCss(element: HTMLElement) {
    element.classList.remove('flash-highlight-target');
    void element.offsetWidth; 
    element.classList.add('flash-highlight-target');
    setTimeout(() => element.classList.remove('flash-highlight-target'), 3000);
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
    if (!term) { this.indirizziVisualizzati = [...this.cliente.indirizzi]; return; }
    this.indirizziVisualizzati = this.cliente.indirizzi.filter((ind) => {
      if (ind.via.toLowerCase().includes(term) || ind.citta.toLowerCase().includes(term)) return true;
      if (ind.commesse?.some((c) => c.seriale.toLowerCase().includes(term) || c.descrizione?.toLowerCase().includes(term))) return true;
      if (ind.commesse?.some((c) => c.appuntamenti?.some((a) => a.nome.toLowerCase().includes(term) || a.descrizione?.toLowerCase().includes(term)))) return true;
      return false;
    });
  }

  abilitaModifica() { this.originalData = { ...this.cliente! }; this.isEditing = true; }
  annullaModifica() { this.cliente!.nome = this.originalData.nome!; this.cliente!.email = this.originalData.email; this.cliente!.telefono = this.originalData.telefono; this.isEditing = false; }
  
  salvaModifica() {
    this.clienteService.update(this.cliente!.id, { nome: this.cliente!.nome, email: this.cliente!.email, telefono: this.cliente!.telefono })
      .subscribe({ next: () => { this.isEditing = false; this.showToast('Contatti aggiornati!'); }, error: () => this.showToast('Errore salvataggio') });
  }

  async apriModalIndirizzo(esistente?: Indirizzo) {
    const modal = await this.modalCtrl.create({ component: NuovoIndirizzoModalComponent, componentProps: { clienteId: this.cliente?.id, indirizzoEsistente: esistente } });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati(this.cliente!.id);
  }

  async eliminaIndirizzo(indirizzo: Indirizzo) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Cantiere', message: new IonicSafeString(`Vuoi eliminare <strong>${indirizzo.via}</strong>?`),
      buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'Elimina', role: 'destructive', handler: () => { this.indirizzoService.delete(indirizzo.id).subscribe({ next: () => { this.showToast('Cantiere eliminato'); this.caricaDati(this.cliente!.id); } }); } }]
    });
    await alert.present();
  }

  isCantiereAperto(id: number): boolean { return Array.isArray(this.indirizziAperti) ? this.indirizziAperti.includes(id.toString()) : this.indirizziAperti === id.toString(); }
  accordionChange(ev: any) { this.indirizziAperti = ev.detail.value; }
  
  // Per accordions orfani
  isCommessaDirettaAperta(id: number): boolean { return Array.isArray(this.commesseDiretteAperte) ? this.commesseDiretteAperte.includes(id.toString()) : this.commesseDiretteAperte === id.toString(); }
  accordionCommessaChange(ev: any) { this.commesseDiretteAperte = ev.detail.value; }

  async apriModalCommessa(indirizzoId: number | null, esistente?: Commessa) {
    const modal = await this.modalCtrl.create({ component: NuovaCommessaModalComponent, componentProps: { indirizzoId: indirizzoId, commessaEsistente: esistente } });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati(this.cliente!.id);
  }

  async eliminaCommessa(commessa: Commessa) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Commessa', message: new IonicSafeString(`Vuoi eliminare <strong>${commessa.seriale}</strong>?`),
      buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'Elimina', role: 'destructive', handler: () => { this.commessaService.delete(commessa.id).subscribe({ next: () => { this.showToast('Commessa eliminata'); this.caricaDati(this.cliente!.id); } }); } }]
    });
    await alert.present();
  }

  async chiediConfermaCancellazione() {
    const alert = await this.alertCtrl.create({
      header: 'Attenzione!', subHeader: 'Cancellazione Irreversibile', message: new IonicSafeString(`Stai per eliminare <strong>${this.cliente!.nome}</strong>.<br>Verrà cancellato tutto. Sei sicuro?`),
      buttons: [{ text: 'Annulla', role: 'cancel' }, { text: 'ELIMINA TUTTO', role: 'destructive', handler: () => { this.clienteService.delete(this.cliente!.id).subscribe({ next: () => { this.showToast('Cliente eliminato'); this.navCtrl.navigateBack('/tabs/tab3'); } }); } }]
    });
    await alert.present();
  }

  async showToast(msg: string) { const t = await this.toastCtrl.create({ message: msg, duration: 2000 }); t.present(); }
}