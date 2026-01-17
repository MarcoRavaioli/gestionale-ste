import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FatturaDettaglioModalComponent } from './fattura-dettaglio-modal.component';

describe('FatturaDettaglioModalComponent', () => {
  let component: FatturaDettaglioModalComponent;
  let fixture: ComponentFixture<FatturaDettaglioModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FatturaDettaglioModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FatturaDettaglioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
