import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppuntamentoInfoComponent } from './appuntamento-info.component';

describe('AppuntamentoInfoComponent', () => {
  let component: AppuntamentoInfoComponent;
  let fixture: ComponentFixture<AppuntamentoInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppuntamentoInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppuntamentoInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
