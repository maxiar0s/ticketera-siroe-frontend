import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { SignedUrlPipe } from '../../pipes/generar-url.pipe';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SignalService } from '../../services/signal.service';
import { Proyecto, ProyectoAdjunto } from '../../interfaces/proyecto.interface';
import { Cuenta } from '../../interfaces/Cuenta.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import { Tecnico } from '../../interfaces/tecnico.interface';
import { Bitacora } from '../../interfaces/bitacora.interface';

interface ProyectoFormulario {
  id: FormControl<number | null>;
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  encargadoIds: FormControl<number[]>;
  fechaInicio: FormControl<string>;
  fechaTermino: FormControl<string>;
  eliminarFoto: FormControl<boolean>;
}

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormatoFechaPipe,
    SignedUrlPipe,
  ],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.css',
})
export class ProyectosComponent implements OnInit {
  proyectos: Proyecto[] = [];
  proyectosCargando = false;
  proyectosPagina = 1;
  proyectosPaginasTotales = 0;
  proyectosLimite = 10;
  proyectosBuscar = '';

  selectedProyecto: Proyecto | null = null;

  tecnicos: Tecnico[] = [];

  proyectoForm: FormGroup<ProyectoFormulario>;
  guardandoProyecto = false;
  fotoPortadaFile: File | null = null;

  bitacorasDisponibles: Bitacora[] = [];
  buscandoBitacoras = false;
  bitacorasPagina = 1;
  bitacorasLimite = 20;
  bitacoraFiltroForm: FormGroup;
  clientesFiltro: ClienteResumen[] = [];
  sucursalesFiltro: SucursalOption[] = [];
  filtroTipoOpciones = [
    { value: 'ambos', label: 'Ambos' },
    { value: 'bitacora', label: 'Bitacora' },
    { value: 'ticket', label: 'Ticket' },
  ] as const;
  bitacorasFiltroAplicado = false;
  proyectosFiltro: Proyecto[] = [];
  private sucursalesFiltroCache = new Map<string, SucursalOption[]>();
  readonly puedeGestionarProyectos: boolean;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private signalService: SignalService
  ) {
    this.puedeGestionarProyectos =
      this.authService.esAdministrador() ||
      this.authService.esTecnico() ||
      this.authService.esMesaAyuda();
    this.proyectoForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      nombre: this.fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      descripcion: this.fb.nonNullable.control(''),
      encargadoIds: this.fb.nonNullable.control<number[]>([]),
      fechaInicio: this.fb.nonNullable.control(''),
      fechaTermino: this.fb.nonNullable.control(''),
      eliminarFoto: this.fb.nonNullable.control(false),
    });

    this.bitacoraFiltroForm = this.fb.group({
      clienteId: [''],
      sucursalId: [''],
      tipo: ['ambos'],
      proyectoId: [''],
      buscar: [''],
    });

    if (!this.puedeGestionarProyectos) {
      this.proyectoForm.disable({ emitEvent: false });
    }
  }

  ngOnInit(): void {
    this.signalService.updateData('Proyectos');
    this.cargarTecnicos();
    this.cargarProyectos();
    this.cargarClientesFiltro();
    this.cargarProyectosFiltroOpciones();
  }

  get proyectoSeleccionadoTieneFoto(): boolean {
    return !!this.selectedProyecto?.fotoPortada;
  }

  get encargadosSeleccionados(): number[] {
    const value = this.proyectoForm.get('encargadoIds')?.value;
    return Array.isArray(value) ? value : [];
  }

  private cargarClientesFiltro(): void {
    this.apiService.clientesBitacora().subscribe({
      next: (clientes) => {
        this.clientesFiltro = Array.isArray(clientes) ? clientes : [];
        const clienteActual = this.bitacoraFiltroForm.get('clienteId')?.value;
        if (clienteActual) {
          this.cargarSucursalesFiltro(clienteActual);
        } else if (this.clientesFiltro.length === 1) {
          const unico = this.clientesFiltro[0];
          this.bitacoraFiltroForm.patchValue({ clienteId: unico.id }, { emitEvent: false });
          this.cargarSucursalesFiltro(unico.id);
        }
      },
      error: (error) => {
        console.error('Error al cargar clientes para filtros de proyectos', error);
        this.clientesFiltro = [];
      },
    });
  }

  private cargarProyectosFiltroOpciones(): void {
    this.apiService
      .getProyectos({ pagina: 1, limite: 100 })
      .subscribe({
        next: (respuesta) => {
          const lista = Array.isArray(respuesta?.data) ? respuesta.data : [];
          this.proyectosFiltro = lista;
        },
        error: (error) => {
          console.error('Error al cargar proyectos para filtro', error);
          this.proyectosFiltro = [];
        },
      });
  }

  private cargarSucursalesFiltro(clienteId: string): void {
    if (!clienteId) {
      this.sucursalesFiltro = [];
      return;
    }

    if (this.sucursalesFiltroCache.has(clienteId)) {
      this.sucursalesFiltro = this.sucursalesFiltroCache.get(clienteId) ?? [];
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
        this.sucursalesFiltroCache.set(clienteId, opciones);
        this.sucursalesFiltro = opciones;
      },
      error: (error) => {
        console.error('Error al cargar sucursales para filtros', error);
        this.sucursalesFiltroCache.delete(clienteId);
        this.sucursalesFiltro = [];
      },
    });
  }

  estaEncargadoSeleccionado(encargadoId: number): boolean {
    return this.encargadosSeleccionados.includes(encargadoId);
  }

  toggleEncargado(encargadoId: number, checked: boolean): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    const control = this.proyectoForm.get('encargadoIds');
    if (!control) {
      return;
    }

    const seleccionados = new Set(this.encargadosSeleccionados);
    if (checked) {
      seleccionados.add(encargadoId);
    } else {
      seleccionados.delete(encargadoId);
    }

    control.setValue(Array.from(seleccionados));
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  aplicarFiltrosBitacoras(pagina: number = 1): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    this.bitacorasFiltroAplicado = true;
    this.bitacorasPagina = pagina;
    this.buscarBitacorasDisponibles(pagina);
  }

  mostrarTodasBitacoras(): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    this.bitacorasFiltroAplicado = true;
    this.bitacorasPagina = 1;
    this.buscarBitacorasDisponibles(1);
  }

  limpiarFiltrosBitacoras(): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    this.bitacoraFiltroForm.reset({
      clienteId: '',
      sucursalId: '',
      tipo: 'ambos',
      proyectoId: '',
      buscar: '',
    });
    this.sucursalesFiltro = [];
    this.bitacorasFiltroAplicado = false;
    this.bitacorasDisponibles = [];
    this.bitacorasPagina = 1;
  }

  onFiltroClienteChange(clienteId: string): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    this.bitacoraFiltroForm.patchValue({ sucursalId: '' }, { emitEvent: false });
    this.cargarSucursalesFiltro(clienteId);
  }

  cargarProyectos(pagina: number = 1): void {
    this.proyectosCargando = true;
    this.apiService
      .getProyectos({
        pagina,
        limite: this.proyectosLimite,
        buscar: this.proyectosBuscar,
      })
      .pipe(finalize(() => (this.proyectosCargando = false)))
      .subscribe({
        next: (respuesta) => {
          const proyectosData = (Array.isArray(respuesta?.data)
            ? respuesta.data
            : []) as Proyecto[];
          const normalizados = proyectosData
            .map((item) => this.normalizarProyecto(item))
            .filter((item): item is Proyecto => !!item);

          this.proyectos = normalizados;
          this.proyectosPagina = respuesta?.pagina ?? pagina;
          this.proyectosPaginasTotales = respuesta?.paginasTotales ?? 0;

          if (this.selectedProyecto) {
            const sincronizado = normalizados.find(
              (proyectoItem) => proyectoItem.id === this.selectedProyecto?.id
            );
            if (sincronizado) {
              this.seleccionarProyecto(sincronizado, false);
            }
          }
        },
        error: (error) => {
          console.error('Error al obtener proyectos', error);
          this.proyectos = [];
          this.proyectosPaginasTotales = 0;
        },
      });
  }

  private cargarTecnicos(): void {
    const rolesPermitidos = new Set(['administrador', 'tecnico de soporte', 'mesa de ayuda']);
    const normalizar = (valor: string | undefined): string =>
      (valor ?? '')
        .toLowerCase()
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u');

    const recolectados: Cuenta[] = [];

    const cargarSoloTecnicos = (): void => {
      this.apiService.tecnicosDisponibles().subscribe({
        next: (tecnicos) => {
          this.tecnicos = Array.isArray(tecnicos) ? tecnicos : [];
        },
        error: (errorTec) => {
          console.error('Error al obtener tecnicos', errorTec);
          this.tecnicos = [];
        },
      });
    };

    const obtenerPagina = (pagina: number): void => {
      this.apiService.users(pagina, 'Todos los ingresos').subscribe({
        next: (respuesta) => {
          const cuentas = Array.isArray(respuesta?.cuentas)
            ? (respuesta.cuentas as Cuenta[])
            : [];
          recolectados.push(...cuentas);

          const paginasTotales =
            typeof respuesta?.paginas === 'number' && respuesta.paginas > 0
              ? respuesta.paginas
              : pagina;

          if (pagina < paginasTotales) {
            obtenerPagina(pagina + 1);
            return;
          }

          const mapa = new Map<number, Tecnico>();
          recolectados.forEach((cuenta) => {
            if (!cuenta || typeof cuenta.id !== 'number') {
              return;
            }
            const rolNormalizado = normalizar(cuenta?.tipoCuenta?.name);
            if (!rolesPermitidos.has(rolNormalizado)) {
              return;
            }
            mapa.set(cuenta.id, {
              id: cuenta.id,
              name: cuenta.name ?? '',
              email: cuenta.email ?? '',
              tipoCuentaId: cuenta.tipoCuentaId ?? 0,
              esTecnico: rolNormalizado === 'tecnico de soporte',
            });
          });

          this.tecnicos = Array.from(mapa.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          if (this.tecnicos.length === 0) {
            cargarSoloTecnicos();
          }
        },
        error: (error) => {
          console.error('Error al obtener usuarios para encargados', error);
          cargarSoloTecnicos();
        },
      });
    };

    obtenerPagina(1);
  }

  seleccionarProyecto(proyecto: Proyecto, cargarDetalle: boolean = true): void {
    const normalizado = this.normalizarProyecto(proyecto);
    if (!normalizado) {
      return;
    }

    this.selectedProyecto = normalizado;
    this.proyectoForm.reset({
      id: normalizado.id,
      nombre: normalizado.nombre ?? '',
      descripcion: normalizado.descripcion ?? '',
      encargadoIds: normalizado.encargadoIds,
      fechaInicio: normalizado.fechaInicio ?? '',
      fechaTermino: normalizado.fechaTermino ?? '',
      eliminarFoto: false,
    });
    this.fotoPortadaFile = null;

    if (cargarDetalle) {
      this.cargarDetalleProyecto(normalizado.id);
    }
  }

  nuevoProyecto(): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    this.selectedProyecto = null;
    this.proyectoForm.reset({
      id: null,
      nombre: '',
      descripcion: '',
      encargadoIds: [],
      fechaInicio: '',
      fechaTermino: '',
      eliminarFoto: false,
    });
    this.fotoPortadaFile = null;
  }

  buscarProyectos(): void {
    this.proyectosPagina = 1;
    this.cargarProyectos(this.proyectosPagina);
  }

  cambiarPaginaProyectos(pagina: number): void {
    if (
      pagina < 1 ||
      pagina === this.proyectosPagina ||
      (this.proyectosPaginasTotales && pagina > this.proyectosPaginasTotales)
    ) {
      return;
    }
    this.proyectosPagina = pagina;
    this.cargarProyectos(pagina);
  }

  onFotoPortadaSeleccionada(event: Event): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.fotoPortadaFile = null;
      return;
    }
    this.fotoPortadaFile = input.files[0];
  }

  guardarProyecto(): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (this.proyectoForm.invalid) {
      this.proyectoForm.markAllAsTouched();
      return;
    }

    const valor = this.proyectoForm.value;
    const esEdicion = !!valor.id;

    const formData = new FormData();
    formData.append('nombre', valor.nombre!.trim());
    formData.append('descripcion', (valor.descripcion ?? '').trim());
    formData.append('encargados', JSON.stringify(valor.encargadoIds ?? []));
    if (valor.fechaInicio) {
      formData.append('fechaInicio', valor.fechaInicio);
    }
    if (valor.fechaTermino) {
      formData.append('fechaTermino', valor.fechaTermino);
    }
    if (valor.eliminarFoto) {
      formData.append('eliminarFoto', 'true');
    }
    if (this.fotoPortadaFile) {
      formData.append('foto', this.fotoPortadaFile);
    }

    this.guardandoProyecto = true;
    const solicitud$ = esEdicion
      ? this.apiService.actualizarProyecto(valor.id!, formData)
      : this.apiService.crearProyecto(formData);

    solicitud$
      .pipe(finalize(() => (this.guardandoProyecto = false)))
      .subscribe({
        next: (respuesta) => {
          if (respuesta) {
            this.cargarProyectos(this.proyectosPagina);
            this.cargarDetalleProyecto(respuesta.id ?? valor.id ?? null);
          } else {
            this.cargarProyectos(this.proyectosPagina);
          }
          this.fotoPortadaFile = null;
        },
        error: (error) => {
          console.error('Error al guardar proyecto', error);
        },
      });
  }

  eliminarProyecto(proyecto: Proyecto): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (!proyecto || !proyecto.id) {
      return;
    }
    const confirmar = confirm(
      `Confirma eliminar el proyecto "${proyecto.nombre}"?`
    );
    if (!confirmar) {
      return;
    }

    this.apiService.eliminarProyecto(proyecto.id).subscribe({
      next: () => {
        if (this.selectedProyecto?.id === proyecto.id) {
          this.selectedProyecto = null;
        }
        this.cargarProyectos(this.proyectosPagina);
      },
      error: (error) => {
        console.error('Error al eliminar proyecto', error);
      },
    });
  }

  subirAdjuntos(event: Event): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (!this.selectedProyecto?.id) {
      return;
    }
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const formData = new FormData();
    Array.from(input.files).forEach((file) => {
      formData.append('archivos', file);
    });

    this.apiService
      .agregarAdjuntosProyecto(this.selectedProyecto.id, formData)
      .subscribe({
        next: () => {
          this.cargarDetalleProyecto(this.selectedProyecto!.id);
          input.value = '';
        },
        error: (error) => {
          console.error('Error al subir adjuntos', error);
        },
      });
  }

  eliminarAdjunto(adjunto: ProyectoAdjunto): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (!this.selectedProyecto?.id || !adjunto?.id) {
      return;
    }
    const confirmar = confirm('Desea eliminar este adjunto?');
    if (!confirmar) {
      return;
    }

    this.apiService
      .eliminarProyectoAdjunto(this.selectedProyecto.id, adjunto.id)
      .subscribe({
        next: () => this.cargarDetalleProyecto(this.selectedProyecto!.id),
        error: (error) => {
          console.error('Error al eliminar adjunto', error);
        },
      });
  }

  buscarBitacorasDisponibles(pagina: number = 1): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (!this.bitacorasFiltroAplicado) {
      return;
    }
    const params = this.construirParametrosBitacoras(pagina);
    this.buscandoBitacoras = true;
    this.apiService
      .bitacoras(params)
      .pipe(finalize(() => (this.buscandoBitacoras = false)))
      .subscribe({
        next: (respuesta) => {
          this.bitacorasDisponibles = Array.isArray(respuesta?.data)
            ? respuesta.data
            : [];
          this.bitacorasPagina = respuesta?.pagina ?? pagina;
        },
        error: (error) => {
          console.error('Error al cargar bitacoras disponibles', error);
          this.bitacorasDisponibles = [];
        },
      });
  }

  private construirParametrosBitacoras(pagina: number): Record<string, any> {
    const { clienteId, sucursalId, tipo, proyectoId, buscar } =
      this.bitacoraFiltroForm.value;

    const params: Record<string, any> = {
      pagina,
      limite: this.bitacorasLimite,
    };

    if (buscar && `${buscar}`.trim() !== '') {
      params['buscar'] = `${buscar}`.trim();
    }

    if (clienteId) {
      params['clienteId'] = clienteId;
    }

    if (sucursalId) {
      params['sucursalId'] = sucursalId;
    }

    if (tipo && tipo !== 'ambos') {
      params['tipo'] = tipo;
    } else {
      params['tipo'] = 'ambos';
    }

    let aplicarSinProyecto = true;
    if (proyectoId) {
      if (proyectoId === 'sin-proyecto') {
        params['sinProyecto'] = 'true';
      } else {
        params['proyectoId'] = proyectoId;
        aplicarSinProyecto = false;
      }
    }

    if (aplicarSinProyecto && !params['sinProyecto']) {
      params['sinProyecto'] = 'true';
    }

    return params;
  }

  asignarBitacora(bitacora: Bitacora): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (!this.selectedProyecto?.id || !bitacora?.id) {
      return;
    }
    this.apiService
      .asignarBitacorasAProyecto(this.selectedProyecto.id, {
        bitacoraIds: [bitacora.id],
      })
      .subscribe({
        next: () => {
          this.cargarDetalleProyecto(this.selectedProyecto!.id);
          if (this.bitacorasFiltroAplicado) {
            this.buscarBitacorasDisponibles(this.bitacorasPagina);
          }
        },
        error: (error) => {
          console.error('Error al asignar bitacora', error);
        },
      });
  }

  removerBitacora(bitacora: Bitacora): void {
    if (!this.puedeGestionarProyectos) {
      return;
    }
    if (!this.selectedProyecto?.id || !bitacora?.id) {
      return;
    }
    const confirmar = confirm(
      'Desea remover esta bitacora/ticket del proyecto?'
    );
    if (!confirmar) {
      return;
    }
    this.apiService
      .removerBitacoraDeProyecto(this.selectedProyecto.id, bitacora.id)
      .subscribe({
        next: () => {
          this.cargarDetalleProyecto(this.selectedProyecto!.id);
          if (this.bitacorasFiltroAplicado) {
            this.buscarBitacorasDisponibles(this.bitacorasPagina);
          }
        },
        error: (error) => {
          console.error('Error al remover bitacora', error);
        },
      });
  }

  private cargarDetalleProyecto(id: number | null | undefined): void {
    if (!id) {
      return;
    }

    this.apiService.getProyecto(id).subscribe({
      next: (detalle) => {
        const normalizado = this.normalizarProyecto(detalle);
        if (!normalizado) {
          return;
        }
        this.selectedProyecto = normalizado;
        this.proyectoForm.patchValue({
          id: normalizado.id ?? null,
          nombre: normalizado.nombre ?? '',
          descripcion: normalizado.descripcion ?? '',
          encargadoIds: normalizado.encargadoIds,
          fechaInicio: normalizado.fechaInicio ?? '',
          fechaTermino: normalizado.fechaTermino ?? '',
          eliminarFoto: false,
        });
      },
      error: (error) => {
        console.error('Error al cargar detalle del proyecto', error);
      },
    });
  }

  abrirAdjunto(adjunto: ProyectoAdjunto): void {
    this.abrirArchivo(adjunto?.archivo);
  }

  abrirFotoPortada(): void {
    this.abrirArchivo(this.selectedProyecto?.fotoPortada);
  }

  private abrirArchivo(nombre: string | null | undefined): void {
    if (!nombre) {
      return;
    }

    this.apiService.signedUrl(nombre).subscribe({
      next: (url) => {
        if (url) {
          window.open(url, '_blank', 'noopener');
        }
      },
      error: (error) => {
        console.error('Error al obtener enlace del archivo', error);
      },
    });
  }

  private normalizarProyecto(
    proyecto: Proyecto | null | undefined
  ): Proyecto | null {
    if (!proyecto) {
      return null;
    }

    return {
      ...proyecto,
      encargadoIds: Array.isArray(proyecto.encargadoIds)
        ? proyecto.encargadoIds
        : [],
      encargados: Array.isArray(proyecto.encargados)
        ? proyecto.encargados
        : [],
      adjuntos: Array.isArray(proyecto.adjuntos) ? proyecto.adjuntos : [],
      bitacoras: Array.isArray(proyecto.bitacoras) ? proyecto.bitacoras : [],
      totalBitacoras:
        typeof proyecto.totalBitacoras === 'number'
          ? proyecto.totalBitacoras
          : 0,
      totalTickets:
        typeof proyecto.totalTickets === 'number'
          ? proyecto.totalTickets
          : 0,
    };
  }
}
