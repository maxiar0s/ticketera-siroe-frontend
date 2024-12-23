import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { LoaderService } from '../../../services/loader.service';
import { LoaderComponent } from "../../../shared/loader/loader.component";
import { CasaMatrizComponent } from "./casa-matriz/casa-matriz.component";
import { OptionsComponent } from '../../../shared/options/options.component';

@Component({
  selector: 'cliente',
  standalone: true,
  imports: [HeaderComponent, OptionsComponent, SucursalesComponent, LoaderComponent, CasaMatrizComponent],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.css'
})
export class ClienteComponent {
  public Option:string = 'Todos los ingresos';

  constructor(
    public loaderService: LoaderService
  ) {}

  selectedOption(value: string) {
    this.Option = value;
  }
}
