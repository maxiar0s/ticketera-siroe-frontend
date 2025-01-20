import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcionesSucursalComponent } from './opciones-sucursal.component';

describe('OpcionesSucursalComponent', () => {
  let component: OpcionesSucursalComponent;
  let fixture: ComponentFixture<OpcionesSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpcionesSucursalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OpcionesSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
