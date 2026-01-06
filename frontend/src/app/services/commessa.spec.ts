import { TestBed } from '@angular/core/testing';

import { Commessa } from './commessa';

describe('Commessa', () => {
  let service: Commessa;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Commessa);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
