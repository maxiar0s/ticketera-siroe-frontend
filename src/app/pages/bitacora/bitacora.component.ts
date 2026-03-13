import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Bitacora } from '../../interfaces/bitacora.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import { Tecnico } from '../../interfaces/tecnico.interface';
import { Proyecto } from '../../interfaces/proyecto.interface';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SignalService } from '../../services/signal.service';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

@Component({
  selector: 'app-bitacoras',
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
  private bitacoraDestinoId: number | null = null;

  clientes: ClienteResumen[] = [];
  sucursalesFiltro: SucursalOption[] = [];
  sucursalesFormulario: SucursalOption[] = [];
  private sucursalesCache = new Map<string, SucursalOption[]>();
  tecnicosDisponibles: Tecnico[] = [];
  proyectos: Proyecto[] = [];

  paginaActual = 1;
  paginasTotales = 0;
  limite = 10;

  cargando = false;
  guardando = false;
  errorMensaje = '';
  exitoMensaje = '';

  formularioVisible = false;
  modoEdicion = false;
  selectedIngresoFiles: File[] = [];
  eliminandoBitacoraId: number | null = null;
  tecnicosDropdownAbierto = false;
  detalleVisible = false;

  readonly esAdmin: boolean;
  readonly esTecnico: boolean;
  readonly esMesaAyuda: boolean;
  readonly esComercial: boolean;
  readonly esCliente: boolean;
  readonly puedeCrear: boolean;
  readonly soloLectura: boolean;
  readonly tituloModulo = 'Bitacoras';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private signalService: SignalService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.esAdmin = this.authService.esAdministrador();
    this.esTecnico = this.authService.esTecnico();
    this.esMesaAyuda = this.authService.esMesaAyuda();
    this.esComercial = this.authService.esComercial();
    this.esCliente = this.authService.esCliente();
    this.puedeCrear = this.esAdmin || this.esTecnico;
    this.soloLectura = this.esMesaAyuda || this.esCliente || this.esComercial;

    this.filtroForm = this.fb.group({
      clienteId: [''],
      sucursalId: [''],
      buscar: [''],
      proyectoId: [''],
    });

    this.bitacoraForm = this.fb.group(
      {
        id: [null],
        titulo: [''],
        clienteId: ['', Validators.required],
        sucursalId: [''],
        fechaVisita: ['', Validators.required],
        horaLlegada: ['', Validators.required],
        horaSalida: ['', Validators.required],
        tecnicos: [[], Validators.required],
        isEmergencia: [false],
        descripcion: ['', [Validators.required, Validators.minLength(5)]],
        proyectoId: [null],
      },
      { validators: this.dateRangeValidator }
    );
  }

  dateRangeValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const start = control.get('horaLlegada')?.value;
    const end = control.get('horaSalida')?.value;

    if (!start || !end) {
      return null;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      return { dateRangeInvalid: true };
    }

    return null;
  };

  ngOnInit(): void {
    this.signalService.updateData(this.tituloModulo);
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('bitacoraId');
      if (!idParam) {
        return;
      }
      const parsed = Number.parseInt(idParam, 10);
      if (!Number.isNaN(parsed)) {
        this.bitacoraDestinoId = parsed;
      }
    });

    this.cargarDatosIniciales();
  }

  private cargarDatosIniciales(): void {
    this.cargarClientes();
    this.cargarTecnicosDisponibles();
    this.cargarProyectos();
  }

  private cargarClientes(): void {
    this.apiService.clientesBitacora().subscribe({
      next: (clientes) => {
        this.clientes = Array.isArray(clientes) ? clientes : [];
        const clienteActual = this.filtroForm.value.clienteId;

        if (!clienteActual && this.clientes.length === 1) {
          const unico = this.clientes[0];
          this.filtroForm.patchValue(
            { clienteId: unico.id },
            { emitEvent: false }
          );
          this.cargarSucursalesParaCliente(unico.id, 'filtro');
        } else if (clienteActual) {
          this.cargarSucursalesParaCliente(clienteActual, 'filtro');
        }

        this.cargarBitacoras();
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.errorMensaje =
          error?.error?.error ??
          'No fue posible obtener el listado de clientes disponibles.';
        this.cargarBitacoras();
      },
    });
  }

  private cargarTecnicosDisponibles(): void {
    this.apiService.tecnicosDisponibles().subscribe({
      next: (tecnicos) => {
        this.tecnicosDisponibles = Array.isArray(tecnicos) ? tecnicos : [];
      },
      error: () => {
        this.tecnicosDisponibles = [];
      },
    });
  }

  private cargarProyectos(): void {
    this.apiService.getProyectos({ pagina: 1, limite: 100 }).subscribe({
      next: (respuesta) => {
        const lista = Array.isArray(respuesta?.data) ? respuesta.data : [];
        this.proyectos = lista;
      },
      error: (error) => {
        console.error('Error al cargar proyectos', error);
        this.proyectos = [];
      },
    });
  }

  buscarBitacoras(): void {
    this.paginaActual = 1;
    this.cargarBitacoras();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      clienteId:
        this.esCliente && this.clientes.length === 1 ? this.clientes[0].id : '',
      sucursalId: '',
      buscar: '',
      proyectoId: '',
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
    if (filtros.proyectoId) {
      if (filtros.proyectoId === 'sin-proyecto') {
        params['sinProyecto'] = 'true';
      } else {
        params['proyectoId'] = filtros.proyectoId;
      }
    }

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
          this.procesarBitacoraDestino();
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
    if (
      pagina < 1 ||
      pagina > this.paginasTotales ||
      pagina === this.paginaActual
    ) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarBitacoras();
  }

  private procesarBitacoraDestino(): void {
    if (!this.bitacoraDestinoId) {
      return;
    }
    const objetivo = this.bitacoras.find(
      (item: Bitacora) => item.id === this.bitacoraDestinoId
    );
    if (!objetivo) {
      return;
    }
    this.seleccionarBitacora(objetivo);
    this.bitacoraDestinoId = null;
    this.limpiarParametrosDestino();
  }

  private limpiarParametrosDestino(): void {
    this.router.navigate([], {
      queryParams: { bitacoraId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  seleccionarBitacora(bitacora: Bitacora): void {
    this.bitacoraSeleccionada = bitacora;
    this.detalleVisible = true;
  }

  cerrarDetalle(): void {
    this.detalleVisible = false;
    this.bitacoraSeleccionada = undefined;
  }

  puedeEditarBitacora(_bitacora: Bitacora): boolean {
    return this.esAdmin || this.esTecnico;
  }

  abrirFormularioCrear(): void {
    if (!this.puedeCrear) {
      return;
    }

    this.detalleVisible = false;
    this.bitacoraSeleccionada = undefined;
    this.habilitarTodosLosControles();
    const clienteId =
      this.filtroForm.value.clienteId ||
      (this.clientes.length === 1 ? this.clientes[0].id : '');

    this.selectedIngresoFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.bitacoraForm.reset({
      id: null,
      titulo: '',
      clienteId,
      sucursalId: '',
      fechaVisita: this.obtenerFechaActual(),
      horaLlegada: '',
      horaSalida: '',
      tecnicos: [],
      isEmergencia: false,
      descripcion: '',
      proyectoId: null,
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

    this.detalleVisible = false;
    this.habilitarTodosLosControles();
    this.selectedIngresoFiles = [];
    this.tecnicosDropdownAbierto = false;
    this.bitacoraForm.reset({
      id: bitacora.id,
      titulo: bitacora.titulo ?? '',
      clienteId: bitacora.casaMatrizId,
      sucursalId: bitacora.sucursalId ?? '',
      fechaVisita: bitacora.fechaVisita?.slice(0, 10) ?? '',
      horaLlegada: this.formatearParaInputFecha(bitacora.horaLlegada),
      horaSalida: this.formatearParaInputFecha(bitacora.horaSalida),
      tecnicos: Array.isArray(bitacora.tecnicos) ? [...bitacora.tecnicos] : [],
      isEmergencia: !!bitacora.isEmergencia,
      descripcion: bitacora.descripcion,
      proyectoId: bitacora.proyectoId ?? null,
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
  }

  cerrarFormulario(): void {
    this.formularioVisible = false;
    this.modoEdicion = false;
    this.guardando = false;
    this.bitacoraForm.reset({
      tecnicos: [],
      isEmergencia: false,
      proyectoId: null,
    });
    this.sucursalesFormulario = [];
    this.selectedIngresoFiles = [];
    this.tecnicosDropdownAbierto = false;
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
    const payload = this.construirPayload(formValue);
    if (!payload) {
      this.errorMensaje =
        'Debes ingresar todos los campos obligatorios de la visita.';
      return;
    }

    this.guardando = true;
    this.errorMensaje = '';

    const esEdicion = this.modoEdicion && formValue.id;
    let solicitud$;

    if (this.selectedIngresoFiles.length) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      this.selectedIngresoFiles.forEach((file) => {
        formData.append('files', file, file.name);
      });
      solicitud$ = esEdicion
        ? this.apiService.actualizarBitacora(formValue.id, formData)
        : this.apiService.crearBitacora(formData);
    } else {
      solicitud$ = esEdicion
        ? this.apiService.actualizarBitacora(formValue.id, payload)
        : this.apiService.crearBitacora(payload);
    }

    solicitud$.pipe(finalize(() => (this.guardando = false))).subscribe({
      next: (respuesta) => {
        this.exitoMensaje = esEdicion
          ? 'Bitacora actualizada correctamente.'
          : 'Bitacora registrada correctamente.';
        this.cerrarFormulario();
        if (esEdicion) {
          this.cargarBitacoras(false);
          this.refrescarBitacora(formValue.id);
        } else {
          this.paginaActual = 1;
          this.cargarBitacoras();
          if (respuesta?.id) {
            this.refrescarBitacora(respuesta.id);
          }
        }
      },
      error: (error) => {
        console.error('Error al guardar bitacora', error);
        this.errorMensaje =
          error?.error?.error ?? 'No se pudo guardar la bitacora.';
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) {
      return;
    }
    files.forEach((file) => this.selectedIngresoFiles.push(file));
    if (input) {
      input.value = '';
    }
  }

  removeSelectedFile(index: number): void {
    if (index >= 0 && index < this.selectedIngresoFiles.length) {
      this.selectedIngresoFiles.splice(index, 1);
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

  get tecnicosSeleccionados(): string[] {
    const value = this.bitacoraForm.get('tecnicos')?.value;
    return Array.isArray(value) ? value : [];
  }

  get resumenTecnicosSeleccionados(): string {
    const seleccionados = this.tecnicosSeleccionados;
    if (seleccionados.length === 0) {
      return 'Selecciona tecnicos';
    }
    if (seleccionados.length === 1) {
      return seleccionados[0];
    }
    return `${seleccionados.length} tecnicos seleccionados`;
  }

  toggleTecnicosDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.tecnicosDropdownAbierto = !this.tecnicosDropdownAbierto;
  }

  onToggleTecnico(tecnico: Tecnico, event?: MouseEvent): void {
    event?.stopPropagation();
    const actuales = this.tecnicosSeleccionados;
    const index = actuales.indexOf(tecnico.name);
    let actualizados: string[];
    if (index >= 0) {
      actualizados = [
        ...actuales.slice(0, index),
        ...actuales.slice(index + 1),
      ];
    } else {
      actualizados = [...actuales, tecnico.name];
    }
    this.bitacoraForm.get('tecnicos')?.setValue(actualizados);
    this.bitacoraForm.get('tecnicos')?.markAsDirty();
    this.bitacoraForm.get('tecnicos')?.markAsTouched();
  }

  estaTecnicoSeleccionado(tecnico: Tecnico): boolean {
    return this.tecnicosSeleccionados.includes(tecnico.name);
  }

  @HostListener('document:click')
  cerrarDropdowns(): void {
    if (this.tecnicosDropdownAbierto) {
      this.tecnicosDropdownAbierto = false;
    }
  }

  private construirPayload(formValue: any): any | null {
    const tecnicosEntrada = Array.isArray(formValue.tecnicos)
      ? formValue.tecnicos
      : [];
    const tecnicos = tecnicosEntrada
      .map((item: string) => `${item}`.trim())
      .filter((item: string) => item.length > 0);

    if (tecnicos.length === 0) {
      return null;
    }

    const horaLlegadaISO = this.formatearAISO(formValue.horaLlegada);
    const horaSalidaISO = this.formatearAISO(formValue.horaSalida);
    if (!horaLlegadaISO || !horaSalidaISO) {
      return null;
    }

    if (new Date(horaSalidaISO) <= new Date(horaLlegadaISO)) {
      return null;
    }

    let proyectoId: number | null = null;
    if (Object.prototype.hasOwnProperty.call(formValue, 'proyectoId')) {
      const valor = `${formValue.proyectoId ?? ''}`.trim();
      if (valor && valor.toLowerCase() !== 'null') {
        const parsed = Number(valor);
        if (!Number.isNaN(parsed)) {
          proyectoId = parsed;
        }
      }
    }

    return {
      casaMatrizId: formValue.clienteId,
      sucursalId: formValue.sucursalId || null,
      fechaVisita: formValue.fechaVisita,
      horaLlegada: horaLlegadaISO,
      horaSalida: horaSalidaISO,
      tecnicos,
      descripcion: formValue.descripcion.trim(),
      titulo: formValue.titulo ? formValue.titulo.trim() : null,
      isEmergencia: !!formValue.isEmergencia,
      proyectoId,
      tecnicosIds: this.obtenerIdsTecnicosSeleccionados(tecnicos),
    };
  }

  private obtenerIdsTecnicosSeleccionados(nombres: string[]): number[] {
    if (!Array.isArray(nombres) || nombres.length === 0) {
      return [];
    }

    const mapa = new Map<string, number>();
    this.tecnicosDisponibles.forEach((tecnico) => {
      const clave = (tecnico.name ?? '').trim().toLowerCase();
      if (clave) {
        mapa.set(clave, tecnico.id);
      }
    });

    const ids = nombres
      .map((nombre) => mapa.get(nombre.trim().toLowerCase()))
      .filter(
        (id): id is number => typeof id === 'number' && Number.isInteger(id)
      );

    return Array.from(new Set(ids));
  }

  private formatearAISO(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  private formatearParaInputFecha(value: string | null | undefined): string {
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

  private habilitarTodosLosControles(): void {
    Object.keys(this.bitacoraForm.controls).forEach((control) => {
      this.bitacoraForm.get(control)?.enable({ emitEvent: false });
    });
  }

  eliminarBitacora(evento: Event, bitacora: Bitacora): void {
    evento.stopPropagation();
    if (
      !this.esAdmin ||
      !bitacora?.id ||
      this.eliminandoBitacoraId === bitacora.id
    ) {
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

  private refrescarBitacora(id: number): void {
    if (!id) {
      return;
    }
    this.apiService.bitacora(id).subscribe({
      next: (detalle) => {
        if (!detalle) {
          return;
        }

        this.detalleVisible = true;
        this.bitacoraSeleccionada = detalle;
        this.actualizarBitacoraEnListado(detalle);
      },
      error: (error) => {
        console.error('Error al refrescar bitacora', error);
      },
    });
  }

  private actualizarBitacoraEnListado(detalle: Bitacora): void {
    if (!detalle?.id) {
      return;
    }
    this.bitacoras = this.bitacoras.map((item) =>
      item.id === detalle.id ? { ...item, ...detalle } : item
    );
  }

  downloadAdjunto(fileName: string): void {
    if (!fileName) {
      console.error('Nombre de archivo no proporcionado');
      return;
    }

    this.apiService.signedUrl(fileName).subscribe({
      next: (url) => {
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName.split('/').pop() || fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          console.error('URL firmada no disponible');
          this.errorMensaje =
            'No se pudo descargar el archivo. URL no disponible.';
        }
      },
      error: (err) => {
        console.error('Error al obtener URL firmada:', err);
        this.errorMensaje =
          'Error al descargar el archivo. Por favor, intenta nuevamente.';
      },
    });
  }
}
