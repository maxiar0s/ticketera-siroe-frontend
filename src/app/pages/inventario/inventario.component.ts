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
import {
  EstadoInventario,
  Inventario,
  InventarioListadoResponse,
} from '../../interfaces/inventario.interface';
import { ApiService } from '../../services/api.service';
import { SignalService } from '../../services/signal.service';

interface InventarioFormulario {
  id: FormControl<number | null>;
  sku: FormControl<string>;
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  valor: FormControl<string>;
  estado: FormControl<number | null>;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css',
})
export class InventarioComponent implements OnInit {
  inventarios: Inventario[] = [];
  estados: EstadoInventario[] = [];

  inventarioSeleccionado: Inventario | null = null;
  inventarioEnEdicion: Inventario | null = null;

  inventariosCargando = false;
  estadosCargando = false;
  guardandoInventario = false;
  eliminandoInventarioId: number | null = null;

  inventariosPagina = 1;
  inventariosPaginasTotales = 0;
  inventariosLimite = 10;
  inventariosBuscar = '';
  estadoFiltro = '';

  mostrarFormulario = false;
  mensajeError = '';
  mensajeExito = '';

  inventarioForm: FormGroup<InventarioFormulario>;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private signalService: SignalService,
  ) {
    this.inventarioForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      sku: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      nombre: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(255)],
      }),
      descripcion: this.fb.nonNullable.control(''),
      valor: this.fb.nonNullable.control('0', {
        validators: [Validators.required],
      }),
      estado: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
    });
  }

  ngOnInit(): void {
    this.signalService.updateData('Inventario');
    this.cargarEstados();
    this.cargarInventarios();
  }

  cargarInventarios(pagina: number = 1): void {
    if (pagina < 1) {
      return;
    }

    this.inventariosCargando = true;
    this.limpiarMensajes();

    this.apiService
      .getInventarios({
        pagina,
        limite: this.inventariosLimite,
        buscar: this.inventariosBuscar,
        estado: this.estadoFiltro,
      })
      .pipe(finalize(() => (this.inventariosCargando = false)))
      .subscribe({
        next: (respuesta: InventarioListadoResponse) => {
          this.inventarios = Array.isArray(respuesta?.data) ? respuesta.data : [];
          this.inventariosPagina = respuesta?.pagina ?? pagina;
          this.inventariosPaginasTotales = respuesta?.paginasTotales ?? 0;

          if (this.inventarioSeleccionado) {
            const actualizado = this.inventarios.find(
              (item) => item.id === this.inventarioSeleccionado?.id,
            );
            this.inventarioSeleccionado = actualizado ?? null;
          }
        },
        error: (error) => {
          console.error('Error al cargar inventario:', error);
          this.inventarios = [];
          this.inventariosPaginasTotales = 0;
          this.mensajeError = 'No fue posible cargar el inventario.';
        },
      });
  }

  cargarEstados(): void {
    this.estadosCargando = true;
    this.apiService
      .getEstadosInventario()
      .pipe(finalize(() => (this.estadosCargando = false)))
      .subscribe({
        next: (estados) => {
          this.estados = Array.isArray(estados) ? estados : [];
          if (!this.inventarioForm.value.estado && this.estados.length > 0) {
            this.inventarioForm.patchValue({ estado: this.estados[0].id });
          }
        },
        error: (error) => {
          console.error('Error al cargar estados de inventario:', error);
          this.estados = [];
        },
      });
  }

  buscarInventario(): void {
    this.inventariosPagina = 1;
    this.cargarInventarios(1);
  }

  limpiarFiltros(): void {
    this.inventariosBuscar = '';
    this.estadoFiltro = '';
    this.buscarInventario();
  }

  cambiarPagina(pagina: number): void {
    if (
      pagina === this.inventariosPagina ||
      pagina < 1 ||
      (this.inventariosPaginasTotales && pagina > this.inventariosPaginasTotales)
    ) {
      return;
    }

    this.inventariosPagina = pagina;
    this.cargarInventarios(pagina);
  }

  seleccionarInventario(item: Inventario): void {
    this.inventarioSeleccionado = item;
    this.mostrarFormulario = false;
    this.inventarioEnEdicion = null;
  }

  abrirFormularioNuevo(): void {
    this.inventarioSeleccionado = null;
    this.inventarioEnEdicion = null;
    this.mostrarFormulario = true;
    this.limpiarMensajes();
    this.inventarioForm.reset({
      id: null,
      sku: '',
      nombre: '',
      descripcion: '',
      valor: '0',
      estado: this.estados[0]?.id ?? null,
    });
  }

  editarInventario(item: Inventario): void {
    this.inventarioSeleccionado = item;
    this.inventarioEnEdicion = item;
    this.mostrarFormulario = true;
    this.limpiarMensajes();
    this.inventarioForm.reset({
      id: item.id,
      sku: item.sku,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      valor: `${item.valor ?? 0}`,
      estado: item.estado,
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.inventarioEnEdicion = null;
    this.inventarioForm.reset({
      id: null,
      sku: '',
      nombre: '',
      descripcion: '',
      valor: '0',
      estado: this.estados[0]?.id ?? null,
    });
  }

  guardarInventario(): void {
    if (this.inventarioForm.invalid) {
      this.inventarioForm.markAllAsTouched();
      return;
    }

    const formValue = this.inventarioForm.getRawValue();
    if (formValue.estado === null) {
      this.inventarioForm.get('estado')?.markAsTouched();
      return;
    }

    const payload = {
      sku: formValue.sku,
      nombre: formValue.nombre,
      descripcion: formValue.descripcion || null,
      valor: formValue.valor,
      estado: formValue.estado,
    };

    const request$ = this.inventarioEnEdicion?.id
      ? this.apiService.actualizarInventario(this.inventarioEnEdicion.id, payload)
      : this.apiService.crearInventario(payload);

    this.guardandoInventario = true;
    this.limpiarMensajes();

    request$.pipe(finalize(() => (this.guardandoInventario = false))).subscribe({
      next: (inventario) => {
        this.mensajeExito = this.inventarioEnEdicion
          ? 'Item de inventario actualizado correctamente.'
          : 'Item de inventario creado correctamente.';
        this.inventarioSeleccionado = inventario;
        this.mostrarFormulario = false;
        this.inventarioEnEdicion = null;
        this.cargarInventarios(this.inventariosPagina);
      },
      error: (error) => {
        console.error('Error al guardar inventario:', error);
        this.mensajeError =
          error?.error?.error || 'No fue posible guardar el item de inventario.';
      },
    });
  }

  eliminarInventario(item: Inventario): void {
    if (!item?.id || !window.confirm(`Eliminar ${item.nombre}?`)) {
      return;
    }

    this.eliminandoInventarioId = item.id;
    this.limpiarMensajes();

    this.apiService
      .eliminarInventario(item.id)
      .pipe(finalize(() => (this.eliminandoInventarioId = null)))
      .subscribe({
        next: () => {
          this.mensajeExito = 'Item de inventario eliminado correctamente.';
          if (this.inventarioSeleccionado?.id === item.id) {
            this.inventarioSeleccionado = null;
          }
          this.cargarInventarios(this.inventariosPagina);
        },
        error: (error) => {
          console.error('Error al eliminar inventario:', error);
          this.mensajeError =
            error?.error?.error || 'No fue posible eliminar el item de inventario.';
        },
      });
  }

  trackByInventario(_index: number, item: Inventario): number {
    return item.id;
  }

  obtenerNombreEstado(estadoId: number): string {
    return (
      this.estados.find((estado) => estado.id === estadoId)?.name ||
      'Sin estado'
    );
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
