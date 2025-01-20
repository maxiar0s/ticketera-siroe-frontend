import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sucursal } from '../../../../interfaces/Sucursal.interface';
import { FormatoFechaPipe } from '../../../../pipes/formato-fecha.pipe';
import { OpcionesSucursalComponent } from '../../../../shared/modal/sucursal/opciones-sucursal/opciones-sucursal.component';
import { CrearModificarSucursalComponent } from '../../../../shared/modal/sucursal/crear-modificar-sucursal/crear-modificar-sucursal.component';

@Component({
  selector: 'cliente-sucursales',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatoFechaPipe, OpcionesSucursalComponent, CrearModificarSucursalComponent],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent {
  @Input() esAdministrador!: boolean;

  // Arreglo de sucursales
  public obtainedSucursales: boolean = false;
  public sucursales: Sucursal[] | undefined = undefined;

  @Output() indiceTabla = new EventEmitter<any>();
  @Output() sucursalForm = new EventEmitter<any>();
  @Output() eliminarForm = new EventEmitter<any>();

  // Modal modificar o eliminar
  public selectedSucursal!: Sucursal;
  public idSucursal!: string;
  public indiceSucursal!: number;
  public isModalVisibleModificarSucursal: boolean = false;
  public isModalVisibleAjustesSucursal: boolean = false;

  @Input()
  set setSucursales(value: Sucursal[]) {
    this.sucursales = value;
    this.obtainedSucursales = true;
  }

  abrirModModal(event: boolean) {
    this.isModalVisibleModificarSucursal = event;
  }

  abrirModalAjustesSucursal(indice: number) {
    if(this.sucursales) {
      this.idSucursal = this.sucursales[indice].id;
      this.selectedSucursal = this.sucursales[indice];
      this.indiceTabla.emit(indice);
      this.isModalVisibleAjustesSucursal = true;
    } else return;
  }

  cerrarModalAjustesSucursal() {
    this.isModalVisibleAjustesSucursal = false;
  }

  cerrarModalEditarSucursal() {
    this.isModalVisibleModificarSucursal = false;
  }

  enviarSucursal(event: any) {
    this.sucursalForm.emit(event);
  }

  eliminarSucursal(event: any) {
    this.eliminarForm.emit(event);
  }
}
