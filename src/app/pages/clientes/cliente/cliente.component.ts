import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { OptionsComponent } from './options/options.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { NavegationComponent } from '../../../shared/navegation/navegation.component';
import { LoaderService } from '../../../services/loader.service';
import { LoaderComponent } from "../../../shared/loader/loader.component";

@Component({
  selector: 'cliente',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent, SucursalesComponent, NavegationComponent, LoaderComponent],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.css'
})
export class ClienteComponent {

  constructor(
    public loaderService: LoaderService
  ) {}
}
