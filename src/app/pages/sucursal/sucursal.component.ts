import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { TableComponent } from './table/table.component';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../interfaces/Sucursal.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonsComponent } from './options/options.component';
import { OptionsComponent } from '../../shared/options/options.component';
import { ImprimirEquipo } from '../../interfaces/ImprimirEquipo.interface';
import { Equipo } from '../../interfaces/equipo.interface';
import { EstadoEquipo } from '../../interfaces/estado-equipo.interface';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { forkJoin, of } from 'rxjs';
import * as XLSX from 'xlsx';
import { EquiposFiltersComponent } from './filters/filters.component';
import { EquipoFiltros } from '../../interfaces/equipo-filtros.interface';

@Component({
  selector: 'sucursal',
  standalone: true,
  imports: [
    HeaderComponent,
    TableComponent,
    CommonModule,
    ButtonsComponent,
    OptionsComponent,
    EquiposFiltersComponent,
    NavegationComponent,
  ],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent {
  // Elementos para el paginador
  public paginaActual:        number = 1;
  public paginas:             number = 1;
  // Filtro de equipos
  public option!:             string;
  // Arreglo de los equipos
  public sucursal?:           Sucursal;
  public equipos:             Equipo[] | undefined = undefined;
  public obtainedEquipments:  boolean = false;
  public estado:              boolean = false;
  public Title:               boolean = false;
  public cerrarModal!:        boolean;

  public Devices:       ImprimirEquipo[] = [];
  public filtrosEquipos: EquipoFiltros = {};
  private estadosEquipoCache: EstadoEquipo[] = [];

  constructor(
    private apiService:     ApiService,
    private signalService:  SignalService,
    public loaderService :  LoaderService,
    private route:          ActivatedRoute,
    private router:         Router
  ) {}

  ngOnInit() {
    this.cambiarSeleccion();
  }

  // Metodo para obtener el ID de la sucursal actual de la ruta
  getSucursalId(): string {
    let id = '';
    this.route.params.subscribe(params => {
      id = params['id'];
    });
    return id;
  }

  crearEquipos(datos: any) {
    this.cerrarModal = true;
    const { cantidad } = datos;

    const solicitudes = Array.from({ length: cantidad }, () =>
      this.apiService.createEquiptment(datos)
    );

    forkJoin(solicitudes).subscribe({
      next: (respuestas) => {
        respuestas.forEach((respuesta, index) => {
          if (respuesta?.error) {
            console.error(`Error en el equipo ${index + 1}:`, respuesta.error);
          } else {
            console.log(`Equipo ${index + 1} creado exitosamente:`, respuesta);
          }
        });
      },
      error: (error) => {
        console.error('Error general al crear equipos:', error);
      },
      complete: () => {
        console.log('Proceso de creacion de equipos completado.');
        this.cerrarModal = false;
        this.cambiarSeleccion();
      }
    });
  }

  selectedOption(value: string) {
    this.option = value;
    this.equipos = undefined;
    this.paginaActual = 1;
    this.paginas = 1;
    this.cambiarSeleccion();
  }

  onFiltrosChange(filtros: EquipoFiltros): void {
    this.filtrosEquipos = { ...filtros };
    this.paginaActual = 1;
    this.paginas = 1;
    this.cambiarSeleccion();
  }

  cambiarSeleccion() {
    this.equipos = undefined;
    this.loaderService.showSection();
    this.obtainedEquipments = false;

    if (!this.Title) {
      this.signalService.updateData('');
    }

    const params = this.route.snapshot.params as { [key: string]: string };
    const id = params['id'];
    const idCliente = params['idCliente'];

    if (!id) {
      this.loaderService.hideSection();
      return;
    }

    this.apiService
      .sucursal(id, this.paginaActual, this.option ?? '', this.filtrosEquipos)
      .subscribe({
        next: (respuesta) => {
          const { sucursal, paginas } = respuesta;

          if (!sucursal) {
            if (idCliente) {
              this.router.navigate([`/clientes/${idCliente}`]);
            }
            return;
          }

          if (!this.Title) {
            this.headerTitle(sucursal.casaMatriz.razonSocial);
          }

          this.sucursal = sucursal;
          this.equipos = this.ordenarEquiposPorCodigo(sucursal.equipos ?? []);
          this.Devices = [];

          this.paginas = paginas;

          this.obtainedEquipments = true;
          if (sucursal.estado !== 3) {
            this.estado = true;
          }

          this.loaderService.hideSection();
        },
        error: (error) => {
          console.error('Error al obtener sucursales', error);
          this.loaderService.hideSection();
        },
      });
  }

  headerTitle(value: string) {
    this.signalService.updateData(value);
    this.Title = true;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.paginaActual = pagina;
      this.cambiarSeleccion();
    }
  }

  nextPage(): void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cambiarSeleccion();
    }
  }

  prevPage(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cambiarSeleccion();
    }
  }

  selectedDevices(devices: ImprimirEquipo[]) {
    this.Devices = [...devices];
  }

  eliminarEquiposSeleccionados(ids: number[]): void {
    if (!ids || ids.length === 0) {
      return;
    }

    const confirmar = window.confirm(`Deseas borrar ${ids.length} equipo(s) seleccionados?`);
    if (!confirmar) {
      return;
    }

    this.loaderService.showModal();

    const eliminaciones$ = ids.map((id) => this.apiService.deleteEquipment(id));

    forkJoin(eliminaciones$).subscribe({
      next: () => {
        this.Devices = [];
        this.cambiarSeleccion();
      },
      error: (error) => {
        console.error('Error al eliminar equipos seleccionados:', error);
        this.loaderService.hideModal();
      },
      complete: () => {
        this.loaderService.hideModal();
      }
    });
  }

  exportarEquipos(): void {
    if (!this.sucursal?.id) {
      return;
    }

    const totalPaginas = Math.max(this.paginas, 1);
    const pageRequests = Array.from({ length: totalPaginas }, (_, index) =>
      this.apiService.sucursal(
        this.sucursal!.id,
        index + 1,
        this.option ?? '',
        this.filtrosEquipos
      )
    );

    const paginas$ = pageRequests.length > 0 ? forkJoin(pageRequests) : of([]);
    const estados$ = this.estadosEquipoCache.length > 0
      ? of(this.estadosEquipoCache)
      : this.apiService.getEstadosEquipo();

    this.loaderService.showModal();

    forkJoin({ paginas: paginas$, estados: estados$ }).subscribe({
      next: ({ paginas, estados }) => {
        this.estadosEquipoCache = estados ?? [];

        const equipos: Equipo[] = (paginas as any[])
          .flatMap((respuesta: any) => respuesta?.sucursal?.equipos ?? [])
          .map((equipo: Equipo) => equipo);

        if (equipos.length === 0) {
          console.warn('No hay equipos para exportar.');
          return;
        }

        const ordenados = this.ordenarEquiposPorCodigo(equipos);
        this.generarExcelEquipos(ordenados, this.estadosEquipoCache);
      },
      error: (error) => {
        console.error('Error al exportar equipos:', error);
        this.loaderService.hideModal();
      },
      complete: () => {
        this.loaderService.hideModal();
      }
    });
  }

  private ordenarEquiposPorCodigo(equipos: Equipo[]): Equipo[] {
    if (!equipos || equipos.length === 0) {
      return [];
    }
    return [...equipos].sort((a, b) => {
      const codigoA = a.codigoId ?? '';
      const codigoB = b.codigoId ?? '';
      const numA = parseInt(codigoA.slice(-3), 10);
      const numB = parseInt(codigoB.slice(-3), 10);
      if (Number.isNaN(numA) || Number.isNaN(numB)) {
        return codigoA.localeCompare(codigoB);
      }
      return numA - numB;
    });
  }

  private generarExcelEquipos(equipos: Equipo[], estados: EstadoEquipo[]): void {
    const data = equipos.map((equipo, index) => ({
      Numero: index + 1,
      CodigoID: equipo.codigoId ?? '',
      Estado: this.obtenerNombreEstado(estados, equipo.estado),
      TipoEquipo: equipo.tipoEquipo?.name ?? '',
      FechaIngreso: this.formatearFecha(equipo.fechaIngreso),
      Departamento: equipo.departamento ?? '',
      Usuario: equipo.usuario ?? '',
      Marca: equipo.marca ?? '',
      Modelo: equipo.modelo ?? '',
      NumeroSerie: equipo.numeroSerie ?? '',
      Procesador: equipo.procesador ?? '',
      VelocidadProcesador: equipo.velocidadProcesador ?? '',
      RAM: equipo.ram ?? '',
      TipoAlmacenamiento: equipo.tipoAlmacenamiento ?? '',
      CantidadAlmacenamiento: equipo.cantidadAlmacenamiento ?? '',
      SistemaOperativo: equipo.sistemaOperativo ?? '',
      Ofimatica: equipo.ofimatica ?? '',
      Antivirus: equipo.antivirus ?? '',
      Observaciones: this.unirObservaciones(equipo.observaciones ?? [])
    }));

    if (data.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos');

    const nombreSucursal = this.sucursal?.sucursal ?? 'sucursal';
    const fileName = `${this.normalizarTexto(nombreSucursal)}-equipos.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private obtenerNombreEstado(estados: EstadoEquipo[], estadoId: number): string {
    const estado = estados.find((item) => item.id === estadoId);
    return estado ? estado.name : 'Sin estado';
  }

  private formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) {
      return '';
    }
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('es-CL');
  }

  private unirObservaciones(observaciones: { text: string }[]): string {
    if (!observaciones || observaciones.length === 0) {
      return '';
    }
    return observaciones
      .map((observacion) => observacion.text)
      .filter((texto) => !!texto)
      .join(' | ');
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }
}
