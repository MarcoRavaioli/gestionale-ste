import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  searchOutline, 
  closeOutline, 
  chevronDownOutline, 
  checkmarkCircle,
  personOutline,
  locationOutline,
  documentsOutline,
  businessOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-generic-selector',
  templateUrl: './generic-selector.component.html',
  styleUrls: ['./generic-selector.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class GenericSelectorComponent implements OnInit, OnChanges {

  @Input() label: string = 'Seleziona';
  @Input() items: any[] = []; // La lista completa (Clienti, Cantieri o Commesse)
  @Input() selectedId: number | null = null; // L'ID attualmente selezionato
  @Input() type: 'cliente' | 'cantiere' | 'commessa' = 'cliente'; // Per capire cosa mostrare

  @Output() selectedIdChange = new EventEmitter<number>(); // Per il binding bidirezionale [(selectedId)]

  filteredItems: any[] = [];
  isModalOpen = false;

  constructor() {
    addIcons({ searchOutline, closeOutline, chevronDownOutline, checkmarkCircle, personOutline, locationOutline, documentsOutline, businessOutline });
  }

  ngOnInit() {
    this.filteredItems = [...this.items];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items']) {
      this.filteredItems = [...this.items];
    }
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (isOpen) {
      this.filteredItems = [...this.items]; // Reset filtro all'apertura
    }
  }

  // --- LOGICA DI VISUALIZZAZIONE TESTO (INPUT CHIUSO) ---
  getLabelValue(): string {
    if (!this.selectedId || !this.items.length) return '';
    const item = this.items.find(x => x.id === this.selectedId);
    if (!item) return '';

    switch (this.type) {
      case 'cliente': return item.nome;
      case 'cantiere': return `${item.citta} - ${item.via}`;
      case 'commessa': return `${item.seriale} - ${item.descrizione || '...'}`;
      default: return 'Selezionato';
    }
  }

  // --- LOGICA DI RICERCA ---
  filterItems(ev: any) {
    const term = ev.detail.value?.toLowerCase();
    if (!term) {
      this.filteredItems = [...this.items];
      return;
    }

    this.filteredItems = this.items.filter(item => {
      switch (this.type) {
        case 'cliente':
          return item.nome.toLowerCase().includes(term) || item.email?.toLowerCase().includes(term);
        
        case 'cantiere':
          return item.via.toLowerCase().includes(term) || 
                 item.citta.toLowerCase().includes(term) ||
                 item.cliente?.nome.toLowerCase().includes(term); // Cerca anche per cliente proprietario!

        case 'commessa':
          return item.seriale.toLowerCase().includes(term) || 
                 item.descrizione?.toLowerCase().includes(term) ||
                 item.indirizzo?.cliente?.nome.toLowerCase().includes(term); // Cerca anche per cliente
        
        default: return false;
      }
    });
  }

  selectItem(item: any) {
    this.selectedId = item.id;
    this.selectedIdChange.emit(item.id); // Notifica il padre
    this.setOpen(false); // Chiudi modale
  }
}