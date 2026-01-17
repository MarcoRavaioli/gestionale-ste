import { TestBed } from '@angular/core/testing';

import { Fattura } from './fattura.service';

describe('Fattura', () => {
  let service: Fattura;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fattura);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
