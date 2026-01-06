import { TestBed } from '@angular/core/testing';

import { Appuntamento } from './appuntamento';

describe('Appuntamento', () => {
  let service: Appuntamento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Appuntamento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
