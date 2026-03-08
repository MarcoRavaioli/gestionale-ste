import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../interfaces/models';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  callOutline,
  mailOutline,
  businessOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-info',
  templateUrl: './cliente-info.component.html',
  styleUrls: ['./cliente-info.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class ClienteInfoComponent {
  @Input() cliente: Cliente | null = null;

  constructor() {
    addIcons({ personOutline, callOutline, mailOutline, businessOutline });
  }
}
