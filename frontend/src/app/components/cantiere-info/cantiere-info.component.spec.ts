import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CantiereInfoComponent } from './cantiere-info.component';

describe('CantiereInfoComponent', () => {
  let component: CantiereInfoComponent;
  let fixture: ComponentFixture<CantiereInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CantiereInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CantiereInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
