import { Component } from '@angular/core';
import { SignalService } from '../../../services/signal.service';
import { HeaderComponent } from './header/header.component';
import { TableUsersComponent } from './table-users/table-users.component';
import { OptionsComponent } from './options/options.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent ,TableUsersComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent {
  // Filtro de usuarios
  public option!:   string;

  // Arreglo usuarios


  constructor(
    private signalService: SignalService
  ) {}

  ngOnInit() {
    this.signalService.updateData('Gestión de usuarios');
  }

  selectedOption(value: string) {
    this.option = value;
    // this.cambiarSeleccion();
  }
}
