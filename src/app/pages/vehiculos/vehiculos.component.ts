import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Vehiculo, VehiculoListadoResponse } from '../../interfaces/vehiculo.interface';
import {
  MetodoPagoCombustible,
  VehiculoSalida,
  VehiculoSalidaAdjunto,
} from '../../interfaces/vehiculo-salida.interface';
import { Tecnico } from '../../interfaces/tecnico.interface';
import { SignedUrlPipe } from '../../pipes/generar-url.pipe';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';

interface VehiculoFormulario {
  id: FormControl<number | null>;
  patente: FormControl<string>;
  responsable: FormControl<string>;
  fechaUltimaMantencion: FormControl<string>;
  fechaSiguienteMantencion: FormControl<string>;
  eliminarImagen: FormControl<boolean>;
}

interface VehiculoSalidaFormulario {
  id: FormControl<number | null>;
  fechaHoraSalida: FormControl<string>;
  fechaHoraLlegada: FormControl<string>;
  odometroSalida: FormControl<string>;
  odometroLlegada: FormControl<string>;
  cargaCombustible: FormControl<boolean>;
  metodoPago: FormControl<MetodoPagoCombustible | ''>;
  valorCarga: FormControl<string>;
  comentarios: FormControl<string>;
  tecnicoIds: FormControl<number[]>;
}

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SignedUrlPipe,
    FormatoFechaPipe,
  ],
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.css',
})
export class VehiculosComponent implements OnInit {
  vehiculos: Vehiculo[] = [];
  vehiculosCargando = false;
  vehiculosPagina = 1;
  vehiculosPaginasTotales = 0;
  vehiculosLimite = 10;
  vehiculosBuscar = '';

  vehiculoSeleccionado: Vehiculo | null = null;
  detalleVehiculoCargando = false;

  vehiculoForm: FormGroup<VehiculoFormulario>;
  mostrarVehiculoForm = false;
  guardandoVehiculo = false;
  vehiculoEnEdicion: Vehiculo | null = null;
  vehiculoImagen: File | null = null;

  tecnicos: Tecnico[] = [];
  tecnicosCargando = false;

  salidaForm: FormGroup<VehiculoSalidaFormulario>;
  mostrarSalidaForm = false;
  salidaGuardando = false;
  salidaEnEdicion: VehiculoSalida | null = null;
  adjuntosPrevios: VehiculoSalidaAdjunto[] = [];
  adjuntosAEliminar = new Set<number>();
  salidaAdjuntos: File[] = [];
  salidaComprobantes: File[] = [];
  mostrarTecnicosDropdown = false;

  readonly metodosPagoCombustible: MetodoPagoCombustible[] = [
    'Efectivo',
    'Tarjeta',
    'Copec Personas',
    'Copec Empresas',
  ];

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.vehiculoForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      patente: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(30)],
      }),
      responsable: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(255)],
      }),
      fechaUltimaMantencion: this.fb.nonNullable.control(''),
      fechaSiguienteMantencion: this.fb.nonNullable.control(''),
      eliminarImagen: this.fb.nonNullable.control(false),
    });

    this.salidaForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      fechaHoraSalida: this.fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      fechaHoraLlegada: this.fb.nonNullable.control(''),
      odometroSalida: this.fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      odometroLlegada: this.fb.nonNullable.control(''),
      cargaCombustible: this.fb.nonNullable.control(false),
      metodoPago: this.fb.nonNullable.control<MetodoPagoCombustible | ''>(''),
      valorCarga: this.fb.nonNullable.control(''),
      comentarios: this.fb.nonNullable.control(''),
      tecnicoIds: this.fb.nonNullable.control<number[]>([]),
    });

    this.salidaForm
      .get('cargaCombustible')
      ?.valueChanges.subscribe((value) => {
        if (!value) {
          this.salidaForm.patchValue(
            {
              metodoPago: '' as MetodoPagoCombustible | '',
              valorCarga: '',
            },
            { emitEvent: false }
          );
        }
      });
  }

  ngOnInit(): void {
    this.cargarTecnicos();
    this.cargarVehiculos();
  }

  private cargarTecnicos(): void {
    this.tecnicosCargando = true;
    this.apiService
      .tecnicosDisponibles()
      .pipe(finalize(() => (this.tecnicosCargando = false)))
      .subscribe({
        next: (lista) => {
          this.tecnicos = Array.isArray(lista) ? lista : [];
        },
        error: (error) => {
          console.error('Error al cargar técnicos', error);
          this.tecnicos = [];
        },
      });
  }

  cargarVehiculos(pagina: number = 1): void {
    if (pagina < 1) {
      return;
    }

    this.vehiculosCargando = true;
    this.apiService
      .getVehiculos({
        pagina,
        limite: this.vehiculosLimite,
        buscar: this.vehiculosBuscar,
      })
      .pipe(finalize(() => (this.vehiculosCargando = false)))
      .subscribe({
        next: (respuesta: VehiculoListadoResponse) => {
          this.vehiculos = Array.isArray(respuesta?.data)
            ? respuesta.data
            : [];
          this.vehiculosPagina = respuesta?.pagina ?? pagina;
          this.vehiculosPaginasTotales = respuesta?.paginasTotales ?? 0;

          if (
            this.vehiculoSeleccionado &&
            !this.vehiculos.some((v) => v.id === this.vehiculoSeleccionado?.id)
          ) {
            this.vehiculoSeleccionado = null;
          }
        },
        error: (error) => {
          console.error('Error al obtener vehículos', error);
          this.vehiculos = [];
          this.vehiculosPaginasTotales = 0;
        },
      });
  }

  buscarVehiculos(): void {
    this.vehiculosPagina = 1;
    this.cargarVehiculos(this.vehiculosPagina);
  }

  cambiarPaginaVehiculos(pagina: number): void {
    if (
      pagina === this.vehiculosPagina ||
      pagina < 1 ||
      (this.vehiculosPaginasTotales &&
        pagina > this.vehiculosPaginasTotales)
    ) {
      return;
    }
    this.vehiculosPagina = pagina;
    this.cargarVehiculos(pagina);
  }

  abrirFormularioVehiculo(vehiculo?: Vehiculo): void {
    this.mostrarVehiculoForm = true;
    this.vehiculoEnEdicion = vehiculo ?? null;
    this.vehiculoImagen = null;

    if (vehiculo) {
      this.vehiculoForm.setValue({
        id: vehiculo.id,
        patente: vehiculo.patente,
        responsable: vehiculo.responsable,
        fechaUltimaMantencion: vehiculo.fechaUltimaMantencion ?? '',
        fechaSiguienteMantencion: vehiculo.fechaSiguienteMantencion ?? '',
        eliminarImagen: false,
      });
    } else {
      this.vehiculoForm.reset({
        id: null,
        patente: '',
        responsable: '',
        fechaUltimaMantencion: '',
        fechaSiguienteMantencion: '',
        eliminarImagen: false,
      });
    }
  }

  cerrarFormularioVehiculo(): void {
    this.mostrarVehiculoForm = false;
    this.vehiculoEnEdicion = null;
    this.vehiculoImagen = null;
    this.vehiculoForm.reset({
      id: null,
      patente: '',
      responsable: '',
      fechaUltimaMantencion: '',
      fechaSiguienteMantencion: '',
      eliminarImagen: false,
    });
  }

  onVehiculoImagenChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.vehiculoImagen = file ?? null;
    if (file) {
      this.vehiculoForm.patchValue({ eliminarImagen: false });
    }
  }

  onEliminarImagenChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleEliminarImagen(!!input?.checked);
  }

  toggleEliminarImagen(checked: boolean): void {
    this.vehiculoForm.patchValue({ eliminarImagen: checked });
    if (checked) {
      this.vehiculoImagen = null;
    }
  }

  guardarVehiculo(): void {
    if (this.vehiculoForm.invalid) {
      this.vehiculoForm.markAllAsTouched();
      return;
    }

    const values = this.vehiculoForm.value;
    const esEdicion = !!values.id;

    const formData = new FormData();
    formData.append('patente', (values.patente ?? '').trim());
    formData.append('responsable', (values.responsable ?? '').trim());

    if (values.fechaUltimaMantencion) {
      formData.append('fechaUltimaMantencion', values.fechaUltimaMantencion);
    } else if (esEdicion) {
      formData.append('fechaUltimaMantencion', '');
    }

    if (values.fechaSiguienteMantencion) {
      formData.append('fechaSiguienteMantencion', values.fechaSiguienteMantencion);
    } else if (esEdicion) {
      formData.append('fechaSiguienteMantencion', '');
    }

    if (values.eliminarImagen) {
      formData.append('eliminarImagen', 'true');
    }

    if (this.vehiculoImagen) {
      formData.append('imagen', this.vehiculoImagen);
    }

    this.guardandoVehiculo = true;
    const peticion = esEdicion && values.id
      ? this.apiService.actualizarVehiculo(values.id, formData)
      : this.apiService.crearVehiculo(formData);

    peticion
      .pipe(finalize(() => (this.guardandoVehiculo = false)))
      .subscribe({
        next: (vehiculo) => {
          this.cerrarFormularioVehiculo();
          this.cargarVehiculos(this.vehiculosPagina);
          if (vehiculo?.id) {
            this.seleccionarVehiculoPorId(vehiculo.id);
          }
        },
        error: (error) => {
          console.error('Error al guardar vehículo', error);
        },
      });
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    const confirmar = window.confirm(
      `¿Seguro desea eliminar el vehículo ${vehiculo.patente}?`
    );
    if (!confirmar) {
      return;
    }

    this.apiService.eliminarVehiculo(vehiculo.id).subscribe({
      next: () => {
        if (this.vehiculoSeleccionado?.id === vehiculo.id) {
          this.vehiculoSeleccionado = null;
        }
        this.cargarVehiculos(this.vehiculosPagina);
      },
      error: (error) => {
        console.error('Error al eliminar vehículo', error);
      },
    });
  }

  seleccionarVehiculo(vehiculo: Vehiculo): void {
    this.seleccionarVehiculoPorId(vehiculo.id);
  }

  private seleccionarVehiculoPorId(id: number): void {
    this.detalleVehiculoCargando = true;
    this.apiService
      .getVehiculo(id)
      .pipe(finalize(() => (this.detalleVehiculoCargando = false)))
      .subscribe({
        next: (vehiculo) => {
          this.vehiculoSeleccionado = vehiculo;
          this.mostrarSalidaForm = false;
          this.salidaEnEdicion = null;
        },
        error: (error) => {
          console.error('Error al obtener detalle del vehículo', error);
          if (this.vehiculoSeleccionado?.id === id) {
            this.vehiculoSeleccionado = null;
          }
        },
      });
  }

  abrirFormularioSalida(salida?: VehiculoSalida): void {
    if (!this.vehiculoSeleccionado) {
      return;
    }

    this.mostrarSalidaForm = true;
    this.salidaEnEdicion = salida ?? null;
    this.adjuntosPrevios = salida?.adjuntos ?? [];
    this.adjuntosAEliminar.clear();
    this.salidaAdjuntos = [];
    this.salidaComprobantes = [];

    if (salida) {
      this.salidaForm.setValue({
        id: salida.id,
        fechaHoraSalida: salida.fechaHoraSalida ?? '',
        fechaHoraLlegada: salida.fechaHoraLlegada ?? '',
        odometroSalida: salida.odometroSalida != null ? String(salida.odometroSalida) : '',
        odometroLlegada: salida.odometroLlegada != null ? String(salida.odometroLlegada) : '',
        cargaCombustible: salida.cargaCombustible,
        metodoPago: salida.metodoPago ?? '',
        valorCarga: salida.valorCarga != null ? String(salida.valorCarga) : '',
        comentarios: salida.comentarios ?? '',
        tecnicoIds: Array.isArray(salida.tecnicos)
          ? salida.tecnicos.map((tecnico) => tecnico.id)
          : [],
      });
    } else {
      this.salidaForm.reset({
        id: null,
        fechaHoraSalida: '',
        fechaHoraLlegada: '',
        odometroSalida: '',
        odometroLlegada: '',
        cargaCombustible: false,
        metodoPago: '' as MetodoPagoCombustible | '',
        valorCarga: '',
        comentarios: '',
        tecnicoIds: [],
      });
    }
  }

  cerrarFormularioSalida(): void {
    this.mostrarSalidaForm = false;
    this.salidaEnEdicion = null;
    this.adjuntosPrevios = [];
    this.adjuntosAEliminar.clear();
    this.salidaAdjuntos = [];
    this.salidaComprobantes = [];
    this.salidaForm.reset({
      id: null,
      fechaHoraSalida: '',
      fechaHoraLlegada: '',
      odometroSalida: '',
      odometroLlegada: '',
      cargaCombustible: false,
      metodoPago: '' as MetodoPagoCombustible | '',
      valorCarga: '',
      comentarios: '',
      tecnicoIds: [],
    });
  }

  onSalidaAdjuntosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.salidaAdjuntos = Array.from(input.files ?? []);
  }

  onSalidaComprobantesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.salidaComprobantes = Array.from(input.files ?? []);
  }

  toggleAdjuntoEliminar(adjuntoId: number, checked: boolean): void {
    if (checked) {
      this.adjuntosAEliminar.add(adjuntoId);
    } else {
      this.adjuntosAEliminar.delete(adjuntoId);
    }
  }

  onAdjuntoEliminarChange(adjuntoId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleAdjuntoEliminar(adjuntoId, !!input?.checked);
  }

  onToggleTecnico(tecnicoId: number, event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement | null;
    const checked = !!input?.checked;
    const control = this.salidaForm.get('tecnicoIds');
    if (!control) {
      return;
    }

    const actuales = Array.isArray(control.value) ? [...control.value] : [];
    if (checked) {
      if (!actuales.includes(tecnicoId)) {
        actuales.push(tecnicoId);
      }
    } else {
      const index = actuales.indexOf(tecnicoId);
      if (index >= 0) {
        actuales.splice(index, 1);
      }
    }

    control.setValue(actuales);
  }

  toggleTecnicosDropdown(): void {
    this.mostrarTecnicosDropdown = !this.mostrarTecnicosDropdown;
  }

  limpiarTecnicos(): void {
    this.salidaForm.get('tecnicoIds')?.setValue([]);
  }

  get tecnicosSeleccionadosTexto(): string {
    const ids = Array.isArray(this.salidaForm.value.tecnicoIds)
      ? this.salidaForm.value.tecnicoIds
      : [];
    if (ids.length === 0) {
      return 'Selecciona técnicos';
    }

    const nombres = this.tecnicos
      .filter((tecnico) => ids.includes(tecnico.id))
      .map((tecnico) => tecnico.name);

    if (nombres.length === 0) {
      return `${ids.length} seleccionado(s)`;
    }

    if (nombres.length === 1) {
      return nombres[0];
    }

    if (nombres.length === 2) {
      return nombres.join(', ');
    }

    return `${nombres.slice(0, 2).join(', ')} +${nombres.length - 2}`;
  }

  guardarSalida(): void {
    if (!this.vehiculoSeleccionado) {
      return;
    }

    if (this.salidaForm.invalid) {
      this.salidaForm.markAllAsTouched();
      return;
    }

    const values = this.salidaForm.value;
    const esEdicion = !!values.id;

    const formData = new FormData();
    formData.append('fechaHoraSalida', values.fechaHoraSalida ?? '');

    if (values.fechaHoraLlegada) {
      formData.append('fechaHoraLlegada', values.fechaHoraLlegada);
    } else if (esEdicion) {
      formData.append('fechaHoraLlegada', '');
    }

    formData.append('odometroSalida', values.odometroSalida ?? '');
    if (values.odometroLlegada) {
      formData.append('odometroLlegada', values.odometroLlegada);
    } else if (esEdicion) {
      formData.append('odometroLlegada', '');
    }

    formData.append(
      'cargaCombustible',
      values.cargaCombustible ? 'true' : 'false'
    );

    if (values.cargaCombustible) {
      if (values.metodoPago) {
        formData.append('metodoPago', values.metodoPago);
      }
      if (values.valorCarga) {
        formData.append('valorCarga', values.valorCarga);
      }
    }

    if (values.comentarios) {
      formData.append('comentarios', values.comentarios.trim());
    } else if (esEdicion) {
      formData.append('comentarios', '');
    }

    const tecnicosSeleccionados = Array.isArray(values.tecnicoIds)
      ? values.tecnicoIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];
    formData.append('tecnicoIds', JSON.stringify(tecnicosSeleccionados));

    this.salidaAdjuntos.forEach((file) => {
      formData.append('adjuntos', file);
    });

    this.salidaComprobantes.forEach((file) => {
      formData.append('comprobante', file);
    });

    if (this.adjuntosAEliminar.size) {
      formData.append(
        'adjuntosEliminar',
        JSON.stringify(Array.from(this.adjuntosAEliminar))
      );
    }

    this.salidaGuardando = true;
    const peticion =
      esEdicion && values.id
        ? this.apiService.actualizarVehiculoSalida(
            this.vehiculoSeleccionado.id,
            values.id,
            formData
          )
        : this.apiService.crearVehiculoSalida(
            this.vehiculoSeleccionado.id,
            formData
          );

    peticion
      .pipe(finalize(() => (this.salidaGuardando = false)))
      .subscribe({
        next: () => {
          this.cerrarFormularioSalida();
          this.seleccionarVehiculoPorId(this.vehiculoSeleccionado!.id);
        },
        error: (error) => {
          console.error('Error al guardar salida', error);
        },
      });
  }

  eliminarSalida(salida: VehiculoSalida): void {
    if (!this.vehiculoSeleccionado) {
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro desea eliminar la salida registrada el ${salida.fechaHoraSalida}?`
    );
    if (!confirmar) {
      return;
    }

    this.apiService
      .eliminarVehiculoSalida(this.vehiculoSeleccionado.id, salida.id)
      .subscribe({
        next: () => {
          this.seleccionarVehiculoPorId(this.vehiculoSeleccionado!.id);
        },
        error: (error) => {
          console.error('Error al eliminar salida', error);
        },
      });
  }

  obtenerAdjuntosGenerales(): VehiculoSalidaAdjunto[] {
    return Array.isArray(this.adjuntosPrevios)
      ? this.adjuntosPrevios.filter((adjunto) => adjunto.tipo === 'general')
      : [];
  }

  obtenerAdjuntosComprobante(): VehiculoSalidaAdjunto[] {
    return Array.isArray(this.adjuntosPrevios)
      ? this.adjuntosPrevios.filter((adjunto) => adjunto.tipo === 'comprobante')
      : [];
  }
}
