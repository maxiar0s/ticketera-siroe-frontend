import { CommonModule } from '@angular/common';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { Bitacora } from '../../interfaces/bitacora.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormatoFechaPipe],
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.css',
})
export class BitacoraComponent implements OnInit {
  filtroForm: FormGroup;
  bitacoraForm: FormGroup;

  bitacoras: Bitacora[] = [];
  bitacoraSeleccionada?: Bitacora;

  clientes: ClienteResumen[] = [];
  sucursalesFiltro: SucursalOption[] = [];
  sucursalesFormulario: SucursalOption[] = [];
  private sucursalesCache = new Map<string, SucursalOption[]>();

  paginaActual = 1;
  paginasTotales = 0;
  limite = 10;

  cargando = false;
  guardando = false;
  errorMensaje = '';
  exitoMensaje = '';

  formularioVisible = false;
  modoEdicion = false;
  selectedFiles: File[] = [];
  eliminandoBitacoraId: number | null = null;

  readonly esAdmin: boolean;
  readonly esTecnico: boolean;
  readonly esMesaAyuda: boolean;
  readonly esCliente: boolean;
  readonly puedeCrear: boolean;
  readonly soloLectura: boolean;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.esAdmin = this.authService.esAdministrador();
    this.esTecnico = this.authService.esTecnico();
    this.esMesaAyuda = this.authService.esMesaAyuda();
    this.esCliente = this.authService.esCliente();
    this.puedeCrear = this.esAdmin || this.esTecnico;
    this.soloLectura = this.esMesaAyuda || this.esCliente;

    this.filtroForm = this.fb.group({
      clienteId: [''],
      sucursalId: [''],
      buscar: [''],
    });

    this.bitacoraForm = this.fb.group({
      id: [null],
      titulo: [''],
      clienteId: ['', Validators.required],
      sucursalId: [''],
      fechaVisita: ['', Validators.required],
      horaLlegada: ['', Validators.required],
      horaSalida: ['', Validators.required],
      tecnicos: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
    });

  }

  downloadAdjunto(fileName: string): void {
    if (!fileName) {
      console.error('Nombre de archivo no proporcionado');
      return;
    }

    this.apiService.signedUrl(fileName).subscribe({
      next: (url) => {
        if (url) {
          // Crear un enlace temporal y simular clic para la descarga
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName.split('/').pop() || fileName; // Usar solo el nombre del archivo, no la ruta completa
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          console.error('URL firmada no disponible');
          this.errorMensaje = 'No se pudo descargar el archivo. URL no disponible.';
        }
      },
      error: (err) => {
        console.error('Error al obtener URL firmada:', err);
        this.errorMensaje = 'Error al descargar el archivo. Por favor, intenta nuevamente.';
      },
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  private cargarClientes(): void {
    this.apiService.clientesBitacora().subscribe({
      next: (clientes) => {
        this.clientes = Array.isArray(clientes) ? clientes : [];
        const clienteActual = this.filtroForm.value.clienteId;

        if (!clienteActual && this.clientes.length === 1) {
          const unico = this.clientes[0];
          this.filtroForm.patchValue({ clienteId: unico.id }, { emitEvent: false });
          this.cargarSucursalesParaCliente(unico.id, 'filtro');
        } else if (clienteActual) {
          this.cargarSucursalesParaCliente(clienteActual, 'filtro');
        }

        this.cargarBitacoras();
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.errorMensaje =
          'No fue posible obtener el listado de clientes disponibles.';
        this.cargarBitacoras();
      },
    });
  }

  buscarBitacoras(): void {
    this.paginaActual = 1;
    this.cargarBitacoras();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      clienteId: this.esCliente && this.clientes.length === 1 ? this.clientes[0].id : '',
      sucursalId: '',
      buscar: '',
    });
    const clienteId = this.filtroForm.value.clienteId;
    if (clienteId) {
      this.cargarSucursalesParaCliente(clienteId, 'filtro');
    } else {
      this.sucursalesFiltro = [];
    }
    this.paginaActual = 1;
    this.cargarBitacoras();
  }

  private cargarBitacoras(mostrarLoader: boolean = true): void {
    if (mostrarLoader) {
      this.cargando = true;
    }
    this.errorMensaje = '';

    const filtros = this.filtroForm.getRawValue();
    const params: Record<string, any> = {
      pagina: this.paginaActual,
      limite: this.limite,
      clienteId: filtros.clienteId,
      sucursalId: filtros.sucursalId,
      buscar: filtros.buscar,
    };

    this.apiService
      .bitacoras(params)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          const data = respuesta?.data ?? [];
          this.bitacoras = data;
          this.paginasTotales = respuesta?.paginasTotales ?? 0;
          this.paginaActual = respuesta?.pagina ?? 1;
          if (this.bitacoraSeleccionada) {
            const actualizada = data.find(
              (item: Bitacora) => item.id === this.bitacoraSeleccionada?.id
            );
            this.bitacoraSeleccionada = actualizada;
          }
        },
        error: (error) => {
          console.error('Error al cargar bitacoras', error);
          this.errorMensaje =
            error?.error?.error ??
            'Ocurrio un error al intentar obtener las bitacoras.';
          this.bitacoras = [];
          this.paginasTotales = 0;
        },
      });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.paginasTotales || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarBitacoras();
  }

  seleccionarBitacora(bitacora: Bitacora): void {
    this.bitacoraSeleccionada = bitacora;
  }

  puedeEditarBitacora(_bitacora: Bitacora): boolean {
    return this.esAdmin || this.esTecnico;
  }

  abrirFormularioCrear(): void {
    if (!this.puedeCrear) {
      return;
    }

    this.habilitarTodosLosControles();
    const clienteId =
      this.filtroForm.value.clienteId ||
      (this.clientes.length === 1 ? this.clientes[0].id : '');

    this.bitacoraForm.reset({
      id: null,
      titulo: '',
      clienteId,
      sucursalId: '',
      fechaVisita: this.obtenerFechaActual(),
      horaLlegada: '',
      horaSalida: '',
      tecnicos: '',
      descripcion: '',
    });

    this.formularioVisible = true;
    this.modoEdicion = false;
    this.exitoMensaje = '';
    this.errorMensaje = '';

    if (clienteId) {
      this.cargarSucursalesParaCliente(clienteId, 'form');
    } else {
      this.sucursalesFormulario = [];
    }
  }

  abrirFormularioEditar(bitacora: Bitacora, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeEditarBitacora(bitacora)) {
      return;
    }

    this.habilitarTodosLosControles();
    this.bitacoraForm.reset({
      id: bitacora.id,
      titulo: bitacora.titulo ?? '',
      clienteId: bitacora.casaMatrizId,
      sucursalId: bitacora.sucursalId ?? '',
      fechaVisita: bitacora.fechaVisita?.slice(0, 10) ?? '',
      horaLlegada: this.formatearParaInputFecha(bitacora.horaLlegada),
      horaSalida: this.formatearParaInputFecha(bitacora.horaSalida),
      tecnicos: (bitacora.tecnicos ?? []).join(', '),
      descripcion: bitacora.descripcion,
    });

    this.formularioVisible = true;
    this.modoEdicion = true;
    this.exitoMensaje = '';
    this.errorMensaje = '';

    const clienteId = bitacora.casaMatrizId;
    this.cargarSucursalesParaCliente(clienteId, 'form', () => {
      this.bitacoraForm.patchValue({
        sucursalId: bitacora.sucursalId ?? '',
      });
    });

    if (this.esTecnico && !this.esAdmin) {
      this.desactivarCamposParaTecnico();
    }
  }

  cerrarFormulario(): void {
    this.formularioVisible = false;
    this.modoEdicion = false;
    this.guardando = false;
    this.bitacoraForm.reset();
    this.sucursalesFormulario = [];
    this.habilitarTodosLosControles();
  }

  guardarBitacora(): void {
    if (this.guardando) {
      return;
    }

    if (this.bitacoraForm.invalid) {
      this.bitacoraForm.markAllAsTouched();
      return;
    }

    const formValue = this.bitacoraForm.getRawValue();
    const esEdicion = this.modoEdicion && formValue.id;
    let payload: any | null = null;

    if (esEdicion) {
      if (this.esTecnico && !this.esAdmin) {
        payload = {
          descripcion: formValue.descripcion.trim(),
        };
      } else {
        payload = this.construirPayloadCompleto(formValue);
      }
    } else {
      payload = this.construirPayloadCompleto(formValue);
    }

    if (!payload) {
      this.errorMensaje =
        'Debes ingresar al menos un tecnico responsable para la visita.';
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';

    let solicitud$;

    // Si hay archivos seleccionados, enviamos FormData
    if (this.selectedFiles?.length) {
      const formData = new FormData();
      // adjuntamos payload como JSON en campo 'payload'
      formData.append('payload', JSON.stringify(payload));
      this.selectedFiles.forEach((file, idx) => {
        formData.append('files', file, file.name);
      });

      if (esEdicion) {
        solicitud$ = this.apiService.actualizarBitacora(formValue.id, formData);
      } else {
        solicitud$ = this.apiService.crearBitacora(formData);
      }
    } else {
      solicitud$ = esEdicion
        ? this.apiService.actualizarBitacora(formValue.id, payload)
        : this.apiService.crearBitacora(payload);
    }

    solicitud$
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: (respuesta) => {
          this.exitoMensaje = esEdicion
            ? 'Bitacora actualizada correctamente.'
            : 'Bitacora registrada correctamente.';
          this.cerrarFormulario();
          if (esEdicion) {
            this.cargarBitacoras(false);
            if (respuesta) {
              this.bitacoraSeleccionada = respuesta;
            }
          } else {
            this.paginaActual = 1;
            this.cargarBitacoras();
            this.bitacoraSeleccionada = respuesta;
          }
        },
        error: (error) => {
          console.error('Error al guardar bitacora', error);
          this.errorMensaje =
            error?.error?.error ?? 'No se pudo guardar la bitacora.';
        },
      });
  }

    onFilesSelected(files: FileList | null): void {
      if (!files) {
        return;
      }
      // append selected files to array
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (f) this.selectedFiles.push(f);
      }
    }

    removeSelectedFile(index: number): void {
      if (index >= 0 && index < this.selectedFiles.length) {
        this.selectedFiles.splice(index, 1);
      }
    }

  onClienteFiltroChange(clienteId: string): void {
    this.filtroForm.patchValue({ sucursalId: '' }, { emitEvent: false });
    if (!clienteId) {
      this.sucursalesFiltro = [];
      return;
    }
    this.cargarSucursalesParaCliente(clienteId, 'filtro');
  }

  onClienteFormChange(clienteId: string): void {
    this.bitacoraForm.patchValue({ sucursalId: '' });
    if (!clienteId) {
      this.sucursalesFormulario = [];
      return;
    }
    this.cargarSucursalesParaCliente(clienteId, 'form');
  }

  private cargarSucursalesParaCliente(
    clienteId: string,
    contexto: 'filtro' | 'form',
    callback?: () => void
  ): void {
    if (!clienteId) {
      if (contexto === 'filtro') {
        this.sucursalesFiltro = [];
      } else {
        this.sucursalesFormulario = [];
      }
      callback?.();
      return;
    }

    if (this.sucursalesCache.has(clienteId)) {
      const listado = this.sucursalesCache.get(clienteId) ?? [];
      if (contexto === 'filtro') {
        this.sucursalesFiltro = listado;
      } else {
        this.sucursalesFormulario = listado;
      }
      callback?.();
      return;
    }

    this.apiService.sucursalesPorCliente(clienteId).subscribe({
      next: (sucursales) => {
        const opciones =
          (sucursales ?? []).map((item: any) => ({
            id: item.id,
            sucursal: item.sucursal,
            estado: item.estado,
          })) ?? [];
        this.sucursalesCache.set(clienteId, opciones);
        if (contexto === 'filtro') {
          this.sucursalesFiltro = opciones;
        } else {
          this.sucursalesFormulario = opciones;
        }
        callback?.();
      },
      error: (error) => {
        console.error('Error al cargar sucursales', error);
        if (contexto === 'filtro') {
          this.sucursalesFiltro = [];
        } else {
          this.sucursalesFormulario = [];
        }
        callback?.();
      },
    });
  }

  private construirPayloadCompleto(formValue: any): any | null {
    const tecnicos = this.parseTecnicos(formValue.tecnicos);
    if (tecnicos.length === 0) {
      return null;
    }
    return {
      casaMatrizId: formValue.clienteId,
      sucursalId: formValue.sucursalId || null,
      fechaVisita: formValue.fechaVisita,
      horaLlegada: this.formatearAISO(formValue.horaLlegada),
      horaSalida: this.formatearAISO(formValue.horaSalida),
      tecnicos,
      descripcion: formValue.descripcion.trim(),
      titulo: formValue.titulo ? formValue.titulo.trim() : null,
    };
  }

  private parseTecnicos(value: string): string[] {
    if (!value) {
      return [];
    }
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private formatearAISO(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return date.toISOString();
  }

  private formatearParaInputFecha(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  private obtenerFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
  }

  private desactivarCamposParaTecnico(): void {
    const controles = [
      'clienteId',
      'sucursalId',
      'fechaVisita',
      'horaLlegada',
      'horaSalida',
      'tecnicos',
      'titulo',
    ];
    controles.forEach((control) =>
      this.bitacoraForm.get(control)?.disable({ emitEvent: false })
    );
    this.bitacoraForm.get('descripcion')?.enable({ emitEvent: false });
  }

  private habilitarTodosLosControles(): void {
    Object.keys(this.bitacoraForm.controls).forEach((control) => {
      this.bitacoraForm.get(control)?.enable({ emitEvent: false });
    });
  }

  eliminarBitacora(evento: Event, bitacora: Bitacora): void {
    evento.stopPropagation();
    if (!this.esAdmin || !bitacora?.id || this.eliminandoBitacoraId === bitacora.id) {
      return;
    }

    const confirmado = confirm('Confirma eliminar esta bitacora?');
    if (!confirmado) {
      return;
    }

    this.errorMensaje = '';
    this.exitoMensaje = '';
    this.eliminandoBitacoraId = bitacora.id;
    const debeRetroceder = this.bitacoras.length === 1 && this.paginaActual > 1;

    this.apiService
      .eliminarBitacora(bitacora.id)
      .pipe(finalize(() => (this.eliminandoBitacoraId = null)))
      .subscribe({
        next: () => {
          if (debeRetroceder) {
            this.paginaActual -= 1;
          }
          if (this.bitacoraSeleccionada?.id === bitacora.id) {
            this.bitacoraSeleccionada = undefined;
          }
          this.exitoMensaje = 'Bitacora eliminada correctamente.';
          this.cargarBitacoras(false);
        },
        error: (error) => {
          console.error('Error al eliminar bitacora', error);
          this.errorMensaje =
            error?.error?.error ??
            'No fue posible eliminar la bitacora. Intenta nuevamente.';
        },
      });
  }
}
