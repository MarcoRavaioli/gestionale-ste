import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appuntamento } from '../../interfaces/models';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  documentTextOutline,
  linkOutline,
  constructOutline,
  businessOutline,
  folderOutline,
  locationOutline,
  personOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-appuntamento-info',
  templateUrl: './appuntamento-info.component.html',
  styleUrls: ['./appuntamento-info.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class AppuntamentoInfoComponent {
  @Input() appuntamento: Appuntamento | null = null;

  constructor() {
    addIcons({
      timeOutline,
      documentTextOutline,
      linkOutline,
      constructOutline,
      businessOutline,
      folderOutline,
      locationOutline,
      personOutline,
    });
  }
}
