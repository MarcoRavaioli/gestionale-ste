import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NuovoAppuntamentoGlobaleModalComponent } from './nuovo-appuntamento-globale-modal.component';

describe('NuovoAppuntamentoGlobaleModalComponent', () => {
  let component: NuovoAppuntamentoGlobaleModalComponent;
  let fixture: ComponentFixture<NuovoAppuntamentoGlobaleModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NuovoAppuntamentoGlobaleModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NuovoAppuntamentoGlobaleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
