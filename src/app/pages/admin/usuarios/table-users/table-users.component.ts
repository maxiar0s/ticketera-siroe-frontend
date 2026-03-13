import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cuenta } from '../../../../interfaces/Cuenta.interface';
import { normalizeOccupationLabel } from '../../../../config/modules';
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
  public isModalVisibleVerUsuario: boolean = false;
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

  abrirModalVerUsuario(indice: number) {
    if(this.cuentas) {
      this.selectedUser = this.cuentas[indice];
      this.isModalVisibleVerUsuario = true;
    } else return;
  }

  cerrarModalModificarUsuario() {
    this.isModalVisibleModificarUsuario = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cerrarModalVerUsuario() {
    this.isModalVisibleVerUsuario = false;
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

  getInitials(name?: string | null): string {
    const cleanedName = (name || '').trim();

    if (!cleanedName) {
      return 'U';
    }

    const parts = cleanedName.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarStyle(cuenta: Cuenta): { [key: string]: string } {
    const palette = [
      ['#7c3aed', '#5b21b6'],
      ['#2563eb', '#1d4ed8'],
      ['#0891b2', '#0e7490'],
      ['#059669', '#047857'],
      ['#ea580c', '#c2410c'],
      ['#dc2626', '#b91c1c'],
      ['#db2777', '#be185d'],
      ['#ca8a04', '#a16207'],
    ];

    const seedSource = `${cuenta.id}-${cuenta.name || cuenta.email || ''}`;
    const seed = Array.from(seedSource).reduce(
      (accumulator, char) => accumulator + char.charCodeAt(0),
      0,
    );
    const [start, end] = palette[seed % palette.length];

    return {
      background: `linear-gradient(135deg, ${start}, ${end})`,
    };
  }

  getRoleLabel(cuenta: Cuenta): string {
    return cuenta.tipoCuenta?.name ?? 'Sin rol';
  }

  getRoleClass(cuenta: Cuenta): string {
    const role = this.getRoleLabel(cuenta).toLowerCase();

    if (role.includes('administrador')) {
      return 'role-admin';
    }

    if (role.includes('técnico') || role.includes('tecnico')) {
      return 'role-tech';
    }

    if (role.includes('cliente')) {
      return 'role-client';
    }

    if (role.includes('mesa')) {
      return 'role-support';
    }

    if (role.includes('comercial')) {
      return 'role-sales';
    }

    return 'role-default';
  }

  getOccupationLabel(cuenta: Cuenta): string {
    return normalizeOccupationLabel(cuenta.ocupacion) ?? 'Sin ocupacion';
  }

  getOccupationClass(cuenta: Cuenta): string {
    const occupation = normalizeOccupationLabel(cuenta.ocupacion);

    if (occupation === 'Software') {
      return 'occupation-software';
    }

    if (occupation === 'Terreno') {
      return 'occupation-field';
    }

    if (occupation === 'Software/Terreno') {
      return 'occupation-hybrid';
    }

    return 'occupation-empty';
  }

  @Input()
  set cargarCuentas(value: Cuenta[] | undefined) {
    this.cuentas = value;
  }
}
