import { Component, OnInit, inject, EnvironmentInjector } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { 
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  home, calendar, fileTrayFull, timer, receipt, people 
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html', // <--- Assicurati che questa riga ci sia!
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  showManagerTabs = false; 
  showCollaboratorTabs = false; 

  constructor(private auth: AuthService) { 
    addIcons({ home, calendar, fileTrayFull, timer, receipt, people });
  }

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      this.showManagerTabs = this.auth.hasManagerAccess();
      this.showCollaboratorTabs = this.auth.isCollaboratore();
    });
  }
}