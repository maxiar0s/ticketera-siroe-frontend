import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  BibliotecaCategoria,
} from '../../interfaces/biblioteca.interface';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';

interface BibliotecaFormulario {
  id: FormControl<number | null>;
  casaMatrizId: FormControl<string>;
  categoriaId: FormControl<string>;
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
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

  // Categorías
  categorias: BibliotecaCategoria[] = [];
  modalCategoriaAbierto = false;
  vistaModalCategoria: 'lista' | 'formulario' = 'lista';
  categoriaEnEdicion: BibliotecaCategoria | null = null;
  categoriaFormNombre = '';
  categoriaFormColor = '#6366f1';
  categoriaFormTabs: Array<{
    id: string;
    nombre: string;
    tipoTexto: 'normal' | 'privado' | null;
    permiteAdjuntos: boolean;
  }> = [];
  categoriaNombreDuplicado = false;
  categoriaCargando = false;

  // Formulario
  bibliotecaForm!: FormGroup<BibliotecaFormulario>;

  // Categoría seleccionada en el formulario
  categoriaSeleccionada: BibliotecaCategoria | null = null;

  // Contenido dinámico por columna { columnaId: { texto: '' } }
  contenidoColumnas: Record<string, { texto: string }> = {};

  // Archivos por columna { columnaId: File[] }
  archivosPorColumna: Record<string, File[]> = {};

  // Tabs activa para le detalle
  tabActiva: string = 'general';

  // Visibilidad contenido privado
  mostrarContenidoPrivado: Record<string, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef, // Inyectar CDR
  ) {
    this.inicializarFormulario();
  }

  // ...

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarClientes();
    this.cargarCategorias();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const rawProyectoId = params.get('proyectoId');
        if (!rawProyectoId) {
          return;
        }

        const proyectoId = Number(rawProyectoId);
        if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
          return;
        }

        if (this.selectedProyecto?.id === proyectoId) {
          return;
        }

        this.abrirProyectoDesdeRuta(proyectoId);
      });
  }

  private abrirProyectoDesdeRuta(proyectoId: number): void {
    this.detallesCargando = true;
    this.apiService
      .getBibliotecaProyecto(proyectoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          this.selectedProyecto = detalle;
          if (detalle.categoria?.columnas?.length) {
            this.tabActiva = detalle.categoria.columnas[0].id;
          } else {
            this.tabActiva = 'general';
          }
          this.mostrarContenidoPrivado = {};
          this.detallesCargando = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al abrir proyecto desde ruta:', error);
          this.detallesCargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  private inicializarFormulario(): void {
    this.bibliotecaForm = this.fb.group({
      id: new FormControl<number | null>(null),
      casaMatrizId: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      categoriaId: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      nombre: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      descripcion: new FormControl<string>('', { nonNullable: true }),
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
          // Establecer tab activa según primera columna de la categoría
          if (detalle.categoria?.columnas?.length) {
            this.tabActiva = detalle.categoria.columnas[0].id;
          } else {
            this.tabActiva = 'general';
          }
          this.mostrarContenidoPrivado = {};
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

  // Load categories
  cargarCategorias(): void {
    this.apiService
      .getBibliotecaCategorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categorias) => {
          this.categorias = categorias || [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
        },
      });
  }

  // =====================================================
  // GESTIÓN DE CATEGORÍAS
  // =====================================================

  abrirModalCategoria(): void {
    this.modalCategoriaAbierto = true;
    this.vistaModalCategoria = 'lista';
    this.resetFormCategoria();
  }

  cerrarModalCategoria(): void {
    this.modalCategoriaAbierto = false;
    this.vistaModalCategoria = 'lista';
    this.resetFormCategoria();
  }

  resetFormCategoria(): void {
    this.categoriaEnEdicion = null;
    this.categoriaFormNombre = '';
    this.categoriaFormColor = '#6366f1';
    this.categoriaFormTabs = [];
    this.categoriaNombreDuplicado = false;
  }

  nuevaCategoria(): void {
    this.vistaModalCategoria = 'formulario';
    this.categoriaEnEdicion = null;
    this.categoriaFormNombre = '';
    this.categoriaFormColor = '#6366f1';
    this.categoriaFormTabs = [
      {
        id: 'general',
        nombre: 'General',
        tipoTexto: 'normal',
        permiteAdjuntos: false,
      },
      {
        id: 'adjuntos',
        nombre: 'Adjuntos',
        tipoTexto: null,
        permiteAdjuntos: true,
      },
    ];
    this.categoriaNombreDuplicado = false;
  }

  editarCategoria(categoria: BibliotecaCategoria): void {
    this.vistaModalCategoria = 'formulario';
    this.categoriaEnEdicion = categoria;
    this.categoriaFormNombre = categoria.nombre;
    this.categoriaFormColor = categoria.color || '#6366f1';
    this.categoriaFormTabs = (categoria.columnas || []).map((col) => ({
      id: col.id,
      nombre: col.nombre,
      tipoTexto: col.tipoTexto as 'normal' | 'privado' | null,
      permiteAdjuntos: col.permiteAdjuntos,
    }));
    this.categoriaNombreDuplicado = false;
  }

  volverListaCategorias(): void {
    this.vistaModalCategoria = 'lista';
    this.resetFormCategoria();
  }

  validarNombreCategoria(): void {
    if (!this.categoriaFormNombre.trim()) {
      this.categoriaNombreDuplicado = false;
      return;
    }
    const nombreLower = this.categoriaFormNombre.trim().toLowerCase();
    this.categoriaNombreDuplicado = this.categorias.some(
      (cat) =>
        cat.nombre.toLowerCase() === nombreLower &&
        cat.id !== this.categoriaEnEdicion?.id,
    );
  }

  agregarTab(): void {
    const nuevoId = `tab_${Date.now()}`;
    this.categoriaFormTabs.push({
      id: nuevoId,
      nombre: '',
      tipoTexto: 'normal',
      permiteAdjuntos: false,
    });
  }

  eliminarTab(index: number): void {
    if (this.categoriaFormTabs.length > 1) {
      this.categoriaFormTabs.splice(index, 1);
    }
  }

  guardarCategoria(): void {
    if (!this.categoriaFormNombre.trim() || this.categoriaNombreDuplicado)
      return;
    if (this.categoriaFormTabs.length === 0) return;

    this.categoriaCargando = true;

    const payload = {
      nombre: this.categoriaFormNombre.trim(),
      color: this.categoriaFormColor,
      columnas: this.categoriaFormTabs.map((tab, index) => ({
        id: tab.id,
        nombre: tab.nombre || `Tab ${index + 1}`,
        tipoTexto: tab.tipoTexto,
        permiteAdjuntos: tab.permiteAdjuntos,
        orden: index,
      })),
    };

    const request$ = this.categoriaEnEdicion
      ? this.apiService.actualizarBibliotecaCategoria(
          this.categoriaEnEdicion.id,
          payload,
        )
      : this.apiService.crearBibliotecaCategoria(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.categoriaCargando = false;
        this.vistaModalCategoria = 'lista';
        this.resetFormCategoria();
        this.cargarCategorias();
      },
      error: (error) => {
        this.categoriaCargando = false;
        console.error('Error al guardar categoría:', error);
      },
    });
  }

  eliminarCategoria(categoria: BibliotecaCategoria): void {
    if (
      !confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)
    )
      return;

    this.apiService
      .eliminarBibliotecaCategoria(categoria.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cargarCategorias();
        },
        error: (error) => {
          console.error('Error al eliminar categoría:', error);
          alert(error.error?.error || 'Error al eliminar categoría');
        },
      });
  }

  cerrarDetalle(): void {
    this.selectedProyecto = null;
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.bibliotecaForm.reset();
    this.categoriaSeleccionada = null;
    this.contenidoColumnas = {};
    this.archivosPorColumna = {};
    this.modalAbierto = true;
  }

  abrirModalEditar(proyecto: BibliotecaProyecto): void {
    this.modoEdicion = true;
    this.bibliotecaForm.patchValue({
      id: proyecto.id,
      casaMatrizId: proyecto.casaMatrizId || '',
      categoriaId: proyecto.categoriaId ? proyecto.categoriaId.toString() : '',
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion || '',
    });
    // Cargar categoría seleccionada y contenido
    this.categoriaSeleccionada =
      this.categorias.find((c) => c.id === proyecto.categoriaId) || null;
    this.contenidoColumnas = {};
    this.archivosPorColumna = {};
    // Inicializar contenido desde el proyecto
    if (this.categoriaSeleccionada) {
      for (const col of this.categoriaSeleccionada.columnas) {
        this.contenidoColumnas[col.id] = {
          texto: proyecto.contenido?.[col.id]?.texto || '',
        };
        if (col.permiteAdjuntos) {
          this.archivosPorColumna[col.id] = [];
        }
      }
    }
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.bibliotecaForm.reset();
    this.categoriaSeleccionada = null;
    this.contenidoColumnas = {};
    this.archivosPorColumna = {};
  }

  // Método para cambio de categoría en el formulario
  onCategoriaChange(): void {
    const catId = this.bibliotecaForm.get('categoriaId')?.value;
    this.categoriaSeleccionada =
      this.categorias.find((c) => c.id.toString() === catId) || null;
    this.contenidoColumnas = {};
    this.archivosPorColumna = {};
    // Inicializar estructura para cada columna
    if (this.categoriaSeleccionada) {
      for (const col of this.categoriaSeleccionada.columnas) {
        this.contenidoColumnas[col.id] = { texto: '' };
        if (col.permiteAdjuntos) {
          this.archivosPorColumna[col.id] = [];
        }
      }
    }
    this.cdr.markForCheck();
  }

  onArchivoSeleccionadoColumna(event: Event, columnaId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const nuevos = Array.from(input.files);
      if (!this.archivosPorColumna[columnaId]) {
        this.archivosPorColumna[columnaId] = [];
      }
      this.archivosPorColumna[columnaId] = [
        ...this.archivosPorColumna[columnaId],
        ...nuevos,
      ];
    }
  }

  removerArchivoColumna(index: number, columnaId: string): void {
    if (this.archivosPorColumna[columnaId]) {
      this.archivosPorColumna[columnaId].splice(index, 1);
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
    formData.append('categoriaId', valores.categoriaId);
    formData.append('nombre', valores.nombre);
    formData.append('descripcion', valores.descripcion);

    // Enviar contenido dinámico como JSON
    formData.append('contenido', JSON.stringify(this.contenidoColumnas));

    // Agregar archivos por columna
    for (const columnaId of Object.keys(this.archivosPorColumna)) {
      for (const archivo of this.archivosPorColumna[columnaId]) {
        formData.append(`files_${columnaId}`, archivo);
      }
    }

    const operacion =
      this.modoEdicion && valores.id
        ? this.apiService.actualizarBibliotecaProyecto(valores.id, formData)
        : this.apiService.crearBibliotecaProyecto(formData);

    operacion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resultado) => {
        console.log('Documentación guardada correctamente:', resultado);
        this.modalCargando = false;
        this.cerrarModal();
        this.cargarProyectos(this.proyectosPagina);
        if (this.selectedProyecto?.id === resultado.id) {
          this.selectedProyecto = resultado;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al guardar documentación:', error);
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

  toggleContenidoPrivado(columnaId: string): void {
    this.mostrarContenidoPrivado[columnaId] =
      !this.mostrarContenidoPrivado[columnaId];
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
