import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonButton,
  IonSpinner,
  IonTextarea,
  IonInput,
  ToastController,
  AlertController,
  NavController,
  ModalController,
} from '@ionic/angular/standalone';

import { IndirizzoService } from '../../services/indirizzo.service';
import { AuthService } from '../../services/auth.service';
import { Indirizzo, Commessa, Appuntamento } from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../../components/gestione-allegati/gestione-allegati.component';
import { CommessaItemComponent } from '../../components/commessa-item/commessa-item.component';

import { addIcons } from 'ionicons';
import {
  calendarOutline,
  documentTextOutline,
  timeOutline,
  buildOutline,
  personOutline,
  mapOutline,
  locationOutline,
  pencilOutline,
  saveOutline,
  closeOutline,
  trashOutline,
  briefcaseOutline,
  addCircleOutline,
  chevronForwardOutline,
  businessOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-cantiere-dettaglio',
  templateUrl: './cantiere-dettaglio.page.html',
  styleUrls: ['./cantiere-dettaglio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonButton,
    IonSpinner,
    IonTextarea,
    IonInput,
    GestioneAllegatiComponent,
    CommessaItemComponent,
  ],
})
export class CantiereDettaglioPage implements OnInit {
  cantiereId = signal<number | null>(null);
  cantiere = signal<Indirizzo | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Form state
  editVia = signal<string>('');
  editCivico = signal<string>('');
  editCitta = signal<string>('');
  editCap = signal<string>('');
  editProvincia = signal<string>('');

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private route: ActivatedRoute,
    private indirizzoService: IndirizzoService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      calendarOutline,
      documentTextOutline,
      timeOutline,
      buildOutline,
      personOutline,
      mapOutline,
      locationOutline,
      pencilOutline,
      saveOutline,
      closeOutline,
      trashOutline,
      briefcaseOutline,
      addCircleOutline,
      chevronForwardOutline,
      businessOutline,
    });
  }

  ngOnInit() {
    this.hasManagerAccess.set(this.authService.hasManagerAccess());
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = parseInt(idParam || '', 10);

    if (isNaN(id) || !id) {
      this.navCtrl.back();
      return;
    }

    this.cantiereId.set(id);
    this.caricaDati();
  }

  caricaDati() {
    const id = this.cantiereId();
    if (!id) return;

    this.indirizzoService.findOne(id).subscribe({
      next: (data) => this.cantiere.set(data),
      error: () =>
        this.mostraToast('Impossibile caricare il cantiere', 'danger'),
    });
  }

  abilitaModifica() {
    const c = this.cantiere();
    if (!c) return;

    this.editVia.set(c.via);
    this.editCivico.set(c.civico);
    this.editCitta.set(c.citta);
    this.editCap.set(c.cap);
    this.editProvincia.set(c.provincia || '');

    this.isEditing.set(true);
  }

  annullaModifica() {
    this.isEditing.set(false);
  }

  salvaModifica() {
    const c = this.cantiere();
    if (!c || !this.editVia() || !this.editCitta()) return;

    this.isSaving.set(true);
    const payload = {
      via: this.editVia(),
      civico: this.editCivico(),
      citta: this.editCitta(),
      cap: this.editCap(),
      provincia: this.editProvincia(),
      stato: c.stato, // preserved
    };

    this.indirizzoService.update(c.id, payload).subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }

        this.cantiere.set({ ...c, ...payload });
        this.isEditing.set(false);
        this.isSaving.set(false);
        this.mostraToast('Modifiche salvate!', 'success');
      },
      error: () => {
        this.isSaving.set(false);
        this.mostraToast('Errore nel salvataggio.', 'danger');
      },
    });
  }

  async elimina() {
    const alert = await this.alertCtrl.create({
      header: 'Elimina Cantiere',
      message:
        'Sei sicuro di voler eliminare questo cantiere in modo definitivo?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Rimuovi Solo Cantiere',
          role: 'destructive',
          handler: () => this.confermaEliminazione(false),
        },
        {
          text: 'Eliminazione a Cascata (Tutto)',
          role: 'destructive',
          handler: () => this.confermaEliminazione(true),
        },
      ],
    });
    await alert.present();
  }

  confermaEliminazione(cascade: boolean) {
    this.indirizzoService.delete(this.cantiereId()!, cascade).subscribe({
      next: () => {
        this.mostraToast('Eliminato con successo', 'success');
        this.navCtrl.back();
      },
      error: () => this.mostraToast("Errore durante l'eliminazione", 'danger'),
    });
  }

  apriCommessa(com: Commessa) {
    this.navCtrl.navigateForward(['/commessa-dettaglio', com.id]);
  }

  apriAppuntamento(app: Appuntamento) {
    this.navCtrl.navigateForward(['/appuntamento-dettaglio', app.id]);
  }

  async creaNuovaCommessa() {
    const m =
      await import('../../components/nuova-commessa-modal/nuova-commessa-modal.component').then(
        (c) => c.NuovaCommessaModalComponent,
      );
    const modal = await this.modalCtrl.create({
      component: m,
      componentProps: { cantiereIdPreselezionato: this.cantiereId() },
    });
    modal.onDidDismiss().then((data) => {
      if (data.data && data.data.creato) this.caricaDati();
    });
    await modal.present();
  }

  async creaNuovoAppuntamento() {
    const m =
      await import('../../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component').then(
        (c) => c.NuovoAppuntamentoGlobaleModalComponent,
      );
    const modal = await this.modalCtrl.create({
      component: m,
      componentProps: { cantiereIdPreselezionato: this.cantiereId() },
    });
    modal.onDidDismiss().then((data) => {
      if (data.data && data.data.creato) this.caricaDati();
    });
    await modal.present();
  }

  getParentContext(): string {
    const c = this.cantiere();
    if (!c) return 'Dettaglio Cantiere';
    if (c.cliente) return `Cliente ${c.cliente.nome}`;
    return 'Cantiere Diretto';
  }

  async mostraToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      color,
      duration: 2500,
    });
    t.present();
  }
}
