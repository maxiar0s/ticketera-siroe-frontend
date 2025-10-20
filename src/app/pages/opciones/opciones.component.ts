import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserPreferencesService, PreferenciasUsuario } from '../../services/user-preferences.service';
import { Cuenta } from '../../interfaces/Cuenta.interface';

type SeccionOpciones = 'general' | 'backups';

interface TarjetaConfiguracion {
  id: SeccionOpciones;
  icono: string;
  titulo: string;
  descripcion: string;
  accion: string;
}

@Component({
  selector: 'opciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './opciones.component.html',
  styleUrl: './opciones.component.css',
})
export class OpcionesComponent implements OnInit {
  preferenciasForm: FormGroup;
  seccionesDisponibles: SeccionOpciones[] = ['general'];
  seccionSeleccionada: SeccionOpciones = 'general';
  esCliente = false;
  mensajeGeneral = '';
  mensajeRespaldo = '';
  mensajeErrorRespaldo = '';
  usuarioId: number | null = null;
  perfilActual: Cuenta | null = null;
  cargando = true;
  tarjetas: Record<SeccionOpciones, TarjetaConfiguracion> = {
    general: {
      id: 'general',
      icono: '/assets/svg/settings.svg',
      titulo: 'Preferencias generales',
      descripcion: 'Define idioma, tema y notificaciones de tu cuenta.',
      accion: 'Editar preferencias',
    },
    backups: {
      id: 'backups',
      icono: '/assets/svg/database.svg',
      titulo: 'Datos y respaldos',
      descripcion: 'Genera copias de seguridad y restaura configuraciones.',
      accion: 'Gestionar respaldos',
    },
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private preferenciasService: UserPreferencesService
  ) {
    this.preferenciasForm = this.fb.group({
      tema: ['sistema'],
      idioma: ['es'],
      notificaciones: [true],
      newsletter: [false],
    });
  }

  ngOnInit(): void {
    this.esCliente = this.authService.esCliente();
    if (!this.esCliente) {
      this.seccionesDisponibles = ['general', 'backups'];
    }

    const token = this.authService.decodificarToken();
    if (token?.id) {
      this.usuarioId = token.id;
    }

    if (this.usuarioId !== null) {
      const preferencias = this.preferenciasService.obtenerPreferencias(this.usuarioId);
      this.preferenciasForm.patchValue(preferencias);
    }

    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        this.perfilActual = perfil;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  seleccionarSeccion(seccion: SeccionOpciones): void {
    this.seccionSeleccionada = seccion;
    this.mensajeRespaldo = '';
    this.mensajeErrorRespaldo = '';
    this.mensajeGeneral = '';
  }

  obtenerTarjetas(): TarjetaConfiguracion[] {
    return this.seccionesDisponibles.map((seccion) => this.tarjetas[seccion]);
  }

  guardarPreferencias(): void {
    if (this.usuarioId === null) {
      this.mensajeGeneral = 'No se pudo identificar la cuenta del usuario.';
      return;
    }

    const preferencias: PreferenciasUsuario = this.preferenciasForm.value;
    this.preferenciasService.guardarPreferencias(this.usuarioId, preferencias);
    this.mensajeGeneral = 'Preferencias guardadas correctamente.';
  }

  descargarRespaldo(): void {
    if (!this.perfilActual || this.usuarioId === null) {
      this.mensajeErrorRespaldo = 'No hay informacion disponible para generar el respaldo.';
      return;
    }

    const respaldo = {
      generadoEn: new Date().toISOString(),
      perfil: {
        id: this.perfilActual.id,
        nombre: this.perfilActual.name,
        correo: this.perfilActual.email,
        telefono: this.perfilActual.telefono,
        rol: this.perfilActual.tipoCuenta?.name ?? 'Usuario',
      },
      preferencias: this.preferenciasForm.value as PreferenciasUsuario,
    };

    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `respaldo-configuracion-${this.perfilActual.id}.json`;
    enlace.click();
    URL.revokeObjectURL(url);

    this.mensajeRespaldo = 'Respaldo generado correctamente.';
  }

  restaurarPreferencias(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || this.usuarioId === null) {
      return;
    }

    const archivo = input.files[0];
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const contenido = JSON.parse(lector.result as string);
        if (!contenido?.preferencias) {
          throw new Error('Estructura invalida.');
        }

        const preferencias = contenido.preferencias as PreferenciasUsuario;
        this.preferenciasService.guardarPreferencias(this.usuarioId as number, preferencias);
        this.preferenciasForm.patchValue(preferencias);
        this.mensajeRespaldo = 'Preferencias restauradas correctamente.';
        this.mensajeErrorRespaldo = '';
      } catch (_error) {
        this.mensajeRespaldo = '';
        this.mensajeErrorRespaldo = 'No se pudo procesar el archivo seleccionado.';
      } finally {
        input.value = '';
      }
    };
    lector.readAsText(archivo);
  }
}
