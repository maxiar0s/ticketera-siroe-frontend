import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SignalService } from '../../services/signal.service';
import {
  UserPreferencesService,
  PreferenciasUsuario,
} from '../../services/user-preferences.service';
import { Cuenta } from '../../interfaces/Cuenta.interface';
import { UsuariosComponent } from '../admin/usuarios/usuarios.component';
import { TiposEquiposComponent } from '../admin/tipos-equipos/tipos-equipos.component';

type SeccionOpciones = 'general' | 'usuarios' | 'tiposEquipos' | 'backups';

interface TabConfiguracion {
  id: SeccionOpciones;
  icono: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'opciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UsuariosComponent,
    TiposEquiposComponent,
  ],
  templateUrl: './opciones.component.html',
  styleUrl: './opciones.component.css',
})
export class OpcionesComponent implements OnInit {
  preferenciasForm: FormGroup;
  seccionesDisponibles: SeccionOpciones[] = ['general'];
  seccionSeleccionada: SeccionOpciones = 'general';
  esCliente = false;
  esAdministrador = false;
  mensajeGeneral = '';
  mensajeRespaldo = '';
  mensajeErrorRespaldo = '';
  usuarioId: number | null = null;
  perfilActual: Cuenta | null = null;
  cargando = true;
  tabs: Record<SeccionOpciones, TabConfiguracion> = {
    general: {
      id: 'general',
      icono: '/assets/svg/settings.svg',
      titulo: 'Preferencias generales',
      descripcion: 'Define idioma, tema y notificaciones de tu cuenta.',
    },
    usuarios: {
      id: 'usuarios',
      icono: '/assets/svg/usuarios.svg',
      titulo: 'Usuarios',
      descripcion: 'Administra cuentas, roles y accesos del equipo.',
    },
    tiposEquipos: {
      id: 'tiposEquipos',
      icono: '/assets/svg/tipo-de-equipo.svg',
      titulo: 'Tipos de equipos',
      descripcion: 'Configura tipos, campos y departamentos disponibles.',
    },
    backups: {
      id: 'backups',
      icono: '/assets/svg/download.svg',
      titulo: 'Datos y respaldos',
      descripcion: 'Genera copias de seguridad y restaura configuraciones.',
    },
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private signalService: SignalService,
    private preferenciasService: UserPreferencesService
  ) {
    this.preferenciasForm = this.fb.group({
      tema: ['claro'],
      idioma: ['es'],
      notificaciones: [true],
      newsletter: [false],
    });
  }

  ngOnInit(): void {
    this.signalService.updateData('Configuracion');
    this.esCliente = this.authService.esCliente();
    this.esAdministrador = this.authService.esAdministrador();
    if (!this.esCliente) {
      this.seccionesDisponibles = ['general', 'backups'];
    }
    if (this.esAdministrador) {
      this.seccionesDisponibles = ['general', 'usuarios', 'tiposEquipos', 'backups'];
    }

    const token = this.authService.decodificarToken();
    if (token?.id) {
      this.usuarioId = token.id;
    }

    if (this.usuarioId !== null) {
      const preferencias = this.preferenciasService.obtenerPreferencias(
        this.usuarioId
      );
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

  obtenerTabs(): TabConfiguracion[] {
    return this.seccionesDisponibles.map((seccion) => this.tabs[seccion]);
  }

  guardarPreferencias(): void {
    if (this.usuarioId === null) {
      this.mensajeGeneral = 'No se pudo identificar la cuenta del usuario.';
      return;
    }

    const preferencias: PreferenciasUsuario = this.preferenciasForm.value;
    this.preferenciasService.guardarPreferencias(this.usuarioId, preferencias);

    // Apply theme immediately
    this.preferenciasService.aplicarTema(preferencias.tema);

    this.mensajeGeneral = 'Preferencias guardadas correctamente.';
  }

  descargarRespaldo(): void {
    if (!this.perfilActual || this.usuarioId === null) {
      this.mensajeErrorRespaldo =
        'No hay informacion disponible para generar el respaldo.';
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

    const blob = new Blob([JSON.stringify(respaldo, null, 2)], {
      type: 'application/json',
    });
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
        this.preferenciasService.guardarPreferencias(
          this.usuarioId as number,
          preferencias
        );
        this.preferenciasForm.patchValue(preferencias);
        this.mensajeRespaldo = 'Preferencias restauradas correctamente.';
        this.mensajeErrorRespaldo = '';
      } catch (_error) {
        this.mensajeRespaldo = '';
        this.mensajeErrorRespaldo =
          'No se pudo procesar el archivo seleccionado.';
      } finally {
        input.value = '';
      }
    };
    lector.readAsText(archivo);
  }
}
