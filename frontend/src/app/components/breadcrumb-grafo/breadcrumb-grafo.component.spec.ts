import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BreadcrumbGrafoComponent } from './breadcrumb-grafo.component';

describe('BreadcrumbGrafoComponent', () => {
  let component: BreadcrumbGrafoComponent;
  let fixture: ComponentFixture<BreadcrumbGrafoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BreadcrumbGrafoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbGrafoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
