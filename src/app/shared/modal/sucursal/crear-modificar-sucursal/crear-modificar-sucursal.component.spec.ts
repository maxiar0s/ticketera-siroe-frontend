import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearSucursalComponent } from './crear-modificar-sucursal.component';

describe('CrearSucursalComponent', () => {
  let component: CrearSucursalComponent;
  let fixture: ComponentFixture<CrearSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearSucursalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
