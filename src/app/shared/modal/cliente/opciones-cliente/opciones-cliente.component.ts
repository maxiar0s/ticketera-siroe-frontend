import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../interfaces/cliente.interface';

@Component({
  selector: 'app-opciones-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opciones-cliente.component.html',
  styleUrls: ['./opciones-cliente.component.css']
})
export class OpcionesClienteComponent {
  @Input() visible: boolean = false;
  @Input() cliente: Cliente | null = null;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() eliminarCliente = new EventEmitter<string>();
  @Output() editarCliente = new EventEmitter<Cliente>();

  public deleting: boolean = false;

  onCerrarModal() {
    this.cerrarModal.emit();
  }

  onEliminarCliente() {
    if (this.cliente) {
      this.deleting = true;
      // Asegurar que el ID sea un número
      const clienteId = this.cliente.id;
      this.eliminarCliente.emit(clienteId);

      // Simular un pequeño retraso para mostrar el spinner
      setTimeout(() => {
        this.deleting = false;
      }, 1000);
    }
  }

  onEditarCliente() {
    if (this.cliente) {
      this.editarCliente.emit(this.cliente);
    }
  }
}
