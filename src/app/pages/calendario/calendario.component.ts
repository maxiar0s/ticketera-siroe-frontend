import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { Bitacora } from '../../interfaces/bitacora.interface';
import { DashboardCalendarComponent } from './components/dashboard-calendar.component';
import { ApiService } from '../../services/api.service';
import { SignalService } from '../../services/signal.service';
import { SimpleBarChartComponent } from '../../shared/charts/simple-bar-chart.component';

interface ChartPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardCalendarComponent,
    SimpleBarChartComponent,
  ],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css',
})
export class CalendarioComponent implements OnInit {
  readonly tituloModulo = 'Calendario';
  readonly tipoOpciones = [
    { value: 'todos', label: 'Todos' },
    { value: 'visitas', label: 'Visitas' },
    { value: 'emergencias', label: 'Emergencias' },
    { value: 'programadas', label: 'Programadas' },
  ];

  filtrosForm: FormGroup;

  todasLasBitacoras: Bitacora[] = [];
  bitacoras: Bitacora[] = [];
  cargando = false;
  errorMensaje = '';

  clientesFiltro: Array<{ id: string; nombre: string }> = [];
  tecnicosFiltro: string[] = [];
  filtrosActuales = {
    cliente: '',
    tecnico: '',
    tipo: 'todos',
    periodo: '',
    buscar: '',
  };

  visitasPorMesData: ChartPoint[] = [];
  visitasPorClienteData: ChartPoint[] = [];
  actividadPorCategoriaData: ChartPoint[] = [];

  resumen = {
    totalVisitas: 0,
    visitasMesActual: 0,
    emergencias: 0,
    clientesActivos: 0,
  };

  private readonly mesesCortos = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  private readonly maxClientesEnGrafico = 8;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private signalService: SignalService,
  ) {
    this.filtrosForm = this.fb.group({
      cliente: [''],
      tecnico: [''],
      tipo: ['todos'],
      periodo: [''],
      buscar: [''],
    });
  }

  ngOnInit(): void {
    this.signalService.updateData(this.tituloModulo);
    this.filtrosForm.valueChanges.subscribe((valores) => {
      this.filtrosActuales = {
        cliente: `${valores['cliente'] ?? ''}`,
        tecnico: `${valores['tecnico'] ?? ''}`,
        tipo: `${valores['tipo'] ?? 'todos'}`,
        periodo: `${valores['periodo'] ?? ''}`,
        buscar: `${valores['buscar'] ?? ''}`,
      };
      this.aplicarFiltros();
    });
    this.cargarBitacoras();
  }

  onRefreshRequested(): void {
    this.cargarBitacoras();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      cliente: '',
      tecnico: '',
      tipo: 'todos',
      periodo: '',
      buscar: '',
    });
  }

  private cargarBitacoras(): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.obtenerTodasLasBitacoras().subscribe({
      next: (bitacoras) => {
        this.todasLasBitacoras = bitacoras;
        this.actualizarOpcionesFiltros(bitacoras);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del calendario', error);
        this.todasLasBitacoras = [];
        this.bitacoras = [];
        this.procesarResumen([]);
        this.cargando = false;
        this.errorMensaje =
          error?.error?.error ?? 'No fue posible cargar las visitas del calendario.';
      },
    });
  }

  private obtenerTodasLasBitacoras() {
    const parametrosBase = { pagina: 1, limite: 200 };

    return this.apiService.bitacoras(parametrosBase).pipe(
      switchMap((respuesta) => {
        const bitacorasIniciales: Bitacora[] = respuesta?.data ?? [];
        const paginasTotales = respuesta?.paginasTotales ?? 1;

        if (!paginasTotales || paginasTotales <= 1) {
          return of(bitacorasIniciales);
        }

        const peticiones = [];
        for (let pagina = 2; pagina <= paginasTotales; pagina++) {
          peticiones.push(this.apiService.bitacoras({ ...parametrosBase, pagina }));
        }

        if (!peticiones.length) {
          return of(bitacorasIniciales);
        }

        return forkJoin(peticiones).pipe(
          map((respuestas) => {
            const acumulado = [...bitacorasIniciales];
            respuestas.forEach((res) => {
              const listado: Bitacora[] = res?.data ?? [];
              acumulado.push(...listado);
            });
            return acumulado;
          }),
        );
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  private aplicarFiltros(): void {
    const filtros = this.filtrosActuales;
    const texto = filtros.buscar.trim().toLowerCase();

    this.bitacoras = this.todasLasBitacoras.filter((bitacora) => {
      if (filtros.cliente && this.obtenerClienteId(bitacora) !== filtros.cliente) {
        return false;
      }

      if (
        filtros.tecnico &&
        !bitacora.tecnicos.some((tecnico) => tecnico === filtros.tecnico)
      ) {
        return false;
      }

      if (!this.coincideTipoBitacora(bitacora, filtros.tipo)) {
        return false;
      }

      if (!this.coincidePeriodo(this.obtenerFechaValida(bitacora), filtros.periodo)) {
        return false;
      }

      if (texto && !this.coincideBusqueda(bitacora, texto)) {
        return false;
      }

      return true;
    });

    this.procesarResumen(this.bitacoras);
  }

  private actualizarOpcionesFiltros(bitacoras: Bitacora[]): void {
    const clientesMap = new Map<string, string>();
    const tecnicos = new Set<string>();

    bitacoras.forEach((bitacora) => {
      const clienteId = this.obtenerClienteId(bitacora);
      const clienteNombre = bitacora.casaMatriz?.razonSocial?.trim();
      if (clienteId && clienteNombre) {
        clientesMap.set(clienteId, clienteNombre);
      }

      bitacora.tecnicos.forEach((tecnico) => {
        const nombre = tecnico.trim();
        if (nombre) {
          tecnicos.add(nombre);
        }
      });
    });

    this.clientesFiltro = Array.from(clientesMap.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.tecnicosFiltro = Array.from(tecnicos).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private procesarResumen(bitacoras: Bitacora[]): void {
    const visitas = bitacoras.filter((bitacora) => !bitacora.esTicket);
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth();
    const visitasMesActual = visitas.filter((bitacora) => {
      const fecha = this.obtenerFechaValida(bitacora);
      return (
        !!fecha &&
        fecha.getFullYear() === anioActual &&
        fecha.getMonth() === mesActual
      );
    }).length;

    const clientesActivos = new Set(
      visitas
        .map((bitacora) => bitacora.casaMatriz?.razonSocial?.trim())
        .filter((valor): valor is string => !!valor),
    );

    this.resumen = {
      totalVisitas: visitas.length,
      visitasMesActual,
      emergencias: visitas.filter((bitacora) => !!bitacora.isEmergencia).length,
      clientesActivos: clientesActivos.size,
    };

    this.visitasPorMesData = this.construirVisitasPorMes(visitas);
    this.visitasPorClienteData = this.construirVisitasPorCliente(visitas);
    this.actividadPorCategoriaData = this.construirActividadPorCategoria(visitas);
  }

  private construirVisitasPorMes(bitacoras: Bitacora[]): ChartPoint[] {
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
    const conteo = new Map<string, number>();

    bitacoras.forEach((bitacora) => {
      const fecha = this.obtenerFechaValida(bitacora);
      if (!fecha || fecha < inicio) {
        return;
      }

      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    });

    const datos: ChartPoint[] = [];
    for (let offset = 11; offset >= 0; offset--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - offset, 1);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      datos.push({
        label: this.mesesCortos[fecha.getMonth()] ?? '',
        value: conteo.get(clave) ?? 0,
      });
    }

    return datos;
  }

  private construirVisitasPorCliente(bitacoras: Bitacora[]): ChartPoint[] {
    const conteo = new Map<string, number>();

    bitacoras.forEach((bitacora) => {
      const label = bitacora.casaMatriz?.razonSocial?.trim() || 'Sin cliente';
      conteo.set(label, (conteo.get(label) ?? 0) + 1);
    });

    return Array.from(conteo.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, this.maxClientesEnGrafico)
      .map(([label, value]) => ({ label, value }));
  }

  private construirActividadPorCategoria(bitacoras: Bitacora[]): ChartPoint[] {
    const emergencias = bitacoras.filter((bitacora) => !!bitacora.isEmergencia).length;
    const regulares = bitacoras.filter((bitacora) => !bitacora.isEmergencia).length;

    return [
      { label: 'Visitas regulares', value: regulares },
      { label: 'Emergencias', value: emergencias },
    ];
  }

  private obtenerClienteId(bitacora: Bitacora): string {
    return `${bitacora.casaMatriz?.id ?? bitacora.casaMatrizId ?? ''}`;
  }

  private coincideTipoBitacora(bitacora: Bitacora, tipo: string): boolean {
    switch (tipo) {
      case 'visitas':
        return !bitacora.esTicket;
      case 'emergencias':
        return !bitacora.esTicket && !!bitacora.isEmergencia;
      case 'programadas':
        return false;
      default:
        return true;
    }
  }

  private coincidePeriodo(fecha: Date | null, periodo: string): boolean {
    if (!periodo) {
      return true;
    }

    if (!fecha) {
      return false;
    }

    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}` === periodo;
  }

  private coincideBusqueda(bitacora: Bitacora, texto: string): boolean {
    const campos = [
      bitacora.titulo,
      bitacora.descripcion,
      bitacora.casaMatriz?.razonSocial,
      bitacora.sucursal?.sucursal,
      bitacora.tecnicos.join(' '),
    ];

    return campos.some((valor) => `${valor ?? ''}`.toLowerCase().includes(texto));
  }

  private obtenerFechaValida(bitacora: Bitacora): Date | null {
    const origen = bitacora.fechaVisita ?? bitacora.createdAt ?? bitacora.updatedAt;
    if (!origen) {
      return null;
    }

    const fecha = new Date(origen);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
}
