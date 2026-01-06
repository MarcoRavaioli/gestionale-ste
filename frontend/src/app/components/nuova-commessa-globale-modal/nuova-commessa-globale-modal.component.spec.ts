import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NuovaCommessaGlobaleModalComponent } from './nuova-commessa-globale-modal.component';

describe('NuovaCommessaGlobaleModalComponent', () => {
  let component: NuovaCommessaGlobaleModalComponent;
  let fixture: ComponentFixture<NuovaCommessaGlobaleModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NuovaCommessaGlobaleModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NuovaCommessaGlobaleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
