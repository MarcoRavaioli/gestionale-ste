import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NuovoCantiereGlobaleModalComponent } from './nuovo-cantiere-globale-modal.component';

describe('NuovoCantiereGlobaleModalComponent', () => {
  let component: NuovoCantiereGlobaleModalComponent;
  let fixture: ComponentFixture<NuovoCantiereGlobaleModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NuovoCantiereGlobaleModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NuovoCantiereGlobaleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
