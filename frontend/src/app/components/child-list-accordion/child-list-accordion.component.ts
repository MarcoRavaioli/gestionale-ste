import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonBadge,
  IonAvatar,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline,
  documentTextOutline,
  folderOutline,
  constructOutline,
  timeOutline,
  personOutline,
} from 'ionicons/icons';

// Generic interface for children items
export interface ChildListItem {
  id: number;
  tipo: 'cantiere' | 'commessa' | 'appuntamento' | 'fattura';
  titolo: string;
  sottotitolo?: string;
  url: string; // The forward routing URL (e.g. ['/tabs/tab2/commessa-dettaglio', 123])
}

@Component({
  selector: 'app-child-list-accordion',
  templateUrl: './child-list-accordion.component.html',
  styleUrls: ['./child-list-accordion.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonBadge,
    IonAvatar,
    IonIcon,
  ],
})
export class ChildListAccordionComponent {
  @Input() title: string = 'Elementi';
  @Input() color: string = 'primary';
  @Input() iconName: string = 'folder-outline';

  // React to new items coming from parent
  @Input() set items(val: ChildListItem[] | undefined | null) {
    this._items.set(val || []);
  }

  // Modifiable signal for internal list (after search filter)
  protected _items = signal<ChildListItem[]>([]);
  searchQuery = signal<string>('');

  // Computed signal for fast local filtering
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allItems = this._items();

    if (!query) return allItems;

    return allItems.filter(
      (item) =>
        item.titolo.toLowerCase().includes(query) ||
        (item.sottotitolo && item.sottotitolo.toLowerCase().includes(query)),
    );
  });

  constructor() {
    addIcons({
      chevronForwardOutline,
      documentTextOutline,
      folderOutline,
      constructOutline,
      timeOutline,
      personOutline,
    });
  }

  getIconForType(tipo: string): string {
    switch (tipo) {
      case 'cantiere':
        return 'construct-outline';
      case 'commessa':
        return 'folder-outline';
      case 'appuntamento':
        return 'time-outline';
      case 'fattura':
        return 'document-text-outline';
      default:
        return 'chevron-forward-outline';
    }
  }

  getColorForType(tipo: string): string {
    switch (tipo) {
      case 'cantiere':
        return 'tertiary';
      case 'commessa':
        return 'secondary';
      case 'appuntamento':
        return 'primary';
      case 'fattura':
        return 'success';
      default:
        return 'medium';
    }
  }
}
