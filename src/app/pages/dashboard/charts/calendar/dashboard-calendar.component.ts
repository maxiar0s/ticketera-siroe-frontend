import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { Bitacora } from '../../../../interfaces/bitacora.interface';
import { ClienteResumen } from '../../../../interfaces/cliente-resumen.interface';
import { ApiService } from '../../../../services/api.service';

interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  day: number;
  eventCount: number;
  isToday: boolean;
  isSelected: boolean;
}

interface SucursalOption {
  id: string;
  sucursal: string;
  estado?: number;
}

@Component({
  selector: 'dashboard-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard-calendar.component.html',
  styleUrl: './dashboard-calendar.component.css',
})
export class DashboardCalendarComponent implements OnInit {
  @Input() cargando = false;
  @Input() mensajeError = '';

  @Input()
  set bitacoras(value: Bitacora[] | null) {
    this._bitacoras = Array.isArray(value) ? value : [];
    this.regenerarMapaDeEventos();
  }
  get bitacoras(): Bitacora[] {
    return this._bitacoras;
  }

  @Output() refreshRequested = new EventEmitter<void>();

  agendaForm: FormGroup;
  formularioVisible = false;
  guardando = false;
  exitoMensaje = '';
  errorFormulario = '';

  clientes: ClienteResumen[] = [];
  sucursalesDisponibles: SucursalOption[] = [];
  private sucursalesCache = new Map<string, SucursalOption[]>();

  calendario: CalendarDay[] = [];
  eventosPorDia = new Map<string, Bitacora[]>();
  eventosSeleccionados: Bitacora[] = [];
  etiquetaSeleccion = '';

  readonly diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  private selectedDateKey: string | null = null;
  private _bitacoras: Bitacora[] = [];

  private vista = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  };

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.agendaForm = this.fb.group({
      clienteId: ['', Validators.required],
      sucursalId: [''],
      fecha: ['', Validators.required],
      horaLlegada: ['', Validators.required],
      horaSalida: ['', Validators.required],
      tecnicos: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      titulo: [''],
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.construirCalendario();
  }

  prevMonth(): void {
    if (this.vista.month === 0) {
      this.vista.month = 11;
      this.vista.year -= 1;
    } else {
      this.vista.month -= 1;
    }
    this.selectedDateKey = null;
    this.construirCalendario();
  }

  nextMonth(): void {
    if (this.vista.month === 11) {
      this.vista.month = 0;
      this.vista.year += 1;
    } else {
      this.vista.month += 1;
    }
    this.selectedDateKey = null;
    this.construirCalendario();
  }

  irAlMesActual(): void {
    const hoy = new Date();
    this.vista.year = hoy.getFullYear();
    this.vista.month = hoy.getMonth();
    this.selectedDateKey = this.formatearClave(hoy);
    this.construirCalendario();
  }

  get nombreMesActual(): string {
    const referencia = new Date(this.vista.year, this.vista.month, 1);
    return referencia.toLocaleString('es-CL', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
  }

  get anioActual(): number {
    return this.vista.year;
  }

  get esMesActual(): boolean {
    const hoy = new Date();
    return hoy.getFullYear() === this.vista.year && hoy.getMonth() === this.vista.month;
  }

  selectDay(day: CalendarDay): void {
    this.selectedDateKey = day.key;
    this.actualizarSeleccion(day.key);
    this.agendaForm.patchValue({ fecha: day.key });
  }

  toggleFormulario(): void {
    this.formularioVisible = !this.formularioVisible;
    this.exitoMensaje = '';
    this.errorFormulario = '';

    if (this.formularioVisible) {
      this.initFormularioConSeleccion();
    } else {
      this.agendaForm.reset();
    }
  }

  onClienteChange(clienteId: string): void {
    this.agendaForm.patchValue({ sucursalId: '' });
    if (!clienteId) {
      this.sucursalesDisponibles = [];
      return;
    }

    if (this.sucursalesCache.has(clienteId)) {
      this.sucursalesDisponibles = this.sucursalesCache.get(clienteId) ?? [];
      return;
    }

    this.apiService.sucursalesPorCliente(clienteId).subscribe({
      next: (sucursales) => {
        const opciones: SucursalOption[] =
          (sucursales ?? []).map((item: any) => ({
            id: item.id,
            sucursal: item.sucursal,
            estado: item.estado,
          })) ?? [];
        this.sucursalesCache.set(clienteId, opciones);
        this.sucursalesDisponibles = opciones;
      },
      error: () => {
        this.sucursalesDisponibles = [];
      },
    });
  }

  guardarVisita(): void {
    if (this.agendaForm.invalid || this.guardando) {
      this.agendaForm.markAllAsTouched();
      return;
    }

    const valor = this.agendaForm.value;
    const tecnicos = this.parseTecnicos(valor.tecnicos);

    if (tecnicos.length === 0) {
      this.errorFormulario = 'Ingresa al menos un técnico.';
      return;
    }

    const payload = {
      casaMatrizId: valor.clienteId,
      sucursalId: valor.sucursalId || null,
      fechaVisita: valor.fecha,
      horaLlegada: this.combinarFechaHora(valor.fecha, valor.horaLlegada),
      horaSalida: this.combinarFechaHora(valor.fecha, valor.horaSalida),
      tecnicos,
      descripcion: valor.descripcion.trim(),
      titulo: valor.titulo?.trim() || null,
    };

    this.guardando = true;
    this.errorFormulario = '';
    this.exitoMensaje = '';

    this.apiService
      .crearBitacora(payload)
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.exitoMensaje = 'Visita agendada correctamente.';
          this.formularioVisible = false;
          this.agendaForm.reset();
          this.refreshRequested.emit();
        },
        error: (error) => {
          console.error('Error al agendar visita desde el calendario', error);
          this.errorFormulario =
            error?.error?.error ?? 'No fue posible agendar la visita. Intenta nuevamente.';
        },
      });
  }

  private cargarClientes(): void {
    this.apiService.clientesBitacora().subscribe({
      next: (clientes) => {
        this.clientes = Array.isArray(clientes) ? clientes : [];
      },
      error: () => {
        this.clientes = [];
      },
    });
  }

  private regenerarMapaDeEventos(): void {
    this.eventosPorDia.clear();
    this._bitacoras.forEach((bitacora) => {
      const origen = bitacora.fechaVisita ?? bitacora.createdAt ?? '';
      if (!origen) {
        return;
      }
      const fecha = new Date(origen);
      if (Number.isNaN(fecha.getTime())) {
        return;
      }
      const clave = this.formatearClave(fecha);
      const lista = this.eventosPorDia.get(clave) ?? [];
      lista.push(bitacora);
      this.eventosPorDia.set(clave, lista);
    });

    if (this.selectedDateKey && !this.eventosPorDia.has(this.selectedDateKey)) {
      this.selectedDateKey = null;
    }

    this.construirCalendario();
  }

  private construirCalendario(): void {
    const primerDiaDelMes = new Date(this.vista.year, this.vista.month, 1);
    const primerDiaCalendario = this.obtenerInicioDeSemana(primerDiaDelMes);
    const dias: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const fecha = new Date(primerDiaCalendario);
      fecha.setDate(primerDiaCalendario.getDate() + i);
      const clave = this.formatearClave(fecha);
      const hoy = new Date();

      dias.push({
        date: fecha,
        key: clave,
        inMonth: fecha.getMonth() === this.vista.month,
        day: fecha.getDate(),
        eventCount: this.eventosPorDia.get(clave)?.length ?? 0,
        isToday:
          fecha.getFullYear() === hoy.getFullYear() &&
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getDate() === hoy.getDate(),
        isSelected: this.selectedDateKey === clave,
      });
    }

    this.calendario = dias;

    if (!this.selectedDateKey) {
      const hoy = new Date();
      if (this.vista.year === hoy.getFullYear() && this.vista.month === hoy.getMonth()) {
        this.selectedDateKey = this.formatearClave(hoy);
      } else {
        const primerDiaMes = new Date(this.vista.year, this.vista.month, 1);
        this.selectedDateKey = this.formatearClave(primerDiaMes);
      }
    }

    this.actualizarSeleccion(this.selectedDateKey);
  }

  private actualizarSeleccion(clave: string | null): void {
    this.calendario = this.calendario.map((dia) => ({
      ...dia,
      isSelected: clave === dia.key,
    }));

    if (!clave) {
      this.eventosSeleccionados = [];
      this.etiquetaSeleccion = 'selecciona una fecha';
      return;
    }

    this.eventosSeleccionados = this.eventosPorDia.get(clave) ?? [];
    this.eventosSeleccionados = [...this.eventosSeleccionados].sort((a, b) => {
      const fechaA = new Date(a.fechaVisita ?? a.createdAt ?? 0).getTime();
      const fechaB = new Date(b.fechaVisita ?? b.createdAt ?? 0).getTime();
      return fechaA - fechaB;
    });

    const fecha = this.parsearClave(clave);
    this.etiquetaSeleccion = fecha.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  }

  private initFormularioConSeleccion(): void {
    const clave = this.selectedDateKey ?? this.formatearClave(new Date());
    this.agendaForm.patchValue({
      fecha: clave,
      horaLlegada: '',
      horaSalida: '',
    });
  }

  private obtenerInicioDeSemana(fecha: Date): Date {
    const dia = fecha.getDay();
    const modificador = dia === 0 ? -6 : 1 - dia;
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() + modificador);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }

  private formatearClave(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parsearClave(clave: string): Date {
    const [year, month, day] = clave.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
  }

  private combinarFechaHora(fecha: string, hora: string): string {
    if (!fecha || !hora) {
      return '';
    }
    const combinada = new Date(`${fecha}T${hora}`);
    return combinada.toISOString();
  }

  private parseTecnicos(valor: string): string[] {
    return (valor || '')
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
