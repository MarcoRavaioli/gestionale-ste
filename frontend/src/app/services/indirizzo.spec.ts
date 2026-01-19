import { TestBed } from '@angular/core/testing';

import { IndirizzoService } from './indirizzo.service';

describe('Indirizzo', () => {
  let service: IndirizzoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndirizzoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
