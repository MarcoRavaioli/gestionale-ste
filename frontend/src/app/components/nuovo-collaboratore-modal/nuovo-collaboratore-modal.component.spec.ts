import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NuovoCollaboratoreModalComponent } from './nuovo-collaboratore-modal.component';

describe('NuovoCollaboratoreModalComponent', () => {
  let component: NuovoCollaboratoreModalComponent;
  let fixture: ComponentFixture<NuovoCollaboratoreModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NuovoCollaboratoreModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NuovoCollaboratoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
