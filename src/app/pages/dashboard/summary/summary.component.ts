import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Cliente } from '../../../interfaces/cliente.interface';
import { Equipo } from '../../../interfaces/equipo.interface';

@Component({
  selector: 'dashboard-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent implements OnChanges {
  @Input() option: string = 'Todos los ingresos';
  clientes: Cliente[] = [];
  loading = false;
  private equiposTotalesPorCliente = new Map<string, number>();

  readonly variantOptions = [
    { value: 'equipos', label: 'Equipos registrados' },
    { value: 'sucursales', label: 'Sucursales activas' },
    { value: 'telefonoEncargado', label: 'Telefono encargado' },
    { value: 'correo', label: 'Correo de contacto' },
    { value: 'encargadoGeneral', label: 'Encargado general' },
    { value: 'rut', label: 'RUT' },
    { value: 'fechaIngreso', label: 'Fecha de ingreso' },
    { value: 'visitasMensuales', label: 'Visitas mensuales' },
    { value: 'visitasMensualesRealizadas', label: 'Visitas mensuales realizadas' },
    { value: 'visitasEmergencia', label: 'Visitas de emergencia' },
    { value: 'visitasEmergenciaRealizadas', label: 'Visitas de emergencia realizadas' },
    { value: 'visitasTotalesRealizadas', label: 'Visitas realizadas totales' },
    { value: 'visitasEmergenciaTotalesRealizadas', label: 'Visitas de emergencia realizadas totales' },
  ] as const;

  selectedVariant1: typeof this.variantOptions[number]['value'] = 'equipos';
  selectedVariant2: typeof this.variantOptions[number]['value'] = 'telefonoEncargado';

  private readonly dateFormatter = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['option']) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.equiposTotalesPorCliente.clear();

    this.api.clients(1).subscribe({
      next: (res) => {
        this.clientes = res?.clientes || [];
        this.cargarTotalesEquipos(this.clientes);
        this.loading = false;
      },
      error: () => {
        this.clientes = [];
        this.equiposTotalesPorCliente.clear();
        this.loading = false;
      }
    });
  }

  private cargarTotalesEquipos(clientes: Cliente[]): void {
    this.equiposTotalesPorCliente.clear();

    if (!clientes || !clientes.length) {
      return;
    }

    const mapaClientes = new Map(clientes.map((cliente) => [cliente.id, cliente] as [string, Cliente]));

    const solicitudes = clientes.map((cliente) =>
      this.api.equiposPorClienteCompleto(cliente.id).pipe(
        map((respuesta) => {
          const detalle = respuesta.cliente;
          if (detalle) {
            const previo = mapaClientes.get(cliente.id) ?? cliente;
            mapaClientes.set(
              cliente.id,
              {
                ...previo,
                ...detalle,
                sucursales: detalle.sucursales ?? previo?.sucursales,
              } as Cliente
            );
          }
          return { id: cliente.id, equipos: respuesta.equipos };
        }),
        catchError((error) => {
          console.error(`Error al obtener equipos del cliente ${cliente.id}`, error);
          return of({ id: cliente.id, equipos: [] as Equipo[] });
        })
      )
    );

    forkJoin(solicitudes).subscribe({
      next: (respuestas) => {
        const nuevoMapa = new Map<string, number>();
        respuestas.forEach(({ id, equipos }) => {
          const base = mapaClientes.get(id);
          if (base) {
            const total = this.calcularTotalEquiposCliente(base, equipos);
            nuevoMapa.set(id, total);
          }
        });
        this.clientes = this.clientes.map((cliente) => mapaClientes.get(cliente.id) ?? cliente);
        this.equiposTotalesPorCliente = nuevoMapa;
      },
      error: (error) => {
        console.error('Error al consolidar equipos por cliente', error);
      }
    });
  }

  setVariant(column: 'variante1' | 'variante2', value: string): void {
    if (this.variantOptions.find((option) => option.value === value)) {
      if (column === 'variante1') {
        this.selectedVariant1 = value as typeof this.selectedVariant1;
      } else {
        this.selectedVariant2 = value as typeof this.selectedVariant2;
      }
    }
  }

  getVariantLabel(value: string): string {
    return this.variantOptions.find((option) => option.value === value)?.label ?? 'Sin dato';
  }

  getVariantValue(cliente: Cliente, variant: string): string {
    switch (variant) {
      case 'equipos': {
        const total = this.equiposTotalesPorCliente.get(cliente.id) ?? this.contarEquipos(cliente);
        return total.toString();
      }
      case 'sucursales':
        return (cliente.sucursales?.length ?? 0).toString();
      case 'telefonoEncargado':
        return cliente.telefonoEncargado ? String(cliente.telefonoEncargado) : '-';
      case 'correo':
        return cliente.correo || '-';
      case 'encargadoGeneral':
        return cliente.encargadoGeneral || '-';
      case 'rut':
        return cliente.rut || '-';
      case 'fechaIngreso':
        return this.formatearFecha(cliente.fechaIngreso);
      case 'visitasMensuales':
        return this.formatearCantidad(cliente.visitasMensuales);
      case 'visitasMensualesRealizadas':
        return this.formatearCantidad(cliente.visitasMensualesRealizadas);
      case 'visitasEmergencia':
        return this.formatearCantidad(cliente.visitasEmergenciaAnuales);
      case 'visitasEmergenciaRealizadas':
        return this.formatearCantidad(cliente.visitasEmergenciaAnualesRealizadas);
      case 'visitasTotalesRealizadas':
        return this.formatearCantidad(
          (cliente.visitasMensualesRealizadas ?? 0) + (cliente.visitasEmergenciaAnualesRealizadas ?? 0)
        );
      case 'visitasEmergenciaTotalesRealizadas':
        return this.formatearCantidad(cliente.visitasEmergenciaAnualesRealizadas);
      default:
        return '-';
    }
  }

  private contarEquipos(cliente: Cliente): number {
    return this.calcularTotalEquiposCliente(cliente);
  }

  private calcularTotalEquiposCliente(cliente: Cliente, equiposExternos: Equipo[] = []): number {
    const equipos = new Map<number | string, Equipo>();
    let fallbackTotal = 0;

    equiposExternos.forEach((equipo) => this.registrarEquipoEnMapa(equipos, equipo));

    if (Array.isArray(cliente?.sucursales)) {
      cliente.sucursales.forEach((sucursal: any) => {
        if (Array.isArray(sucursal?.equipos) && sucursal.equipos.length) {
          sucursal.equipos.forEach((equipo: Equipo) => this.registrarEquipoEnMapa(equipos, equipo));
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

    listadoAlternativo.forEach((equipo: Equipo) => this.registrarEquipoEnMapa(equipos, equipo));

    return equipos.size > 0 ? equipos.size : fallbackTotal;
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

  private formatearFecha(valor: Date | string | undefined): string {
    if (!valor) {
      return '-';
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return '-';
    }
    return this.dateFormatter.format(fecha);
  }

  private formatearCantidad(valor: number | null | undefined): string {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? numero.toString() : '0';
  }
}
