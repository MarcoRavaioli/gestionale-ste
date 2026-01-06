import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClienteDettaglioPage } from './cliente-dettaglio.page';

describe('ClienteDettaglioPage', () => {
  let component: ClienteDettaglioPage;
  let fixture: ComponentFixture<ClienteDettaglioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClienteDettaglioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
