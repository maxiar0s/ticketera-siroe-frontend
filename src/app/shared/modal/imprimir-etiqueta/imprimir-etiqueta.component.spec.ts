import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImprimirEtiquetaComponent } from './imprimir-etiqueta.component';

describe('ImprimirEtiquetaComponent', () => {
  let component: ImprimirEtiquetaComponent;
  let fixture: ComponentFixture<ImprimirEtiquetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImprimirEtiquetaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImprimirEtiquetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
