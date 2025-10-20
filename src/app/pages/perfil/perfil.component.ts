import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Cuenta } from '../../interfaces/Cuenta.interface';
import { obtenerIniciales, generarColorDesdeTexto } from '../../utils/avatar.util';

@Component({
  selector: 'perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
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
  avatarColor = '#b71653';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.perfilForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
    });

    this.passwordForm = this.fb.group({
      passwordActual: [''],
      nuevoPassword: ['', [Validators.minLength(8)]],
      confirmarPassword: [''],
    });
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const nuevoPassword = this.passwordForm.get('nuevoPassword')?.value?.trim();
    const confirmarPassword = this.passwordForm.get('confirmarPassword')?.value?.trim();

    if (nuevoPassword || confirmarPassword) {
      if (nuevoPassword !== confirmarPassword) {
        this.mensajeError = 'La nueva contrasena y la confirmacion no coinciden.';
        return;
      }
      if (!this.passwordForm.get('passwordActual')?.value) {
        this.mensajeError = 'Debes ingresar la contrasena actual para realizar el cambio.';
        return;
      }
    }

    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const payload: any = {
      ...this.perfilForm.value,
      telefono: Number(this.perfilForm.value.telefono),
    };

    if (nuevoPassword) {
      payload.passwordActual = this.passwordForm.get('passwordActual')?.value;
      payload.nuevoPassword = nuevoPassword;
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
        this.mensajeExito = respuesta?.mensaje ?? 'Perfil actualizado correctamente.';
        this.passwordForm.reset();
        this.guardando = false;
      },
      error: (error) => {
        const mensaje = error?.error?.error ?? 'No fue posible actualizar el perfil. Intenta nuevamente.';
        this.mensajeError = mensaje;
        this.guardando = false;
      },
    });
  }

  private cargarPerfil(): void {
    this.apiService.perfilActual().subscribe({
      next: (perfil) => {
        this.usuario = perfil;
        this.perfilForm.patchValue({
          name: perfil.name,
          email: perfil.email,
          telefono: perfil.telefono?.toString() ?? '',
        });
        this.actualizarAvatar(perfil);
        this.loading = false;
      },
      error: () => {
        this.mensajeError = 'No se pudo cargar el perfil de usuario.';
        this.loading = false;
      },
    });
  }

  private actualizarAvatar(perfil: Cuenta | null): void {
    const referencia = perfil?.name ?? perfil?.email ?? '';
    this.avatarIniciales = obtenerIniciales(referencia);
    this.avatarColor = generarColorDesdeTexto(referencia);
  }
}

