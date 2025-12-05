import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
})
export class ReportesComponent implements OnInit {
  logs: any[] = [];
  filteredLogs: any[] = [];
  filtroUsuario: string = '';
  filtroAccion: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs() {
    this.loaderService.showSection();
    this.apiService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.aplicarFiltros();
        this.loaderService.hideSection();
      },
      error: (err) => {
        console.error('Error al cargar logs', err);
        this.loaderService.hideSection();
      },
    });
  }

  aplicarFiltros() {
    this.filteredLogs = this.logs.filter((log) => {
      const matchUsuario = this.filtroUsuario
        ? log.usuario?.name
            .toLowerCase()
            .includes(this.filtroUsuario.toLowerCase()) ||
          log.usuario?.email
            .toLowerCase()
            .includes(this.filtroUsuario.toLowerCase())
        : true;
      const matchAccion = this.filtroAccion
        ? log.accion.toLowerCase().includes(this.filtroAccion.toLowerCase())
        : true;

      let matchFecha = true;
      const fechaLog = new Date(log.fecha);
      if (this.filtroFechaInicio) {
        matchFecha = matchFecha && fechaLog >= new Date(this.filtroFechaInicio);
      }
      if (this.filtroFechaFin) {
        // Ajustar fin del día
        const fin = new Date(this.filtroFechaFin);
        fin.setHours(23, 59, 59, 999);
        matchFecha = matchFecha && fechaLog <= fin;
      }

      return matchUsuario && matchAccion && matchFecha;
    });
  }

  limpiarFiltros() {
    this.filtroUsuario = '';
    this.filtroAccion = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  getDetallesString(detalles: any): string {
    if (!detalles) return '';
    if (typeof detalles === 'string') return detalles;
    return JSON.stringify(detalles, null, 2);
  }
}
