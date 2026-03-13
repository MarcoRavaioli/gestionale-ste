import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonInput,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonDatetimeButton,
  IonModal,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonFooter,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';

import { ClienteService } from 'src/app/services/cliente.service';
import { FatturaService } from 'src/app/services/fattura.service';
import { CommessaService } from 'src/app/services/commessa.service';
import { Cliente, Commessa, TipoFattura } from 'src/app/interfaces/models';
// Assicurati che il percorso sia corretto
import { NuovoClienteModalComponent } from '../nuovo-cliente-modal/nuovo-cliente-modal.component';

import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  close,
  attachOutline,
  documentTextOutline,
  walletOutline,
  businessOutline,
  calendarOutline,
  personAddOutline, // <--- Nuova Icona
} from 'ionicons/icons';

@Component({
  selector: 'app-nuova-fattura-modal',
  templateUrl: './nuova-fattura-modal.component.html',
  styleUrls: ['./nuova-fattura-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonInput,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonFooter,
    IonSpinner,
  ],
})
export class NuovaFatturaModalComponent implements OnInit {
  form: FormGroup;
  fileSelezionato: File | null = null;

  clienti: Cliente[] = [];
  commesseFiltrate: Commessa[] = [];

  isLoading = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private clienteService: ClienteService,
    private fatturaService: FatturaService,
    private commessaService: CommessaService,
  ) {
    addIcons({
      cloudUploadOutline,
      close,
      attachOutline,
      documentTextOutline,
      walletOutline,
      businessOutline,
      calendarOutline,
      personAddOutline,
    });

    this.form = this.fb.group({
      tipo: [TipoFattura.ENTRATA, Validators.required],
      numero_fattura: ['', Validators.required],
      data_emissione: [new Date().toISOString(), Validators.required],
      data_scadenza: [
        this.calcolaScadenza(new Date().toISOString()),
        Validators.required,
      ],
      totale: ['', [Validators.required, Validators.min(0.01)]],
      descrizione: [''],
      clienteId: [null],
      commessa_ids: [[]],
      incassata: [false],
    });
  }

  ngOnInit() {
    this.caricaClienti();

    // 1. SINCRONIZZAZIONE DATE (Emissione -> Scadenza)
    this.form
      .get('data_emissione')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dateIso) => {
        if (dateIso) {
          const nuovaScadenza = this.calcolaScadenza(dateIso);
          // Aggiorna senza emettere evento per evitare loop (emitEvent: false)
          this.form.patchValue(
            { data_scadenza: nuovaScadenza },
            { emitEvent: false },
          );
        }
      });

    // 2. FILTRO COMMESSE PER CLIENTE
    this.form
      .get('clienteId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((clienteId) => {
        this.form.patchValue({ commessa_ids: [] });

        if (clienteId) {
          // Query al backend per recuperare SOLO le Commesse appartenenti a quel Cliente che NON sono ancora chiuse
          this.isLoading = true;
          this.commessaService
            .getAll(clienteId, 'APERTA')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (res) => {
                this.commesseFiltrate = res;
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Errore recupero commesse:', err);
                this.isLoading = false;
              },
            });
        } else {
          this.commesseFiltrate = [];
        }
      });
  }

  caricaClienti() {
    this.clienteService.getAll().subscribe((res) => {
      this.clienti = res.sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  calcolaScadenza(dataPartenzaIso: string): string {
    const d = new Date(dataPartenzaIso);
    d.setDate(d.getDate() + 30); // Aggiunge 30 giorni esatti
    return d.toISOString();
  }

  // --- NUOVO CLIENTE ---
  async apriNuovoCliente() {
    const modal = await this.modalCtrl.create({
      component: NuovoClienteModalComponent,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    // Se è stato creato un cliente, ricarichiamo la lista
    if (data?.creato) {
      this.clienteService.getAll().subscribe((res) => {
        this.clienti = res.sort((a, b) => a.nome.localeCompare(b.nome));

        // OPZIONALE: Se vuoi selezionare automaticamente il nuovo cliente,
        // dovresti farti restituire l'ID dal modal o cercarlo nella lista (es. l'ultimo creato).
        // Per ora ci limitiamo ad aggiornare la lista.
      });
    }
  }

  // --- GESTIONE FILE ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Il file è troppo grande (Max 5MB)');
        return;
      }
      this.fileSelezionato = file;
    }
  }

  rimuoviFile() {
    this.fileSelezionato = null;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  salva() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const rawData = this.form.value;

    this.fatturaService
      .createWithAttachment(rawData, this.fileSelezionato)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.modalCtrl.dismiss({ creato: true });
        },
        error: (err) => {
          console.error('Errore upload:', err);
          this.isLoading = false;
          alert('Errore durante il salvataggio.');
        },
      });
  }
}
