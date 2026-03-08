import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ModalController,
  ToastController,
  AlertController,
  NavController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonInput,
  IonSearchbar,
  IonList,
  IonItem,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';

import { IonicSafeString, ViewDidEnter } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

import { ClienteService } from '../../services/cliente.service';
import { IndirizzoService } from 'src/app/services/indirizzo.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { AuthService } from '../../services/auth.service';
import {
  Cliente,
  Indirizzo,
  Commessa,
  Appuntamento,
} from '../../interfaces/models';

import { NuovoIndirizzoModalComponent } from '../../components/nuovo-indirizzo-modal/nuovo-indirizzo-modal.component';
import { NuovaCommessaModalComponent } from '../../components/nuova-commessa-modal/nuova-commessa-modal.component';
import { NuovoAppuntamentoGlobaleModalComponent } from '../../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component';

// Per il rendering pulito delle card
import { CommessaItemComponent } from '../../components/commessa-item/commessa-item.component';

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
  documentsOutline,
  calendar,
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-dettaglio',
  templateUrl: './cliente-dettaglio.page.html',
  styleUrls: ['./cliente-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommessaItemComponent, // Riutilizzo per stilizzare le commesse in lista!
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonSearchbar,
    IonList,
    IonItem,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class ClienteDettaglioPage implements OnInit, ViewDidEnter {
  clienteId = signal<number | null>(null);
  cliente = signal<Cliente | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  originalData: Partial<Cliente> = {};

  // TAB STATE
  currentTab = signal<'cantieri' | 'commesse' | 'appuntamenti'>('cantieri');
  searchTerm = signal<string>('');

  // DATA
  indirizzi = signal<Indirizzo[]>([]);
  commesseDirette = signal<Commessa[]>([]);
  appuntamentiDiretti = signal<Appuntamento[]>([]);

  // COMPUTED (Filtered Data)
  indirizziFiltrati = computed(() => {
    const list = this.indirizzi();
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return list;

    return list.filter((ind) => {
      if (
        ind.via.toLowerCase().includes(term) ||
        ind.citta.toLowerCase().includes(term)
      )
        return true;
      if (
        ind.commesse?.some(
          (c) =>
            c.seriale.toLowerCase().includes(term) ||
            c.descrizione?.toLowerCase().includes(term),
        )
      )
        return true;
      if (
        ind.commesse?.some((c) =>
          c.appuntamenti?.some(
            (a) =>
              a.nome.toLowerCase().includes(term) ||
              a.descrizione?.toLowerCase().includes(term),
          ),
        )
      )
        return true;
      return false;
    });
  });

  // TARGETS FOR DEEP LINKING
  targetCantiereId = signal<number | null>(null);
  targetCommessaId = signal<number | null>(null);
  targetAppuntamentoId = signal<number | null>(null);
  deepLinkGestito = false;

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
  ) {
    addIcons({
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
      documentsOutline,
      calendar,
    });
  }

  ngOnInit() {
    this.hasManagerAccess.set(this.authService.hasManagerAccess());

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = parseInt(idParam || '', 10);

    if (isNaN(id) || !id) {
      this.toastCtrl
        .create({
          message: 'Nessun cliente associato.',
          duration: 2500,
          color: 'warning',
        })
        .then((t) => t.present());
      this.navCtrl.navigateRoot('/tabs/tab3');
      return;
    }

    this.clienteId.set(id);

    this.route.queryParams.subscribe((params) => {
      this.targetCantiereId.set(
        params['cantiereId'] ? +params['cantiereId'] : null,
      );
      this.targetCommessaId.set(
        params['commessaId'] ? +params['commessaId'] : null,
      );
      this.targetAppuntamentoId.set(
        params['appuntamentoId'] ? +params['appuntamentoId'] : null,
      );

      if (this.targetCommessaId() && !this.targetCantiereId()) {
        this.currentTab.set('commesse');
      } else if (
        this.targetAppuntamentoId() &&
        !this.targetCantiereId() &&
        !this.targetCommessaId()
      ) {
        this.currentTab.set('appuntamenti');
      }

      this.deepLinkGestito = false;
      if (this.cliente()) setTimeout(() => this.gestisciDeepLink(), 100);
    });

    this.caricaDati();
  }

  ionViewDidEnter() {
    if (this.cliente()) this.gestisciDeepLink();
  }

  caricaDati() {
    const id = this.clienteId();
    if (!id) return;

    this.clienteService.getOne(id).subscribe({
      next: (data) => {
        this.cliente.set(data);

        let inds = data.indirizzi || [];
        inds.sort(
          (a, b) =>
            this.getUltimaDataIndirizzo(b).getTime() -
            this.getUltimaDataIndirizzo(a).getTime(),
        );
        this.indirizzi.set(inds);

        this.commesseDirette.set(data.commesse || []);
        this.appuntamentiDiretti.set(data.appuntamenti || []);

        setTimeout(() => this.gestisciDeepLink(), 300);
      },
      error: (err) => console.error(err),
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

  gestisciDeepLink() {
    if (this.deepLinkGestito) return;
    const cid = this.targetCantiereId();
    const comid = this.targetCommessaId();
    const tab = this.currentTab();

    if (cid && tab === 'cantieri') {
      const visible = this.indirizziFiltrati().find((i) => i.id === cid);
      if (!visible) this.searchTerm.set('');
      this.trovaEScorri(cid, 0, 'cantiere-card-');
    } else if (comid && tab === 'commesse') {
      this.trovaEScorri(comid, 0, 'commessa-card-');
    }

    this.deepLinkGestito = true;
  }

  private trovaEScorri(id: number, attempts: number, prefix: string) {
    if (attempts > 15) return;
    const element = document.getElementById(prefix + id);
    if (element) {
      const cnt = document.querySelector('ion-content');
      if (cnt) {
        const y = element.getBoundingClientRect().top + window.scrollY;
        // Ignoring exact TS for custom element method since scrollToPoint exists on ion-content
        (cnt as any).scrollToPoint(0, y - 100, 600);
      }
      element.classList.remove('flash-highlight-target');
      void element.offsetWidth;
      element.classList.add('flash-highlight-target');
      setTimeout(
        () => element.classList.remove('flash-highlight-target'),
        3000,
      );
    } else {
      setTimeout(() => this.trovaEScorri(id, attempts + 1, prefix), 100);
    }
  }

  abilitaModifica() {
    this.originalData = { ...this.cliente()! };
    this.isEditing.set(true);
  }

  annullaModifica() {
    const c = this.cliente()!;
    c.nome = this.originalData.nome!;
    c.email = this.originalData.email;
    c.telefono = this.originalData.telefono;
    this.cliente.set(c);
    this.isEditing.set(false);
  }

  salvaModifica() {
    const c = this.cliente()!;
    this.clienteService
      .update(c.id, {
        nome: c.nome,
        email: c.email,
        telefono: c.telefono,
      })
      .subscribe({
        next: () => {
          this.isEditing.set(false);
          this.showToast('Contatti aggiornati!');
        },
        error: () => this.showToast('Errore salvataggio'),
      });
  }

  onTabChange(ev: any) {
    this.currentTab.set(ev.detail.value);
  }

  onSearchChange(ev: any) {
    this.searchTerm.set(ev.detail.value);
  }

  // --- MODALI ESPANSIONE ---

  apriCantiere(id: number) {
    this.navCtrl.navigateForward(['/cantiere-dettaglio', id]);
  }

  async apriModalIndirizzo(esistente?: Indirizzo) {
    const modal = await this.modalCtrl.create({
      component: NuovoIndirizzoModalComponent,
      componentProps: {
        clienteId: this.clienteId(),
        indirizzoEsistente: esistente,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati();
  }

  async eliminaIndirizzo(indirizzo: Indirizzo) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Cantiere',
      message: new IonicSafeString(
        `Vuoi eliminare <strong>${indirizzo.via}</strong>?`,
      ),
      inputs: [
        {
          name: 'cascade',
          type: 'checkbox',
          label: 'Elimina anche tutte le entità figlie',
          value: 'cascade',
        },
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: (data) => {
            const cascade = data && data.includes('cascade');
            this.indirizzoService.delete(indirizzo.id, cascade).subscribe({
              next: () => {
                this.showToast('Cantiere eliminato');
                this.caricaDati();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  apriCommessa(id: number) {
    this.navCtrl.navigateForward(['/commessa-dettaglio', id]);
  }

  async apriModalCommessa(indirizzoId: number | null, esistente?: Commessa) {
    const modal = await this.modalCtrl.create({
      component: NuovaCommessaModalComponent,
      componentProps: {
        indirizzoId,
        commessaEsistente: esistente,
        clienteId: this.clienteId(),
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.aggiornato || data?.creato) this.caricaDati();
  }

  async eliminaCommessa(commessa: Commessa) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Commessa',
      message: new IonicSafeString(
        `Vuoi eliminare <strong>${commessa.seriale}</strong>?`,
      ),
      inputs: [
        {
          name: 'cascade',
          type: 'checkbox',
          label: 'Elimina anche tutte le entità figlie',
          value: 'cascade',
        },
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: (data) => {
            const cascade = data && data.includes('cascade');
            this.commessaService.delete(commessa.id, cascade).subscribe({
              next: () => {
                this.showToast('Commessa eliminata');
                this.caricaDati();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  apriAppuntamento(id: number) {
    this.navCtrl.navigateForward(['/appuntamento-dettaglio', id]);
  }

  async apriModalAppuntamento(
    commessaId: number | null,
    indirizzoId: number | null,
    esistente?: Appuntamento,
  ) {
    const modal = await this.modalCtrl.create({
      component: NuovoAppuntamentoGlobaleModalComponent,
      componentProps: {
        appuntamento: esistente,
        targetCommessaId: commessaId,
        targetCantiereId: indirizzoId,
        targetClienteId: this.clienteId(),
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.creato || data?.aggiornato) this.caricaDati();
  }

  async chiediConfermaCancellazione() {
    const alert = await this.alertCtrl.create({
      header: 'Attenzione!',
      subHeader: 'Cancellazione Cliente',
      message: new IonicSafeString(
        `Stai per eliminare <strong>${this.cliente()!.nome}</strong>.<br>Seleziona l'opzione per eliminare anche tutte le entità figlie.`,
      ),
      inputs: [
        {
          name: 'cascade',
          type: 'checkbox',
          label: 'Elimina anche tutte le entità figlie',
          value: 'cascade',
        },
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: (data) => {
            const cascade = data && data.includes('cascade');
            this.clienteService.delete(this.clienteId()!, cascade).subscribe({
              next: () => {
                this.showToast('Cliente eliminato');
                this.navCtrl.navigateBack('/tabs/tab3');
              },
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
