import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { TipoEquipo } from '../../../../interfaces/TipoEquipo.interface';
import { DepartamentoEquipo } from '../../../../interfaces/departamento-equipo.interface';
import { FormatInputSoloNumerosDirective } from '../../../../directives/solo-numeros.directive';

@Component({
  selector: 'shared-crear-equipo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormatInputSoloNumerosDirective],
  templateUrl: './crear-equipo.component.html',
  styleUrl: './crear-equipo.component.css',
})
export class CrearEquipoComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();

  public TipoEquipos: TipoEquipo[] = [];
  public departamentos: DepartamentoEquipo[] = [];

  public isVisible: boolean = true;
  public creating!: boolean;
  public equipoForm: FormGroup;
  public errorMessage: string = '';
  public id: string | null = null;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.equipoForm = this.fb.group({
      sucursalId: ['', Validators.required],
      departamentoId: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      tipoEquipoId: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.id = params.get('id');
      this.equipoForm.patchValue({
        sucursalId: this.id,
      });
    });

    this.apiService.typeEquipments().subscribe({
      next: (respuesta) => {
        this.TipoEquipos = respuesta;
      },
    });

    this.apiService.getDepartamentosEquipo().subscribe({
      next: (departamentos) => {
        this.departamentos = departamentos;
      },
      error: (error) => {
        console.error('Error al cargar departamentos de equipo:', error);
      },
    });
  }

  abrirModal() {
    this.isVisible = true;
  }

  cerrar() {
    this.isVisible = false;
    this.equipoForm.reset();
    this.errorMessage = '';
    this.cerrarModal.emit();
  }

  onSubmit() {
    if (this.equipoForm.valid) {
      this.creating = true;
      this.enviarFormulario.emit(this.equipoForm.value);
      // this.cerrar();
    } else {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos correctamente.';
    }
  }

  changeSelectColor(event: Event) {
    const element = event.currentTarget as HTMLSelectElement;

    element.classList.add('colorSelect');
  }
}
