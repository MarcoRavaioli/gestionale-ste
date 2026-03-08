import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChildListAccordionComponent } from './child-list-accordion.component';

describe('ChildListAccordionComponent', () => {
  let component: ChildListAccordionComponent;
  let fixture: ComponentFixture<ChildListAccordionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ChildListAccordionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildListAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
