import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ɵSSR_CONTENT_INTEGRITY_MARKER } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from '../../../services/loader.service';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { EquipoFormField } from '../../../interfaces/EquipoForm.interface';
import { LoaderModalComponent } from '../../loader-modal/loader-modal.component';

@Component({
  selector: 'shared-modificar-equipo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoaderModalComponent],
  templateUrl: './modificar-equipo.component.html',
  styleUrl: './modificar-equipo.component.css'
})
export class ModificarEquipoComponent {
  // Form group general
  public selectedFile: File | null = null;
  public equipoForm: FormGroup = this.fb.group({
    id: ['', Validators.required]
  });
  private formData = new FormData();
  // Espera para cargar el titulo del modal
  public headerCharged: boolean = false;
  // Espera para body del modal
  public formCharged: boolean = false;

  // Obtiene el ID del equipo
  @Input() idEquipo!: number;

  // Control del modal
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() enviarFormulario = new EventEmitter<any>();
  // Equipo opcional en caso de si existe ID
  public equipo!: Equipo;
  // Tipo del equipo
  public tipoEquipoActual: string = '';
  public camposDinamicos: EquipoFormField[] = [];

  public isVisible: boolean = true;
  public errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    public loaderService: LoaderService,
    private apiService: ApiService,
  ) { }

  ngOnInit() {
    this.loaderService.showModal();
    this.apiService.equiptment(this.idEquipo).subscribe({
      next: (respuesta) => {
        this.equipo = respuesta;

        this.headerCharged = true;
        this.tipoEquipoActual = respuesta.tipoEquipoId;

        this.apiService.formEquipment(this.tipoEquipoActual).subscribe({
          next: (campos) => {
            this.camposDinamicos = campos;
            this.actualizarFormularioConCampos(campos, respuesta);
            this.loaderService.hideModal();
            this.formCharged = true;
          },
          error: (error) => {
            console.error('Error al obtener los campos', error);
            this.loaderService.hideModal();
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener el equipo', error);
        this.loaderService.hideModal();
      }
    });
  }


  actualizarFormularioConCampos(campos: EquipoFormField[], respuesta: any): void {
    const controlesActuales = Object.keys(this.equipoForm.controls);

    controlesActuales.forEach(controlName => {
      if (!campos.find(campo => campo.name === controlName)) {
        this.equipoForm.removeControl(controlName);
      }
    });

    const control = new FormControl('', Validators.required);
    this.equipoForm.addControl('id', control);
    this.equipoForm.patchValue({
      id: this.idEquipo
    });

    const text = new FormControl('');
    this.equipoForm.addControl('text', text);

    campos.forEach(campo => {
      if (!this.equipoForm.contains(campo.name)) {
        const control = new FormControl('');
        this.equipoForm.addControl(campo.name, control);
      }

      if (respuesta[campo.name] !== null && respuesta[campo.name] !== undefined) {
        if(campo.name !== 'imagen') {
          this.equipoForm.patchValue({
            [campo.name]: respuesta[campo.name]
          });
        }
      }
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    this.selectedFile = input!.files![0];
  }

  onSubmit() {
    if (this.equipoForm.valid) {

      Object.keys(this.equipoForm.value).forEach(key => {
        this.formData.append(key, this.equipoForm.value[key]);
      });
      if(this.selectedFile) {
        this.formData.set('imagen', this.selectedFile)
      }

      const comentario = this.equipoForm.value.text;

      this.enviarFormulario.emit(this.formData);

      if(comentario != '') {
        const observacion = {
          equipoId: this.idEquipo,
          text: comentario
        };
        this.apiService.createComment(observacion).subscribe({
          next: (respuesta) => {
            console.log(respuesta)
          },
          error: (error) => {
            console.error('Error al crear observacion', error);
          }
        })
      }
      this.cerrar();
    } else {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
    }
  }
}
