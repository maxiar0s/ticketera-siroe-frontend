import { Component, EventEmitter, Output } from '@angular/core';
import { CrearUsuarioComponent } from "../../../../shared/modal/usuario/crear-usuario/crear-usuario.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'admin-usuarios-header',
  standalone: true,
  imports: [CrearUsuarioComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() crearUsuarioForm = new EventEmitter<any>();

  public isModalVisible: boolean = false;
  public successMessage: string = '';
  public errorMessage: string = '';

  abrirModal() {
    this.isModalVisible = true;
  }

  cerrarModal() {
    this.isModalVisible = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  crearUsuario(event: any) {
    this.crearUsuarioForm.emit(event);
  }
}
