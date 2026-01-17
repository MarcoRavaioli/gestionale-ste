import { TestBed } from '@angular/core/testing';

import { Collaboratore } from './collaboratore.service';

describe('Collaboratore', () => {
  let service: Collaboratore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Collaboratore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
