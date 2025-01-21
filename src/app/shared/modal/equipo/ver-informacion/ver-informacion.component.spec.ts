import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerInformacionComponent } from './ver-informacion.component';

describe('VerInformacionComponent', () => {
  let component: VerInformacionComponent;
  let fixture: ComponentFixture<VerInformacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerInformacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerInformacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
