import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClienteResumen } from '../../../../interfaces/cliente-resumen.interface';
import { Proyecto } from '../../../../interfaces/proyecto.interface';

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

interface TagOption {
  id: number;
  nombre: string;
  color: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface TecnicoOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-ticket-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-filters.component.html',
  styleUrls: ['./ticket-filters.component.css'],
})
export class TicketFiltersComponent {
  @Input() filtroForm!: FormGroup;
  @Input() clientes: ClienteResumen[] = [];
  @Input() sucursales: SucursalOption[] = [];
  @Input() proyectos: Proyecto[] = [];
  @Input() tecnicosDisponibles: TecnicoOption[] = [];
  @Input() tagsDisponibles: TagOption[] = [];
  @Input() filtrosEstado: SelectOption[] = [];
  @Input() prioridades: SelectOption[] = [];
  @Input() modules: any = {};

  @Output() onFilter = new EventEmitter<void>();
  @Output() onClear = new EventEmitter<void>();
  @Output() onClienteChange = new EventEmitter<string>();
  @Output() onTagToggle = new EventEmitter<number>();

  handleSubmit(): void {
    this.onFilter.emit();
  }

  handleClear(): void {
    this.onClear.emit();
  }

  handleClienteChange(clienteId: string): void {
    this.onClienteChange.emit(clienteId);
  }

  isTagSelected(tagId: number): boolean {
    const tagIds = this.filtroForm.get('tagIds')?.value || [];
    return Array.isArray(tagIds) && tagIds.includes(tagId);
  }

  toggleTag(tagId: number): void {
    this.onTagToggle.emit(tagId);
  }
}
