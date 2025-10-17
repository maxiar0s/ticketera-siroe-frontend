import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Cliente } from '../../../interfaces/cliente.interface';
import { Equipo } from '../../../interfaces/equipo.interface';

@Component({
  selector: 'dashboard-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent implements OnChanges {
  @Input() option: string = 'Todos los ingresos';
  clientes: Cliente[] = [];
  loading = false;

  readonly variantOptions = [
    { value: 'equipos', label: 'Equipos registrados' },
    { value: 'sucursales', label: 'Sucursales activas' },
    { value: 'telefonoEncargado', label: 'Telefono encargado' },
    { value: 'correo', label: 'Correo de contacto' },
    { value: 'encargadoGeneral', label: 'Encargado general' },
    { value: 'rut', label: 'RUT' },
    { value: 'fechaIngreso', label: 'Fecha de ingreso' },
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

  loadData() {
    this.loading = true;
    // Aquí puedes cambiar la lógica según el endpoint real y la opción seleccionada
    // Por ejemplo, si tienes endpoints distintos para pendientes/terminados, cámbialo aquí
    this.api.clients(1).subscribe({
      next: (res) => {
        // Filtra según la opción si es necesario
        this.clientes = res?.clientes || [];
        this.loading = false;
      },
      error: () => {
        this.clientes = [];
        this.loading = false;
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
      case 'equipos':
        return this.contarEquipos(cliente).toString();
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
      default:
        return '-';
    }
  }

  private contarEquipos(cliente: Cliente): number {
    const equipos = new Map<number | string, Equipo>();

    if (Array.isArray(cliente?.sucursales)) {
      cliente.sucursales.forEach((sucursal: any) => {
        if (Array.isArray(sucursal?.equipos)) {
          sucursal.equipos.forEach((equipo: Equipo) => {
            const key = equipo?.id ?? `${equipo?.codigoId}-${equipo?.numeroSecuencial}`;
            if (key !== undefined && key !== null) {
              equipos.set(key, equipo);
            }
          });
        }
      });
    }

    const listadoAlternativo = Array.isArray(cliente?.Equipos)
      ? cliente.Equipos
      : Array.isArray((cliente as any)?.equipos)
        ? (cliente as any).equipos
        : [];

    listadoAlternativo.forEach((equipo: Equipo) => {
      const key = equipo?.id ?? `${equipo?.codigoId}-${equipo?.numeroSecuencial}`;
      if (key !== undefined && key !== null) {
        equipos.set(key, equipo);
      }
    });

    return equipos.size;
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
}
