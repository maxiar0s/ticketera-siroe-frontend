import { normalizarServicios } from '../../utils/servicios.util';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SignalService } from '../../services/signal.service';
import { Cuenta } from '../../interfaces/Cuenta.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import { FEATURES } from '../../config/features';
import {
  obtenerIniciales,
  generarColorDesdeTexto,
} from '../../utils/avatar.util';
import {
  normalizarDatosBancarios,
  tieneDatosBancarios,
} from '../../utils/datos-bancarios.util';

@Component({
  selector: 'perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  usuario: Cuenta | null = null;
  perfilForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';
  avatarIniciales = '?';
  avatarColor = 'var(--color-primary)';
  esCliente = false;
  readonly features = FEATURES;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private signalService: SignalService
  ) {
    this.perfilForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)],
      ],
    });

    this.passwordForm = this.fb.group({
      passwordActual: [''],
      nuevoPassword: ['', [Validators.minLength(8)]],
      confirmarPassword: [''],
    });
  }

  ngOnInit(): void {
    this.signalService.updateData('Perfil');
    this.cargarPerfil();
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const nuevoPassword = this.passwordForm.get('nuevoPassword')?.value?.trim();
    const confirmarPassword = this.passwordForm
      .get('confirmarPassword')
      ?.value?.trim();

    const passwordActual = this.passwordForm
      .get('passwordActual')
      ?.value?.trim();
    const estaCambiandoPassword =
      !!nuevoPassword || !!confirmarPassword || !!passwordActual;

    if (this.esCliente && !estaCambiandoPassword) {
      this.mensajeError = 'Como cliente solo puedes actualizar tu contrasena.';
      return;
    }

    if (nuevoPassword || confirmarPassword) {
      if (nuevoPassword !== confirmarPassword) {
        this.mensajeError =
          'La nueva contrasena y la confirmacion no coinciden.';
        return;
      }
      if (!passwordActual) {
        this.mensajeError =
          'Debes ingresar la contrasena actual para realizar el cambio.';
        return;
      }
    }

    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const perfilValue = this.perfilForm.getRawValue();
    const payload: any = {};

    if (!this.esCliente) {
      payload.name = perfilValue.name?.trim();
      payload.email = perfilValue.email?.trim();
      if (
        perfilValue.telefono !== undefined &&
        perfilValue.telefono !== null &&
        perfilValue.telefono !== ''
      ) {
        payload.telefono = Number(perfilValue.telefono);
      } else {
        payload.telefono = null;
      }
    }

    if (nuevoPassword) {
      payload.passwordActual = passwordActual;
      payload.nuevoPassword = nuevoPassword;
    }

    if (!Object.keys(payload).length) {
      this.mensajeError = 'No hay cambios para guardar.';
      this.guardando = false;
      return;
    }

    this.apiService.actualizarPerfil(payload).subscribe({
      next: (respuesta) => {
        const perfilActualizado: Cuenta | undefined = respuesta?.perfil;
        if (perfilActualizado) {
          this.usuario = perfilActualizado;
          this.perfilForm.patchValue({
            name: perfilActualizado.name,
            email: perfilActualizado.email,
            telefono: perfilActualizado.telefono?.toString() ?? '',
          });
          this.actualizarAvatar(perfilActualizado);
        }
        this.mensajeExito =
          respuesta?.mensaje ?? 'Perfil actualizado correctamente.';
        this.passwordForm.reset();
        this.guardando = false;
      },
      error: (error) => {
        const mensaje =
          error?.error?.error ??
          'No fue posible actualizar el perfil. Intenta nuevamente.';
        this.mensajeError = mensaje;
        this.guardando = false;
      },
    });
  }

  private cargarPerfil(): void {
    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        const clientesAutorizados = (perfil.clientesAutorizados ?? []).map(
          (cliente) => ({
            ...cliente,
            servicios: normalizarServicios(cliente.servicios),
            datosBancarios: normalizarDatosBancarios(cliente.datosBancarios),
          })
        );
        const perfilNormalizado: Cuenta = {
          ...perfil,
          clientesAutorizados,
        };

        this.usuario = perfilNormalizado;
        this.esCliente = perfilNormalizado.tipoCuentaId === 4;
        this.perfilForm.patchValue({
          name: perfilNormalizado.name,
          email: perfilNormalizado.email,
          telefono: perfilNormalizado.telefono?.toString() ?? '',
        });
        if (this.esCliente) {
          this.perfilForm.disable({ emitEvent: false });
        } else {
          this.perfilForm.enable({ emitEvent: false });
        }
        this.actualizarAvatar(perfilNormalizado);
        this.loading = false;
      },
      error: () => {
        this.mensajeError = 'No se pudo cargar el perfil de usuario.';
        this.loading = false;
      },
    });
  }

  serviciosCliente(cliente: ClienteResumen | null | undefined): string {
    const servicios = normalizarServicios(cliente?.servicios);
    if (!servicios.length) {
      return 'Sin servicios registrados';
    }
    return servicios.join(', ');
  }

  clienteTieneDatosBancarios(
    cliente: ClienteResumen | null | undefined
  ): boolean {
    return tieneDatosBancarios(cliente?.datosBancarios);
  }

  mostrarDatoBancario(valor?: string | null): string {
    return valor && valor.trim().length ? valor : 'No registrado';
  }

  private actualizarAvatar(perfil: Cuenta | null): void {
    const referencia = perfil?.name ?? perfil?.email ?? '';
    this.avatarIniciales = obtenerIniciales(referencia);
    this.avatarColor = generarColorDesdeTexto(referencia);
  }
}
