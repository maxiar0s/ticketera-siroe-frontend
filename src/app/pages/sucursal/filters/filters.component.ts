import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EquipoFiltros } from '../../../interfaces/equipo-filtros.interface';
import { DepartamentoEquipo } from '../../../interfaces/departamento-equipo.interface';
import { TipoEquipo } from '../../../interfaces/TipoEquipo.interface';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'sucursal-equipos-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class EquiposFiltersComponent implements OnInit {
  public isOpen = false;

  @Output() filtersChange = new EventEmitter<EquipoFiltros>();

  public tiposEquipo: TipoEquipo[] = [];
  public departamentos: DepartamentoEquipo[] = [];
  public readonly form = this.fb.group({
    fechaInicio: [''],
    fechaFin: [''],
    tipoEquipoIds: [[] as number[]],
    departamentos: [[] as string[]],
    ramMin: [''],
    ramMax: [''],
    almacenamientoMin: [''],
    almacenamientoMax: [''],
    conRegistroFotografico: [''],
  });

  private readonly tiposSeleccionados = new Set<number>();
  private readonly departamentosSeleccionados = new Set<string>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: ApiService
  ) {}

  ngOnInit(): void {
    forkJoin({
      tipos: this.apiService.typeEquipments(),
      departamentos: this.apiService.getDepartamentosEquipo(),
    }).subscribe({
      next: ({ tipos, departamentos }) => {
        this.tiposEquipo = Array.isArray(tipos) ? tipos : [];
        this.departamentos = Array.isArray(departamentos)
          ? departamentos
          : [];
      },
      error: (error) => {
        console.error('Error al cargar opciones de filtros de equipos:', error);
      },
    });
  }

  toggleTipoEquipo(id: number, checked: boolean): void {
    if (checked) {
      this.tiposSeleccionados.add(id);
    } else {
      this.tiposSeleccionados.delete(id);
    }
    this.form.patchValue({ tipoEquipoIds: Array.from(this.tiposSeleccionados) }, { emitEvent: false });
  }

  toggleDepartamento(nombre: string, checked: boolean): void {
    if (checked) {
      this.departamentosSeleccionados.add(nombre);
    } else {
      this.departamentosSeleccionados.delete(nombre);
    }
    this.form.patchValue(
      { departamentos: Array.from(this.departamentosSeleccionados) },
      { emitEvent: false }
    );
  }

  tipoSeleccionado(id: number): boolean {
    return this.tiposSeleccionados.has(id);
  }

  departamentoSeleccionado(nombre: string): boolean {
    return this.departamentosSeleccionados.has(nombre);
  }

  aplicarFiltros(): void {
    const raw = this.form.getRawValue();

    let fechaInicio = raw.fechaInicio ?? '';
    let fechaFin = raw.fechaFin ?? '';
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      [fechaInicio, fechaFin] = [fechaFin, fechaInicio];
    }

    const filtros: EquipoFiltros = {};

    if (fechaInicio) {
      filtros.fechaInicio = fechaInicio;
    }

    if (fechaFin) {
      filtros.fechaFin = fechaFin;
    }

    if (this.tiposSeleccionados.size > 0) {
      filtros.tipoEquipoIds = Array.from(this.tiposSeleccionados);
    }

    if (this.departamentosSeleccionados.size > 0) {
      filtros.departamentos = Array.from(this.departamentosSeleccionados);
    }

    const ramMin = this.parseEntero(raw.ramMin);
    const ramMax = this.parseEntero(raw.ramMax);
    if (ramMin !== null && ramMax !== null && ramMin > ramMax) {
      filtros.ramMin = ramMax;
      filtros.ramMax = ramMin;
    } else {
      if (ramMin !== null) {
        filtros.ramMin = ramMin;
      }
      if (ramMax !== null) {
        filtros.ramMax = ramMax;
      }
    }

    const almacenamientoMin = this.parseEntero(raw.almacenamientoMin);
    const almacenamientoMax = this.parseEntero(raw.almacenamientoMax);
    if (
      almacenamientoMin !== null &&
      almacenamientoMax !== null &&
      almacenamientoMin > almacenamientoMax
    ) {
      filtros.almacenamientoMin = almacenamientoMax;
      filtros.almacenamientoMax = almacenamientoMin;
    } else {
      if (almacenamientoMin !== null) {
        filtros.almacenamientoMin = almacenamientoMin;
      }
      if (almacenamientoMax !== null) {
        filtros.almacenamientoMax = almacenamientoMax;
      }
    }

    const registro = raw.conRegistroFotografico;
    if (registro === 'true') {
      filtros.conRegistroFotografico = true;
    } else if (registro === 'false') {
      filtros.conRegistroFotografico = false;
    }

    this.filtersChange.emit(filtros);
  }

  limpiarFiltros(): void {
    this.tiposSeleccionados.clear();
    this.departamentosSeleccionados.clear();
    this.form.reset({
      fechaInicio: '',
      fechaFin: '',
      tipoEquipoIds: [] as number[],
      departamentos: [] as string[],
      ramMin: '',
      ramMax: '',
      almacenamientoMin: '',
      almacenamientoMax: '',
      conRegistroFotografico: '',
    });
    this.filtersChange.emit({});
  }

  private parseEntero(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const numero = Number.parseInt(`${valor}`, 10);
    return Number.isNaN(numero) ? null : numero;
  }
}
