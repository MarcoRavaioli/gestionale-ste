import { TestBed } from '@angular/core/testing';

import { CollaboratoreService } from './collaboratore.service';

describe('Collaboratore', () => {
  let service: CollaboratoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollaboratoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
