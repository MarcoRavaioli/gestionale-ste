import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { Fattura, Cliente, Commessa } from 'src/app/interfaces/models';
import { FatturaService } from 'src/app/services/fattura.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { environment } from 'src/environments/environment';
import { addIcons } from 'ionicons';
import {
  close,
  pencil,
  trash,
  save,
  cloudDownloadOutline,
  documentTextOutline,
  walletOutline,
  businessOutline,
  calendarOutline,
  checkmarkCircle,
  alertCircle,
  cloudUploadOutline,
  checkmarkDoneCircle,
  mailOutline,
  callOutline,
  locationOutline,
  briefcaseOutline,
  timeOutline,
  informationCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-fattura-dettaglio-modal',
  templateUrl: './fattura-dettaglio-modal.component.html',
  styleUrls: ['./fattura-dettaglio-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
})
export class FatturaDettaglioModalComponent implements OnInit {
  @Input() fattura!: Fattura;

  isEditing = false;
  form: FormGroup;
  fileSelezionato: File | null = null;
  clienti: Cliente[] = [];
  commesseFiltrate: Commessa[] = [];

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private fatturaService: FatturaService,
    private clienteService: ClienteService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      close,
      pencil,
      trash,
      save,
      cloudDownloadOutline,
      documentTextOutline,
      walletOutline,
      businessOutline,
      calendarOutline,
      checkmarkCircle,
      alertCircle,
      cloudUploadOutline,
      checkmarkDoneCircle,
      mailOutline,
      callOutline,
      locationOutline,
      briefcaseOutline,
      timeOutline,
      informationCircleOutline,
    });

    this.form = this.fb.group({
      tipo: ['', Validators.required],
      numero_fattura: ['', Validators.required],
      data_emissione: ['', Validators.required],
      data_scadenza: ['', Validators.required],
      totale: ['', Validators.required],
      descrizione: [''],
      clienteId: [null],
      commessaId: [null],
      incassata: [false],
    });
  }

  ngOnInit() {
    this.caricaClienti();
    this.ripristinaDatiForm();

    this.form.get('clienteId')?.valueChanges.subscribe((clienteId) => {
      this.aggiornaCommesseFiltrate(clienteId);
    });
  }

  // --- CALCOLI INDIRETTI / DERIVATI ---

  /** Calcola i giorni alla scadenza (negativo se scaduta) */
  get giorniRimanenti(): number | null {
    if (!this.fattura.data_scadenza) return null;
    const scadenza = new Date(this.fattura.data_scadenza).getTime();
    const oggi = new Date().getTime();
    const diff = scadenza - oggi;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /** Restituisce un testo human-friendly sullo stato temporale */
  get testoStatoScadenza(): string {
    const g = this.giorniRimanenti;
    if (this.fattura.incassata) return 'Pagamento completato';
    if (g === null) return 'Data non impostata';

    if (g < 0) return `Scaduta da ${Math.abs(g)} giorni`;
    if (g === 0) return 'Scade oggi!';
    if (g <= 5) return `In scadenza tra ${g} giorni`;
    return `Mancano ${g} giorni`;
  }

  /** Determina il colore del testo per la scadenza */
  get coloreScadenza(): string {
    if (this.fattura.incassata) return 'success';
    const g = this.giorniRimanenti;
    if (g === null) return 'medium';
    if (g < 0) return 'danger'; // Scaduta
    if (g <= 5) return 'warning'; // Urgente
    return 'medium';
  }

  // --- FINE CALCOLI ---

  ripristinaDatiForm() {
    this.form.patchValue({
      tipo: this.fattura.tipo,
      numero_fattura: this.fattura.numero_fattura,
      data_emissione: this.fattura.data_emissione,
      data_scadenza: this.fattura.data_scadenza,
      totale: this.fattura.totale,
      descrizione: this.fattura.descrizione,
      incassata: this.fattura.incassata,
      clienteId: this.fattura.cliente?.id,
      commessaId: this.fattura.commessa?.id,
    });
    this.aggiornaCommesseFiltrate(this.fattura.cliente?.id);
  }

  aggiornaCommesseFiltrate(clienteId: any) {
    if (clienteId) {
      const c = this.clienti.find((x) => x.id == clienteId);
      this.commesseFiltrate = [];
      c?.indirizzi?.forEach((i) => {
        if (i.commesse) this.commesseFiltrate.push(...i.commesse);
      });
    }
  }

  caricaClienti() {
    this.clienteService.getAll().subscribe((res) => (this.clienti = res));
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) this.ripristinaDatiForm();
  }

  async elimina() {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Elimina Fattura',
      message: "Sei sicuro? L'operazione è irreversibile.",
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.fatturaService.delete(this.fattura.id).subscribe(() => {
              this.modalCtrl.dismiss({ eliminato: true });
            });
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  async segnaComeIncassata() {
    const isEntrata = this.fattura.tipo === 'entrata';

    const confirmAlert = await this.alertCtrl.create({
      header: isEntrata ? 'Conferma Incasso' : 'Conferma Pagamento',
      message: isEntrata
        ? 'Vuoi segnare questa fattura come <strong>INCASSATA</strong>?'
        : 'Vuoi segnare questa fattura come <strong>PAGATA</strong>?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Conferma',
          role: 'confirm',
          handler: () => {
            const payload = {
              ...this.fattura,
              incassata: true,
              clienteId: this.fattura.cliente?.id,
              commessaId: this.fattura.commessa?.id,
            };

            this.fatturaService
              .updateWithAttachment(this.fattura.id, payload, null)
              .subscribe({
                next: (updated) => {
                  this.fattura = updated;
                  this.ripristinaDatiForm();
                },
                error: () => window.alert('Errore aggiornamento'),
              });
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  apriAllegato() {
    if (this.fattura.allegati && this.fattura.allegati.length > 0) {
      const allegato = this.fattura.allegati[this.fattura.allegati.length - 1];
      const url = `${environment.apiUrl}/uploads/fatture/${allegato.nome_file}`;
      window.open(url, '_system');
    }
  }

  onFileSelected(event: any) {
    this.fileSelezionato = event.target.files[0];
  }

  salva() {
    if (this.form.invalid) return;

    this.fatturaService
      .updateWithAttachment(
        this.fattura.id,
        this.form.value,
        this.fileSelezionato
      )
      .subscribe({
        next: (fatturaAggiornata) => {
          this.fattura = fatturaAggiornata;
          this.isEditing = false;
          this.fileSelezionato = null;
        },
        error: () => window.alert('Errore aggiornamento'),
      });
  }

  dismiss() {
    this.modalCtrl.dismiss({ aggiornato: true });
  }
}
