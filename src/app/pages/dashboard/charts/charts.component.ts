import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SimpleBarChartComponent } from '../../../shared/charts/simple-bar-chart.component';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { Cliente } from '../../../interfaces/cliente.interface';
import { Bitacora } from '../../../interfaces/bitacora.interface';
import { forkJoin, map, of, switchMap, catchError, throwError } from 'rxjs';
import { DashboardCalendarComponent } from './calendar/dashboard-calendar.component';
import { TipoEquipo } from '../../../interfaces/TipoEquipo.interface';

type ClienteConEquipos = { cliente: Cliente; equipos: Equipo[] };

@Component({
  selector: 'dashboard-charts',
  standalone: true,
  imports: [CommonModule, SimpleBarChartComponent, DashboardCalendarComponent],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit {
  @Input() option: string = 'Todos los ingresos';
  @Input() modoCliente = false;

  equiposPorTipoData: { label: string; value: number }[] = [];
  equiposPorClienteData: { label: string; value: number }[] = [];
  visitasPorMesData: { label: string; value: number }[] = [];
  bitacoras: Bitacora[] = [];
  visitasMensualesResumen = { asignadas: 0, registradas: 0, restantes: 0 };
  visitasEmergenciaResumen = { asignadas: 0, registradas: 0, restantes: 0 };
  visitasEmergenciaAsignadasAnuales = 0;

  loadingClientes = false;
  loadingBitacoras = false;
  clientesError = '';
  bitacorasError = '';

  private readonly mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  private readonly maxClientesEnGrafico = 8;
  private tiposEquipoMapa = new Map<number, string>();
  private totalVisitasMensualesAsignadas = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarCatalogoTipos();
    this.cargarBitacoras();
  }

  onVisitaAgendada(): void {
    this.cargarBitacoras();
  }

  private cargarCatalogoTipos(): void {
    this.api.typeEquipments().subscribe({
      next: (tipos: TipoEquipo[]) => {
        this.tiposEquipoMapa = new Map(
          tipos.map((tipo) => [tipo.id, (tipo.name ?? '').trim()])
        );
      },
      error: (error) => {
        console.error('Error al obtener catalogo de tipos de equipo:', error);
        this.tiposEquipoMapa.clear();
        this.cargarClientesConEquipos();
      },
      complete: () => {
        this.cargarClientesConEquipos();
      }
    });
  }

  private cargarClientesConEquipos(): void {
    this.loadingClientes = true;
    this.clientesError = '';

    this.obtenerTodosLosClientes()
      .pipe(
        switchMap((clientes) => {
          if (!clientes.length) {
            return of({ detalles: [] as ClienteConEquipos[] });
          }

          const peticiones = clientes.map((cliente) =>
            this.api.equiposPorClienteCompleto(cliente.id).pipe(
              map((respuesta) => {
                const detalle = respuesta.cliente;
                const clienteCombinado = detalle
                  ? ({
                      ...cliente,
                      ...detalle,
                      sucursales: detalle.sucursales ?? cliente.sucursales,
                    } as Cliente)
                  : cliente;
                return { cliente: clienteCombinado, equipos: respuesta.equipos } as ClienteConEquipos;
              }),
              catchError((error) => {
                console.error(`Error al cargar equipos del cliente ${cliente.id}`, error);
                return of({ cliente, equipos: [] as Equipo[] });
              })
            )
          );

          if (!peticiones.length) {
            return of({ detalles: [] as ClienteConEquipos[] });
          }

          return forkJoin(peticiones).pipe(
            map((detalles) => ({ detalles }))
          );
        })
      )
      .subscribe({
        next: ({ detalles }) => {
          this.procesarResumenClientes(detalles);
          this.loadingClientes = false;
        },
        error: (error) => {
          console.error('Error al cargar clientes para dashboard', error);
          this.equiposPorClienteData = [];
          this.equiposPorTipoData = [];
          this.loadingClientes = false;
          this.clientesError = 'No fue posible cargar la informacion de clientes.';
        }
      });
  }

  private cargarBitacoras(): void {
    this.loadingBitacoras = true;
    this.bitacorasError = '';

    this.obtenerTodasLasBitacoras()
      .subscribe({
        next: (bitacoras) => {
          this.bitacoras = bitacoras;
          this.visitasPorMesData = this.calcularVisitasPorMes(bitacoras);
          this.actualizarMetricasVisitas(bitacoras);
          this.loadingBitacoras = false;
        },
        error: (error) => {
          console.error('Error al cargar bitacoras para dashboard', error);
          this.bitacoras = [];
          this.visitasPorMesData = this.calcularVisitasPorMes([]);
          this.actualizarMetricasVisitas([]);
          this.loadingBitacoras = false;
          if (error?.status === 403) {
            this.bitacorasError = error?.error?.error ?? 'Tu cuenta no tiene acceso a Tickets.';
          } else {
            this.bitacorasError = 'No fue posible cargar las visitas registradas.';
          }
        }
      });
  }

  private obtenerTodosLosClientes() {
    return this.api.clients(1).pipe(
      switchMap((respuesta) => {
        const clientesIniciales: Cliente[] = respuesta?.clientes ?? [];
        const paginas = respuesta?.paginas ?? 1;

        if (!paginas || paginas <= 1) {
          return of(clientesIniciales);
        }

        const peticiones = [];
        for (let pagina = 2; pagina <= paginas; pagina++) {
          peticiones.push(this.api.clients(pagina));
        }

        if (peticiones.length === 0) {
          return of(clientesIniciales);
        }

        return forkJoin(peticiones).pipe(
          map((respuestas) => {
            const acumulado = [...clientesIniciales];
            respuestas.forEach((res) => {
              const listado: Cliente[] = res?.clientes ?? [];
              acumulado.push(...listado);
            });
            return acumulado;
          })
        );
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  private obtenerTodasLasBitacoras() {
    const parametrosBase = { pagina: 1, limite: 200 };

    return this.api.bitacoras(parametrosBase).pipe(
      switchMap((respuesta) => {
        const bitacorasIniciales: Bitacora[] = respuesta?.data ?? [];
        const paginasTotales = respuesta?.paginasTotales ?? 1;

        if (!paginasTotales || paginasTotales <= 1) {
          return of(bitacorasIniciales);
        }

        const peticiones = [];
        for (let pagina = 2; pagina <= paginasTotales; pagina++) {
          peticiones.push(this.api.bitacoras({ ...parametrosBase, pagina }));
        }

        if (peticiones.length === 0) {
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
          })
        );
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  private procesarResumenClientes(detalles: ClienteConEquipos[]): void {
    if (!detalles.length) {
      this.equiposPorClienteData = [];
      this.equiposPorTipoData = [];
      if (this.modoCliente) {
        this.totalVisitasMensualesAsignadas = 0;
        this.visitasEmergenciaAsignadasAnuales = 0;
        this.actualizarMetricasVisitas(this.bitacoras);
      }
      return;
    }

    const conteosPorTipo = new Map<string, number>();
    const conteosPorCliente: { label: string; value: number }[] = [];

    detalles.forEach(({ cliente, equipos }) => {
      const { listado, total } = this.compilarEquiposCliente(cliente, equipos);
      const label = cliente?.razonSocial ?? 'Sin nombre';

      conteosPorCliente.push({ label, value: total });

      listado.forEach((equipo) => {
        const tipo = this.obtenerNombreTipoEquipo(equipo);
        conteosPorTipo.set(tipo, (conteosPorTipo.get(tipo) ?? 0) + 1);
      });
    });

    this.equiposPorClienteData = conteosPorCliente
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, this.maxClientesEnGrafico);

    this.equiposPorTipoData = Array.from(conteosPorTipo.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));

    if (this.modoCliente) {
      this.totalVisitasMensualesAsignadas = detalles.reduce((acumulado, { cliente }) => {
        if ((cliente as Cliente)?.esLead) {
          return acumulado;
        }
        return acumulado + this.normalizarCantidad((cliente as any)?.visitasMensuales);
      }, 0);

      this.visitasEmergenciaAsignadasAnuales = detalles.reduce((acumulado, { cliente }) => {
        if ((cliente as Cliente)?.esLead) {
          return acumulado;
        }
        return acumulado + this.normalizarCantidad((cliente as any)?.visitasEmergenciaAnuales);
      }, 0);

      this.actualizarMetricasVisitas(this.bitacoras);
    }
  }

  private normalizarCantidad(valor: number | null | undefined): number {
    const numero = Number(valor ?? 0);
    if (!Number.isFinite(numero) || numero <= 0) {
      return 0;
    }
    return Math.floor(numero);
  }

  private actualizarMetricasVisitas(bitacoras: Bitacora[]): void {
    if (!this.modoCliente) {
      return;
    }

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    let registradasMensuales = 0;
    let registradasEmergenciaAnual = 0;

    bitacoras.forEach((bitacora) => {
      const fechaBase = bitacora?.fechaVisita ?? bitacora?.createdAt ?? bitacora?.updatedAt;
      if (!fechaBase) {
        return;
      }

      const fecha = new Date(fechaBase);
      if (Number.isNaN(fecha.getTime()) || fecha.getFullYear() !== anioActual) {
        return;
      }

      if (bitacora.isEmergencia) {
        registradasEmergenciaAnual += 1;
        return;
      }

      if (fecha.getMonth() === mesActual) {
        registradasMensuales += 1;
      }
    });

    const asignadasMensuales = this.totalVisitasMensualesAsignadas;

    this.visitasMensualesResumen = {
      asignadas: asignadasMensuales,
      registradas: registradasMensuales,
      restantes: Math.max(asignadasMensuales - registradasMensuales, 0),
    };

    this.visitasEmergenciaResumen = {
      asignadas: this.visitasEmergenciaAsignadasAnuales,
      registradas: registradasEmergenciaAnual,
      restantes: Math.max(this.visitasEmergenciaAsignadasAnuales - registradasEmergenciaAnual, 0),
    };
  }

  private compilarEquiposCliente(cliente: Cliente, equiposExternos: Equipo[] = []): { listado: Equipo[]; total: number } {
    const equiposMap = new Map<number | string, Equipo>();
    let fallbackTotal = 0;

    equiposExternos.forEach((equipo) => this.registrarEquipoEnMapa(equiposMap, equipo));

    if (Array.isArray(cliente?.sucursales)) {
      cliente.sucursales.forEach((sucursal: any) => {
        if (Array.isArray(sucursal?.equipos) && sucursal.equipos.length) {
          sucursal.equipos.forEach((equipo: Equipo) => this.registrarEquipoEnMapa(equiposMap, equipo));
        } else if (typeof sucursal?.equiposCount === 'number') {
          const conteo = Number(sucursal.equiposCount);
          if (!Number.isNaN(conteo) && conteo > 0) {
            fallbackTotal += conteo;
          }
        }
      });
    }

    const listadoAlternativo = Array.isArray((cliente as any)?.Equipos)
      ? (cliente as any).Equipos
      : Array.isArray((cliente as any)?.equipos)
        ? (cliente as any).equipos
        : [];

    listadoAlternativo.forEach((equipo: Equipo) => this.registrarEquipoEnMapa(equiposMap, equipo));

    const listado = Array.from(equiposMap.values());
    const total = listado.length > 0 ? listado.length : fallbackTotal;

    return { listado, total };
  }

  private obtenerNombreTipoEquipo(equipo: Equipo | null | undefined): string {
    if (!equipo) {
      return 'Sin tipo';
    }

    const desdeRelacion = (equipo as any)?.tipoEquipo?.name;
    if (typeof desdeRelacion === 'string' && desdeRelacion.trim() !== '') {
      return desdeRelacion.trim();
    }

    const tipoId = (equipo as any)?.tipoEquipoId;
    if (typeof tipoId === 'number') {
      const nombreCatalogo = this.tiposEquipoMapa.get(tipoId);
      if (nombreCatalogo && nombreCatalogo.trim() !== '') {
        return nombreCatalogo.trim();
      }
      return `Tipo ${tipoId}`;
    }

    return 'Sin tipo';
  }

  private registrarEquipoEnMapa(contenedor: Map<number | string, Equipo>, equipo: Equipo | null | undefined): void {
    if (!equipo) {
      return;
    }

    const clave =
      equipo.id ??
      equipo.codigoId ??
      (equipo.numeroSecuencial !== undefined ? `ns-${equipo.numeroSecuencial}` : undefined);

    if (clave === undefined || clave === null) {
      return;
    }

    contenedor.set(clave, equipo);
  }

  private calcularVisitasPorMes(bitacoras: Bitacora[]): { label: string; value: number }[] {
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
    const conteo = new Map<string, number>();

    bitacoras.forEach((bitacora) => {
      const fechaBase = bitacora?.fechaVisita ?? bitacora?.createdAt ?? bitacora?.updatedAt;
      if (!fechaBase) {
        return;
      }

      const fecha = new Date(fechaBase);
      if (Number.isNaN(fecha.getTime()) || fecha < inicio) {
        return;
      }

      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    });

    const datos: { label: string; value: number }[] = [];

    for (let offset = 11; offset >= 0; offset--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - offset, 1);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      const etiqueta = this.formatearMes(fecha.getMonth());
      datos.push({ label: etiqueta, value: conteo.get(clave) ?? 0 });
    }

    return datos;
  }

  private formatearMes(indiceMes: number): string {
    return this.mesesCortos[indiceMes] ?? '';
  }
}
