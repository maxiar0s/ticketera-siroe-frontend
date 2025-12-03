import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CrearClienteComponent } from '../../shared/modal/cliente/crear-cliente/crear-cliente.component';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente.interface';
import { ClienteFiltros } from '../../interfaces/cliente-filtros.interface';
import { SignalService } from '../../services/signal.service';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { SignedUrlPipe } from '../../pipes/generar-url.pipe';
import { AuthService } from '../../services/auth.service';
import { TelefonoPipe } from '../../pipes/telefono.pipe';
import { RutPipe } from '../../pipes/rut.pipe';
import { OpcionesClienteComponent } from '../../shared/modal/cliente/opciones-cliente/opciones-cliente.component';
import { normalizarServicios } from '../../utils/servicios.util';
import { normalizarDatosBancarios } from '../../utils/datos-bancarios.util';
import { DatosBancariosClienteComponent } from '../../shared/modal/cliente/datos-bancarios/datos-bancarios.component';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MODULES } from '../../config/modules';

@Component({
  selector: 'clientes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CrearClienteComponent,
    NavegationComponent,
    SignedUrlPipe,
    TelefonoPipe,
    RutPipe,
    OpcionesClienteComponent,
    DatosBancariosClienteComponent,
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly cargarClientesTrigger$ = new Subject<{
    pagina: number;
    filtros: ClienteFiltros;
  }>();
  public esAdministrador: boolean = false;
  public esCliente: boolean = false;
  public esComercial: boolean = false;
  public sucursalEnabled: boolean = MODULES.sucursal;
  public filtroForm: FormGroup;
  public readonly serviciosDisponibles: string[] = [
    'Soporte TI',
    'Web',
    'Arriendo',
    'Camaras',
    'Redes Sociales',
    'Otros',
  ];

  // Elementos para el paginador
  public paginaActual: number = 1;
  public paginas: number = 1;

  public casasMatricez: Cliente[] | undefined = undefined;
  public obtainedClients: boolean = false;

  // Modal crear cliente
  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';
  public clienteParaEditar: Cliente | null = null;
  public modoEdicion: boolean = false;
  public filtrosVisibles = false;

  // Modal opciones cliente
  public isModalAjustesClienteVisible: boolean = false;
  public selectedClienteIndex: number = -1;
  public selectedCliente: Cliente | null = null;
  public mostrarModalDatosBancarios: boolean = false;
  public clienteConDatosBancarios: Cliente | null = null;

  constructor(
    private apiService: ApiService,
    private signalService: SignalService,
    public loaderService: LoaderService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      servicios: [[]],
      visitasMensualesMin: [''],
      visitasMensualesMax: [''],
      visitasEmergenciaMin: [''],
      visitasEmergenciaMax: [''],
      esLead: ['todos'],
      tieneDatosBancarios: ['todos'],
    });
  }

  ngOnInit(): void {
    this.signalService.updateData('Clientes');
    this.esAdministrador = this.authService.esAdministrador();
    this.esCliente = this.authService.esCliente();
    this.esComercial = this.authService.esComercial();
    this.inicializarCargaClientes();
    this.cargarClientes();
  }

  abrirModal() {
    this.isModalVisible = true;
    this.modoEdicion = false;
    this.clienteParaEditar = null;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.clienteParaEditar = null;
    this.modoEdicion = false;
  }

  // Métodos para el modal de opciones de cliente
  abrirModalAjustesCliente(index: number) {
    if (this.casasMatricez && this.casasMatricez.length > index) {
      this.selectedClienteIndex = index;
      this.selectedCliente = this.casasMatricez[index];
      this.isModalAjustesClienteVisible = true;
    }
  }

  cerrarModalAjustesCliente() {
    this.isModalAjustesClienteVisible = false;
    this.selectedClienteIndex = -1;
    this.selectedCliente = null;
  }
  //todo: Eliminar cliente
  eliminarCliente(id: string) {
    this.apiService.eliminarCliente(id).subscribe({
      next: (respuesta) => {
        console.log('Cliente eliminado exitosamente:', respuesta);
        this.cargarClientes(); // Recargar la lista de clientes
        this.cerrarModalAjustesCliente();
      },
      error: (error) => {
        console.error('Error al eliminar cliente:', error);
        // Podríamos mostrar un mensaje de error al usuario aquí
        // pero como estamos en un modal que se cierra, sería mejor usar un servicio de notificaciones
        // o un componente de toast para mostrar el error
        this.cerrarModalAjustesCliente();
      },
    });
  }

  //todo: Modificar cliente
  modificarCliente(cliente: Cliente) {
    // Abrir el modal en modo edición con los datos del cliente
    this.clienteParaEditar = cliente;
    this.modoEdicion = true;
    this.isModalVisible = true;
    this.cerrarModalAjustesCliente();
  }

  guardarCliente(datos: any) {
    if (this.modoEdicion && this.clienteParaEditar) {
      // Estamos en modo edición, llamar a modificarCliente
      this.apiService
        .modificarCliente(this.clienteParaEditar.id, datos)
        .subscribe({
          next: (respuesta) => {
            console.log('Cliente modificado exitosamente:', respuesta);
            this.successMessage = 'Cliente modificado exitosamente!';
            this.cargarClientes();
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al modificar cliente:', error);
            this.errorMessage =
              'Error al modificar cliente. Por favor, inténtalo de nuevo.';
            // No cerramos el modal para que el usuario pueda ver el mensaje de error
            // y volver a intentarlo si lo desea
          },
        });
    } else {
      // Estamos en modo creación, llamar a createClient
      this.apiService.createClient(datos).subscribe({
        next: (respuesta) => {
          console.log('Cliente creado exitosamente:', respuesta);
          this.successMessage = 'Cliente creado exitosamente!';
          this.cargarClientes();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al crear cliente:', error);
          this.errorMessage =
            'Error al crear cliente. Por favor, inténtalo de nuevo.';
          // No cerramos el modal para que el usuario pueda ver el mensaje de error
        },
      });
    }
  }

  crearCliente(datos: any) {
    this.guardarCliente(datos);
  }

  cargarClientes(): void {
    const filtros = this.obtenerFiltrosConsulta();
    this.cargarClientesTrigger$.next({ pagina: this.paginaActual, filtros });
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.paginaActual = pagina;
      this.cargarClientes();
    }
  }

  nextPage(): void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cargarClientes();
    }
  }

  prevPage(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cargarClientes();
    }
  }

  serviciosCliente(cliente?: Cliente | null): string {
    const servicios = normalizarServicios(cliente?.servicios);
    if (cliente?.esLead) {
      return servicios.length
        ? servicios.join(', ')
        : 'Lead sin servicios asignados';
    }
    if (!servicios.length) {
      return 'Sin servicios registrados';
    }
    return servicios.join(', ');
  }

  obtenerClaseVisitas(
    asignadas?: number | null,
    realizadas?: number | null
  ): string {
    const totalAsignadas = Number(asignadas ?? 0);
    const totalRealizadas = Number(realizadas ?? 0);

    if (totalRealizadas > totalAsignadas) {
      return 'visita-count-alert';
    }

    if (totalRealizadas === totalAsignadas) {
      return 'visita-count-ok';
    }

    return '';
  }

  get puedeVerDatosBancarios(): boolean {
    return this.esAdministrador || this.esComercial;
  }

  get puedeCrearClientes(): boolean {
    return this.esAdministrador || this.esComercial;
  }

  abrirModalDatosBancarios(cliente: Cliente): void {
    this.clienteConDatosBancarios = cliente;
    this.mostrarModalDatosBancarios = true;
  }

  cerrarModalDatosBancarios(): void {
    this.mostrarModalDatosBancarios = false;
    this.clienteConDatosBancarios = null;
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarClientes();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      servicios: [],
      visitasMensualesMin: '',
      visitasMensualesMax: '',
      visitasEmergenciaMin: '',
      visitasEmergenciaMax: '',
      esLead: 'todos',
      tieneDatosBancarios: 'todos',
    });
    this.aplicarFiltros();
  }

  toggleFiltroServicio(servicio: string): void {
    const control = this.filtroForm.get('servicios');
    if (!control) {
      return;
    }
    const actuales: string[] = Array.isArray(control.value)
      ? [...control.value]
      : [];
    const index = actuales.indexOf(servicio);
    if (index >= 0) {
      actuales.splice(index, 1);
    } else {
      actuales.push(servicio);
    }
    control.setValue(actuales);
  }

  servicioFiltroSeleccionado(servicio: string): boolean {
    const valores = this.filtroForm.get('servicios')?.value;
    return Array.isArray(valores) && valores.includes(servicio);
  }

  trackCliente = (_index: number, cliente: Cliente) => cliente.id;

  private obtenerFiltrosConsulta(): ClienteFiltros {
    const valores = this.filtroForm.getRawValue();
    const filtros: ClienteFiltros = {};

    if (Array.isArray(valores.servicios) && valores.servicios.length) {
      filtros.servicios = valores.servicios;
    }

    const visitasMensualesMin = this.sanitizarNumero(
      valores.visitasMensualesMin
    );
    const visitasMensualesMax = this.sanitizarNumero(
      valores.visitasMensualesMax
    );
    const visitasEmergenciaMin = this.sanitizarNumero(
      valores.visitasEmergenciaMin
    );
    const visitasEmergenciaMax = this.sanitizarNumero(
      valores.visitasEmergenciaMax
    );

    if (visitasMensualesMin !== null) {
      filtros.visitasMensualesMin = visitasMensualesMin;
    }
    if (visitasMensualesMax !== null) {
      filtros.visitasMensualesMax = visitasMensualesMax;
    }
    if (visitasEmergenciaMin !== null) {
      filtros.visitasEmergenciaMin = visitasEmergenciaMin;
    }
    if (visitasEmergenciaMax !== null) {
      filtros.visitasEmergenciaMax = visitasEmergenciaMax;
    }

    const esLead = this.parseBooleanSelect(valores.esLead);
    if (esLead !== null) {
      filtros.esLead = esLead;
    }

    const datosBancarios = this.parseBooleanSelect(valores.tieneDatosBancarios);
    if (datosBancarios !== null) {
      filtros.tieneDatosBancarios = datosBancarios;
    }

    return filtros;
  }

  private inicializarCargaClientes(): void {
    this.cargarClientesTrigger$
      .pipe(
        tap(() => {
          this.casasMatricez = undefined;
          this.obtainedClients = false;
          this.loaderService.showSection();
        }),
        switchMap(({ pagina, filtros }) =>
          this.apiService.clients(pagina, filtros).pipe(
            catchError((error) => {
              console.error('Error al cargar clientes:', error);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((respuesta) => {
        this.loaderService.hideSection();
        this.obtainedClients = true;

        if (!respuesta) {
          this.casasMatricez = [];
          this.paginas = 1;
          this.cdr.markForCheck();
          return;
        }

        const { paginas, clientes } = respuesta;
        this.casasMatricez = (clientes ?? []).map(
          (
            cliente: Cliente & { servicios?: unknown; datosBancarios?: unknown }
          ) => ({
            ...cliente,
            servicios: normalizarServicios(cliente.servicios),
            datosBancarios: normalizarDatosBancarios(cliente.datosBancarios),
          })
        );
        this.paginas = paginas ?? 1;
        this.cdr.markForCheck();
      });
  }

  private parseBooleanSelect(valor: unknown): boolean | null {
    const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
    if (texto === 'true') {
      return true;
    }
    if (texto === 'false') {
      return false;
    }
    return null;
  }

  private sanitizarNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined || `${valor}`.trim() === '') {
      return null;
    }
    const numero = Number.parseInt(`${valor}`.trim(), 10);
    return Number.isNaN(numero) ? null : numero;
  }
}
