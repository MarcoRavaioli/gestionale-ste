import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommessaInfoComponent } from './commessa-info.component';

describe('CommessaInfoComponent', () => {
  let component: CommessaInfoComponent;
  let fixture: ComponentFixture<CommessaInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommessaInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommessaInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
