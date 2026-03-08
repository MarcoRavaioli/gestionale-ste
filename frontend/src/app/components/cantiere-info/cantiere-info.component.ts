import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Indirizzo } from '../../interfaces/models';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  constructOutline,
  mapOutline,
  locationOutline,
  businessOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-cantiere-info',
  templateUrl: './cantiere-info.component.html',
  styleUrls: ['./cantiere-info.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class CantiereInfoComponent {
  @Input() cantiere: Indirizzo | null = null;

  constructor() {
    addIcons({
      constructOutline,
      mapOutline,
      locationOutline,
      businessOutline,
    });
  }
}
