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
  IonSelect,
  IonSelectOption,
  ToastController,
  AlertController,
  NavController,
  ModalController,
} from '@ionic/angular/standalone';

import { CommessaService } from '../../services/commessa.service';
import { AuthService } from '../../services/auth.service';
import { Commessa, Appuntamento } from '../../interfaces/models';
import { GestioneAllegatiComponent } from '../../components/gestione-allegati/gestione-allegati.component';

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
} from 'ionicons/icons';

@Component({
  selector: 'app-commessa-dettaglio',
  templateUrl: './commessa-dettaglio.page.html',
  styleUrls: ['./commessa-dettaglio.page.scss'],
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
    IonSelect,
    IonSelectOption,
    GestioneAllegatiComponent,
  ],
})
export class CommessaDettaglioPage implements OnInit {
  commessaId = signal<number | null>(null);
  commessa = signal<Commessa | null>(null);

  hasManagerAccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Form state
  editSeriale = signal<string>('');
  editDescrizione = signal<string>('');
  editStato = signal<'APERTA' | 'CHIUSA' | 'IN_CORSO'>('APERTA');
  editValoreTotale = signal<number | null>(null);

  @ViewChild(GestioneAllegatiComponent)
  gestioneAllegati!: GestioneAllegatiComponent;

  constructor(
    private route: ActivatedRoute,
    private commessaService: CommessaService,
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

    this.commessaId.set(id);
    this.caricaDati();
  }

  caricaDati() {
    const id = this.commessaId();
    if (!id) return;

    this.commessaService.getOne(id).subscribe({
      next: (data) => this.commessa.set(data),
      error: () =>
        this.mostraToast('Impossibile caricare la commessa', 'danger'),
    });
  }

  abilitaModifica() {
    const c = this.commessa();
    if (!c) return;

    this.editSeriale.set(c.seriale);
    this.editDescrizione.set(c.descrizione || '');
    this.editStato.set(c.stato);
    this.editValoreTotale.set(c.valore_totale || null);

    this.isEditing.set(true);
  }

  annullaModifica() {
    this.isEditing.set(false);
  }

  salvaModifica() {
    const c = this.commessa();
    if (!c || !this.editSeriale()) return;

    this.isSaving.set(true);
    const payload = {
      seriale: this.editSeriale(),
      descrizione: this.editDescrizione(),
      stato: this.editStato(),
      valore_totale: this.editValoreTotale() ?? undefined,
    };

    this.commessaService.update(c.id, payload).subscribe({
      next: async (res) => {
        if (this.gestioneAllegati) {
          await this.gestioneAllegati.uploadAllPendingFiles(res.id);
        }

        this.commessa.set({ ...c, ...payload });
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
      header: 'Elimina Commessa',
      message:
        'Sei sicuro di voler eliminare questa commessa in modo definitivo?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.commessaService.delete(this.commessaId()!).subscribe({
              next: () => {
                this.mostraToast('Eliminato con successo', 'success');
                this.navCtrl.back();
              },
              error: () =>
                this.mostraToast("Errore durante l'eliminazione", 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  apriAppuntamento(app: Appuntamento) {
    this.navCtrl.navigateForward(['/appuntamento-dettaglio', app.id]);
  }

  async creaNuovoAppuntamento() {
    // TODO: Could navigate to a creation step or open global modal prefilled.
    // For complete consistency with "flat pages", we can dispatch the event or open the modal.
    // Right now opening the modal with preselezione.
    const m =
      await import('../../components/nuovo-appuntamento-globale-modal/nuovo-appuntamento-globale-modal.component').then(
        (c) => c.NuovoAppuntamentoGlobaleModalComponent,
      );
    const modal = await this.modalCtrl.create({
      component: m,
      componentProps: {
        commessaIdPreselezionato: this.commessaId(),
      },
    });
    modal.onDidDismiss().then((data: any) => {
      if (data.data && data.data.creato) {
        this.caricaDati(); // refresh
      }
    });
    await modal.present();
  }

  // Let's inject it properly

  getParentContext(): string {
    const c = this.commessa();
    if (!c) return 'Dettaglio Commessa';
    if (c.indirizzo) return `Cantiere ${c.indirizzo.via}`;
    if (c.cliente) return `Cliente ${c.cliente.nome}`;
    return 'Commessa Diretta';
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
