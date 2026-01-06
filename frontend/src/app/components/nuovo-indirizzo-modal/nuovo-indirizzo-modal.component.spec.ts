import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NuovoIndirizzoModalComponent } from './nuovo-indirizzo-modal.component';

describe('NuovoIndirizzoModalComponent', () => {
  let component: NuovoIndirizzoModalComponent;
  let fixture: ComponentFixture<NuovoIndirizzoModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NuovoIndirizzoModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NuovoIndirizzoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
