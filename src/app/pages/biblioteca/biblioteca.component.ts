import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import {
  BibliotecaProyecto,
  BibliotecaAdjunto,
} from '../../interfaces/biblioteca.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';

interface BibliotecaFormulario {
  id: FormControl<number | null>;
  casaMatrizId: FormControl<string>;
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  linkRepositorio: FormControl<string>;
  envVariables: FormControl<string>;
  credenciales: FormControl<string>;
  instruccionesInstalacion: FormControl<string>;
  instruccionesProd: FormControl<string>;
  manualUsuario: FormControl<string>;
  notasTecnicas: FormControl<string>;
  tecnologias: FormControl<string>;
}

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './biblioteca.component.html',
  styleUrls: ['./biblioteca.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // Lista de proyectos
  proyectos: BibliotecaProyecto[] = [];
  proyectosCargando = false;
  proyectosPagina = 1;
  proyectosPaginasTotales = 0;
  proyectosLimite = 10;
  proyectosBuscar = '';

  // Proyecto seleccionado
  selectedProyecto: BibliotecaProyecto | null = null;
  detallesCargando = false;

  // Modal
  modalAbierto = false;
  modalCargando = false;
  modoEdicion = false;

  // Clientes para el dropdown
  clientes: ClienteResumen[] = [];

  // Formulario
  bibliotecaForm!: FormGroup<BibliotecaFormulario>;

  // Archivos para subir
  // Archivos para subir por sección
  selectedFilesGeneral: File[] = [];
  selectedFilesEnv: File[] = [];
  selectedFilesInstalacion: File[] = [];
  selectedFilesProduccion: File[] = [];
  selectedFilesManual: File[] = [];
  selectedFilesCredenciales: File[] = [];

  // Tabs activa para le detalle
  tabActiva:
    | 'general'
    | 'repo'
    | 'env'
    | 'instalacion'
    | 'produccion'
    | 'manual'
    | 'credenciales'
    | 'notas'
    | 'adjuntos' = 'general';

  // Visibilidad env
  mostrarEnvVariables = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef, // Inyectar CDR
  ) {
    this.inicializarFormulario();
  }

  // ...

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarClientes();
  }

  private inicializarFormulario(): void {
    this.bibliotecaForm = this.fb.group({
      id: new FormControl<number | null>(null),
      casaMatrizId: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      nombre: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      descripcion: new FormControl<string>('', { nonNullable: true }),
      linkRepositorio: new FormControl<string>('', { nonNullable: true }),
      envVariables: new FormControl<string>('', { nonNullable: true }),
      credenciales: new FormControl<string>('', { nonNullable: true }),
      instruccionesInstalacion: new FormControl<string>('', {
        nonNullable: true,
      }),
      instruccionesProd: new FormControl<string>('', { nonNullable: true }),
      manualUsuario: new FormControl<string>('', { nonNullable: true }),
      notasTecnicas: new FormControl<string>('', { nonNullable: true }),
      tecnologias: new FormControl<string>('', { nonNullable: true }),
    });
  }

  cargarProyectos(pagina: number = 1): void {
    this.proyectosCargando = true;
    this.proyectosPagina = pagina;

    this.apiService
      .getBibliotecaProyectos({
        pagina,
        limite: this.proyectosLimite,
        buscar: this.proyectosBuscar,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.proyectos = respuesta.data || [];
          this.proyectosPaginasTotales = respuesta.paginasTotales || 0;
          this.proyectosCargando = false;

          // Si había un proyecto seleccionado, actualizarlo
          if (this.selectedProyecto) {
            const actualizado = this.proyectos.find(
              (p) => p.id === this.selectedProyecto?.id,
            );
            if (actualizado) {
              this.selectedProyecto = actualizado;
            }
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al cargar proyectos:', error);
          this.proyectosCargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  cargarClientes(): void {
    this.apiService
      .clientesResumen()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes || [];
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
        },
      });
  }

  buscar(): void {
    this.cargarProyectos(1);
  }

  limpiarBusqueda(): void {
    this.proyectosBuscar = '';
    this.cargarProyectos(1);
  }

  seleccionarProyecto(proyecto: BibliotecaProyecto): void {
    this.detallesCargando = true;
    this.apiService
      .getBibliotecaProyecto(proyecto.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          this.selectedProyecto = detalle;
          this.tabActiva = 'general';
          this.mostrarEnvVariables = false;
          this.detallesCargando = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al cargar detalle:', error);
          this.selectedProyecto = proyecto;
          this.detallesCargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  cerrarDetalle(): void {
    this.selectedProyecto = null;
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.bibliotecaForm.reset();
    this.selectedFilesGeneral = [];
    this.selectedFilesEnv = [];
    this.selectedFilesInstalacion = [];
    this.selectedFilesProduccion = [];
    this.selectedFilesManual = [];
    this.modalAbierto = true;
  }

  abrirModalEditar(proyecto: BibliotecaProyecto): void {
    this.modoEdicion = true;
    this.bibliotecaForm.patchValue({
      id: proyecto.id,
      casaMatrizId: proyecto.casaMatrizId,
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion || '',
      linkRepositorio: proyecto.linkRepositorio || '',
      envVariables: proyecto.envVariables || '',
      instruccionesInstalacion: proyecto.instruccionesInstalacion || '',
      instruccionesProd: proyecto.instruccionesProd || '',
      manualUsuario: proyecto.manualUsuario || '',
      credenciales: proyecto.credenciales || '',
      notasTecnicas: proyecto.notasTecnicas || '',
      tecnologias: (proyecto.tecnologias || []).join(', '),
    });
    this.selectedFilesGeneral = [];
    this.selectedFilesEnv = [];
    this.selectedFilesInstalacion = [];
    this.selectedFilesProduccion = [];
    this.selectedFilesManual = [];
    this.selectedFilesCredenciales = [];
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.bibliotecaForm.reset();
    this.selectedFilesGeneral = [];
    this.selectedFilesEnv = [];
    this.selectedFilesInstalacion = [];
    this.selectedFilesProduccion = [];
    this.selectedFilesManual = [];
    this.selectedFilesCredenciales = [];
  }

  onArchivoSeleccionado(
    event: Event,
    seccion:
      | 'general'
      | 'env'
      | 'instalacion'
      | 'produccion'
      | 'manual'
      | 'credenciales',
  ): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const nuevos = Array.from(input.files);
      switch (seccion) {
        case 'general':
          this.selectedFilesGeneral = [...this.selectedFilesGeneral, ...nuevos];
          break;
        case 'env':
          this.selectedFilesEnv = [...this.selectedFilesEnv, ...nuevos];
          break;
        case 'instalacion':
          this.selectedFilesInstalacion = [
            ...this.selectedFilesInstalacion,
            ...nuevos,
          ];
          break;
        case 'produccion':
          this.selectedFilesProduccion = [
            ...this.selectedFilesProduccion,
            ...nuevos,
          ];
          break;
        case 'manual':
          this.selectedFilesManual = [...this.selectedFilesManual, ...nuevos];
          break;
        case 'credenciales':
          this.selectedFilesCredenciales = [
            ...this.selectedFilesCredenciales,
            ...nuevos,
          ];
          break;
      }
    }
  }

  removerArchivoNuevo(
    index: number,
    seccion:
      | 'general'
      | 'env'
      | 'instalacion'
      | 'produccion'
      | 'manual'
      | 'credenciales',
  ): void {
    switch (seccion) {
      case 'general':
        this.selectedFilesGeneral.splice(index, 1);
        break;
      case 'env':
        this.selectedFilesEnv.splice(index, 1);
        break;
      case 'instalacion':
        this.selectedFilesInstalacion.splice(index, 1);
        break;
      case 'produccion':
        this.selectedFilesProduccion.splice(index, 1);
        break;
      case 'manual':
        this.selectedFilesManual.splice(index, 1);
        break;
      case 'credenciales':
        this.selectedFilesCredenciales.splice(index, 1);
        break;
    }
  }

  guardarProyecto(): void {
    if (this.bibliotecaForm.invalid) {
      return;
    }

    this.modalCargando = true;
    const formData = new FormData();
    const valores = this.bibliotecaForm.getRawValue();

    formData.append('casaMatrizId', valores.casaMatrizId);
    formData.append('nombre', valores.nombre);
    formData.append('descripcion', valores.descripcion);
    formData.append('linkRepositorio', valores.linkRepositorio);
    formData.append('envVariables', valores.envVariables);
    formData.append('credenciales', valores.credenciales);
    formData.append(
      'instruccionesInstalacion',
      valores.instruccionesInstalacion,
    );
    formData.append('instruccionesProd', valores.instruccionesProd);
    formData.append('manualUsuario', valores.manualUsuario);
    formData.append('notasTecnicas', valores.notasTecnicas);

    // Tecnologías como array JSON
    const tecnologiasArray = valores.tecnologias
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    formData.append('tecnologias', JSON.stringify(tecnologiasArray));

    // Agregar archivos por sección
    this.selectedFilesGeneral.forEach((f) =>
      formData.append('files_general', f),
    );
    this.selectedFilesEnv.forEach((f) => formData.append('files_env', f));
    this.selectedFilesInstalacion.forEach((f) =>
      formData.append('files_instalacion', f),
    );
    this.selectedFilesProduccion.forEach((f) =>
      formData.append('files_produccion', f),
    );
    this.selectedFilesManual.forEach((f) => formData.append('files_manual', f));
    this.selectedFilesCredenciales.forEach((f) =>
      formData.append('files_credenciales', f),
    );

    const operacion =
      this.modoEdicion && valores.id
        ? this.apiService.actualizarBibliotecaProyecto(valores.id, formData)
        : this.apiService.crearBibliotecaProyecto(formData);

    operacion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resultado) => {
        console.log('Proyecto guardado correctamente:', resultado);
        this.modalCargando = false;
        this.cerrarModal();
        this.cargarProyectos(this.proyectosPagina);
        if (this.selectedProyecto?.id === resultado.id) {
          this.selectedProyecto = resultado;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al guardar proyecto:', error);
        this.modalCargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  eliminarProyecto(proyecto: BibliotecaProyecto): void {
    if (!confirm(`¿Está seguro de eliminar "${proyecto.nombre}"?`)) {
      return;
    }

    this.apiService
      .eliminarBibliotecaProyecto(proyecto.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.selectedProyecto?.id === proyecto.id) {
            this.selectedProyecto = null;
          }
          this.cargarProyectos(this.proyectosPagina);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al eliminar proyecto:', error);
          this.cdr.markForCheck();
        },
      });
  }

  eliminarAdjunto(adjunto: BibliotecaAdjunto): void {
    if (!this.selectedProyecto) return;

    if (!confirm(`¿Eliminar el archivo "${adjunto.nombreArchivo}"?`)) {
      return;
    }

    this.apiService
      .eliminarAdjuntoBiblioteca(this.selectedProyecto.id, adjunto.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          if (this.selectedProyecto) {
            this.selectedProyecto.adjuntos =
              this.selectedProyecto.adjuntos.filter((a) => a.id !== adjunto.id);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al eliminar adjunto:', error);
          this.cdr.markForCheck();
        },
      });
  }

  abrirAdjunto(adjunto: BibliotecaAdjunto): void {
    if (adjunto.archivo) {
      window.open(adjunto.archivo, '_blank');
    }
  }

  getAdjuntosPorSeccion(seccion: string): BibliotecaAdjunto[] {
    if (!this.selectedProyecto || !this.selectedProyecto.adjuntos) return [];
    if (seccion === 'general') {
      // General incluye los que tienen 'general' o null (retrocompatibilidad)
      return this.selectedProyecto.adjuntos.filter(
        (a) => a.seccion === 'general' || !a.seccion,
      );
    }
    return this.selectedProyecto.adjuntos.filter((a) => a.seccion === seccion);
  }

  copiarAlPortapapeles(texto: string | null): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      // Notificación silenciosa
    });
  }

  toggleEnvVariables(): void {
    this.mostrarEnvVariables = !this.mostrarEnvVariables;
  }

  obtenerNombreCliente(casaMatrizId: string): string {
    const cliente = this.clientes.find((c) => c.id === casaMatrizId);
    return cliente?.razonSocial || 'Cliente desconocido';
  }

  esAdmin(): boolean {
    return this.authService.esAdministrador();
  }

  // Paginación
  paginaAnterior(): void {
    if (this.proyectosPagina > 1) {
      this.cargarProyectos(this.proyectosPagina - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.proyectosPagina < this.proyectosPaginasTotales) {
      this.cargarProyectos(this.proyectosPagina + 1);
    }
  }
}
