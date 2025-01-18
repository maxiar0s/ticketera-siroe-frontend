import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cuenta } from '../../../../interfaces/Cuenta.interface';
import { ModificarUsuarioComponent } from "../../../../shared/modal/usuario/modificar-usuario/modificar-usuario.component";
import { EliminarUsuarioComponent } from "../../../../shared/modal/usuario/eliminar-usuario/eliminar-usuario.component";

@Component({
  selector: 'admin-usuarios-table',
  standalone: true,
  imports: [CommonModule, ModificarUsuarioComponent, EliminarUsuarioComponent],
  templateUrl: './table-users.component.html',
  styleUrl: './table-users.component.css'
})
export class TableUsersComponent {
  // Formularios para modificar y eliminar usuarios
  @Output() modificarUsuarioForm = new EventEmitter<any>();
  @Output() modificarTabla = new EventEmitter<any>();

  @Output() eliminarUsuarioForm = new EventEmitter<any>();

  // Modales para modificar y eliminar usuarios
  public selectedUser!: Cuenta;
  public indiceSelectedUser!: number;
  public isModalVisibleModificarUsuario: boolean = false;
  public isModalVisibleEliminarUsuario: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  // Arreglo de cuentas
  @Input() idAdministrador: number | undefined;
  public cuentas: Cuenta[] | undefined = undefined;

  constructor() {}

  abrirModModal(event: boolean) {
    this.isModalVisibleModificarUsuario = event;
  }

  abrirModalModificarUsuario(indice: number) {
    if(this.cuentas) {
      this.selectedUser = this.cuentas[indice];
      this.modificarTabla.emit(indice);
      this.isModalVisibleModificarUsuario = true;
    } else return;
  }

  cerrarModalModificarUsuario() {
    this.isModalVisibleModificarUsuario = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  abrirModalEliminarUsuario(indice: number) {
    if(this.cuentas) {
      this.indiceSelectedUser = this.cuentas[indice].id;
      this.selectedUser = this.cuentas[indice];
      this.isModalVisibleEliminarUsuario = true;
    } else return;
  }

  cerrarModalEliminarUsuario() {
    this.isModalVisibleEliminarUsuario = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  modificarUsuario(event: any) {
    this.modificarUsuarioForm.emit(event);
  }

  eliminarUsuario(event: any) {
    this.eliminarUsuarioForm.emit(event);
  }

  @Input()
  set cargarCuentas(value: Cuenta[] | undefined) {
    this.cuentas = value;
  }
}
