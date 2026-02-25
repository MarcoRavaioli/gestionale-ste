import { Component, Input } from '@angular/core';
import { IonList, IonListHeader, IonItem, IonSelect, IonSelectOption, PopoverController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewSettings } from '../../services/preferences';

@Component({
  selector: 'app-list-settings-popover',
  templateUrl: './list-settings-popover.component.html',
  styleUrls: ['./list-settings-popover.component.scss'],
  standalone: true,
  imports: [IonList, IonListHeader, IonItem, IonSelect, IonSelectOption, CommonModule, FormsModule],
})
export class ListSettingsPopoverComponent {
  @Input() type: 'clienti' | 'cantieri' | 'commesse' | 'appuntamenti' = 'clienti';
  @Input() settings!: ViewSettings;

  constructor(private popoverCtrl: PopoverController) {}

  applica() {
    // Chiude il popover e restituisce i nuovi settaggi
    this.popoverCtrl.dismiss(this.settings);
  }
}
