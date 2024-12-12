import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasaMatrizComponent } from './casa-matriz.component';

describe('CasaMatrizComponent', () => {
  let component: CasaMatrizComponent;
  let fixture: ComponentFixture<CasaMatrizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasaMatrizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CasaMatrizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
