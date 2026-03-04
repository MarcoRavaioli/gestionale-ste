import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CantiereDettaglioPage } from './cantiere-dettaglio.page';

describe('CantiereDettaglioPage', () => {
  let component: CantiereDettaglioPage;
  let fixture: ComponentFixture<CantiereDettaglioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CantiereDettaglioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
