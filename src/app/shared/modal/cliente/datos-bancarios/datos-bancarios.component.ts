import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Cliente } from '../../../../interfaces/cliente.interface';
import { DatosBancarios } from '../../../../interfaces/datos-bancarios.interface';
import { tieneDatosBancarios } from '../../../../utils/datos-bancarios.util';

@Component({
  selector: 'app-datos-bancarios-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datos-bancarios.component.html',
  styleUrls: ['./datos-bancarios.component.css']
})
export class DatosBancariosClienteComponent {
  @Input() visible: boolean = false;
  @Input() cliente: Cliente | null = null;
  @Output() cerrar = new EventEmitter<void>();

  get datosBancarios(): DatosBancarios | null {
    return (this.cliente?.datosBancarios as DatosBancarios | null) ?? null;
  }

  get existeInformacion(): boolean {
    return tieneDatosBancarios(this.datosBancarios);
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  mostrarValor(valor?: string | null, fallback: string = 'No registrado'): string {
    return valor && valor.trim().length ? valor : fallback;
  }
}
