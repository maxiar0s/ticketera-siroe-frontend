import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SimpleBarChartComponent } from '../../../shared/charts/simple-bar-chart.component';
import { ApiService } from '../../../services/api.service';
import { Equipo } from '../../../interfaces/equipo.interface';
import { Cliente } from '../../../interfaces/cliente.interface';
import { Bitacora } from '../../../interfaces/bitacora.interface';
import { forkJoin, map, of, switchMap, catchError, throwError } from 'rxjs';
import { DashboardCalendarComponent } from './calendar/dashboard-calendar.component';

@Component({
  selector: 'dashboard-charts',
  standalone: true,
  imports: [CommonModule, SimpleBarChartComponent, DashboardCalendarComponent],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit {
  @Input() option: string = 'Todos los ingresos';

  equiposPorTipoData: { label: string; value: number }[] = [];
  equiposPorClienteData: { label: string; value: number }[] = [];
  visitasPorMesData: { label: string; value: number }[] = [];
  bitacoras: Bitacora[] = [];

  loadingClientes = false;
  loadingBitacoras = false;
  clientesError = '';
  bitacorasError = '';

  private readonly mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  private readonly maxClientesEnGrafico = 8;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarClientesConEquipos();
    this.cargarBitacoras();
  }

  onVisitaAgendada(): void {
    this.cargarBitacoras();
  }

  private cargarClientesConEquipos(): void {
    this.loadingClientes = true;
    this.clientesError = '';

    this.obtenerTodosLosClientes()
      .subscribe({
        next: (clientes) => {
          const conteosPorTipo = new Map<string, number>();
          const conteosPorCliente: { label: string; value: number }[] = [];

          clientes.forEach((cliente) => {
            const equiposCliente = this.obtenerEquiposDeCliente(cliente);
            const totalCliente = equiposCliente.length;
            const label = cliente?.razonSocial ?? 'Sin nombre';

            conteosPorCliente.push({ label, value: totalCliente });

            equiposCliente.forEach((equipo) => {
              const tipo = (equipo?.tipoEquipo?.name ?? 'Sin tipo').trim() || 'Sin tipo';
              conteosPorTipo.set(tipo, (conteosPorTipo.get(tipo) ?? 0) + 1);
            });
          });

          const dataClientes = conteosPorCliente
            .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
            .slice(0, this.maxClientesEnGrafico);

          const dataTipos = Array.from(conteosPorTipo.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([label, value]) => ({ label, value }));

          this.equiposPorClienteData = dataClientes;
          this.equiposPorTipoData = dataTipos;
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
          this.loadingBitacoras = false;
        },
        error: (error) => {
          console.error('Error al cargar bitacoras para dashboard', error);
          this.bitacoras = [];
          this.visitasPorMesData = this.calcularVisitasPorMes([]);
          this.loadingBitacoras = false;
          this.bitacorasError = 'No fue posible cargar las visitas registradas.';
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

  private obtenerEquiposDeCliente(cliente: any): Equipo[] {
    const equiposMap = new Map<number | string, Equipo>();

    if (Array.isArray(cliente?.sucursales)) {
      cliente.sucursales.forEach((sucursal: any) => {
        if (Array.isArray(sucursal?.equipos)) {
          sucursal.equipos.forEach((equipo: Equipo) => {
            const key = equipo?.id ?? `${equipo?.codigoId}-${equipo?.numeroSecuencial}`;
            if (key !== undefined && key !== null) {
              equiposMap.set(key, equipo);
            }
          });
        }
      });
    }

    const listadoAlternativo = Array.isArray(cliente?.Equipos)
      ? cliente.Equipos
      : Array.isArray(cliente?.equipos)
        ? cliente.equipos
        : [];

    listadoAlternativo.forEach((equipo: Equipo) => {
      const key = equipo?.id ?? `${equipo?.codigoId}-${equipo?.numeroSecuencial}`;
      if (key !== undefined && key !== null) {
        equiposMap.set(key, equipo);
      }
    });

    return Array.from(equiposMap.values());
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
