import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ClienteResumen } from '../../interfaces/cliente-resumen.interface';
import {
  DocumentoCliente,
  DocumentoClienteTipo,
} from '../../interfaces/documento-cliente.interface';
import { ApiService } from '../../services/api.service';

type ResumenTipoDocumento = Record<
  DocumentoClienteTipo | 'total',
  number
>;

@Component({
  selector: 'app-documentacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './documentacion.component.html',
  styleUrl: './documentacion.component.css',
})
export class DocumentacionComponent implements OnInit, OnDestroy {
  @ViewChild('archivoInput') archivoInput?: ElementRef<HTMLInputElement>;

  filtroForm: FormGroup;
  uploadForm: FormGroup;

  clientes: ClienteResumen[] = [];
  documentos: DocumentoCliente[] = [];

  paginaActual = 1;
  paginasTotales = 0;
  readonly limite = 10;

  cargandoDocumentos = false;
  cargandoClientes = false;
  subiendo = false;
  descargandoId: number | null = null;
  eliminandoId: number | null = null;

  mensajeError = '';
  mensajeExito = '';

  archivoSeleccionadoNombre = '';
  private archivoSeleccionado: File | null = null;

  resumenPorTipo: ResumenTipoDocumento = {
    total: 0,
    factura: 0,
    contrato: 0,
    otros: 0,
  };

  readonly tipoOpciones = [
    { value: 'factura', label: 'Factura' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'otros', label: 'Otros' },
  ] as const;

  private readonly destroy$ = new Subject<void>();
  private readonly maxFileSizeBytes = 20 * 1024 * 1024;

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.filtroForm = this.fb.group({
      clienteId: [''],
      tipo: [''],
      buscar: [''],
    });

    this.uploadForm = this.fb.group({
      clienteId: ['', Validators.required],
      tipo: ['factura', Validators.required],
      descripcion: [''],
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarDocumentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get puedeSubir(): boolean {
    return this.uploadForm.valid && !!this.archivoSeleccionado && !this.subiendo;
  }

  private cargarClientes(): void {
    this.cargandoClientes = true;
    this.apiService
      .clientesResumen()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.cargandoClientes = false))
      )
      .subscribe({
        next: (clientes) => {
          this.clientes = [...clientes].sort((a, b) =>
            a.razonSocial.localeCompare(b.razonSocial)
          );
        },
        error: () => {
          this.mensajeError = 'No se pudieron cargar los clientes.';
        },
      });
  }

  cargarDocumentos(): void {
    this.cargandoDocumentos = true;
    const filtros = this.filtroForm.value ?? {};
    const params = {
      pagina: this.paginaActual,
      limite: this.limite,
      clienteId: filtros.clienteId || '',
      tipo: filtros.tipo || '',
      buscar: filtros.buscar || '',
    };

    let debeRecargar = false;
    this.apiService
      .documentacionClientes(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoDocumentos = false;
          if (debeRecargar) {
            this.cargarDocumentos();
          }
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.documentos = Array.isArray(respuesta?.data)
            ? respuesta.data
            : [];
          this.paginasTotales = respuesta?.paginasTotales ?? 0;
          this.actualizarResumenTipos();

          if (
            this.paginasTotales > 0 &&
            this.paginaActual > this.paginasTotales
          ) {
            this.paginaActual = this.paginasTotales;
            debeRecargar = true;
          }
        },
        error: () => {
          this.mensajeError =
            'No se pudo obtener la documentación, intenta nuevamente.';
          this.documentos = [];
          this.paginasTotales = 0;
          this.actualizarResumenTipos();
          debeRecargar = false;
        },
      });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarDocumentos();
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      clienteId: '',
      tipo: '',
      buscar: '',
    });
    this.aplicarFiltros();
  }

  cambiarPagina(delta: number): void {
    const destino = this.paginaActual + delta;
    if (destino < 1 || (this.paginasTotales && destino > this.paginasTotales)) {
      return;
    }
    this.paginaActual = destino;
    this.cargarDocumentos();
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const archivo = input.files[0];
      if (archivo.size > this.maxFileSizeBytes) {
        this.mensajeError = 'El archivo supera los 20 MB permitidos.';
        this.mensajeExito = '';
        this.archivoSeleccionado = null;
        this.archivoSeleccionadoNombre = '';
        input.value = '';
        return;
      }
      this.archivoSeleccionado = archivo;
      this.archivoSeleccionadoNombre = archivo.name;
      this.mensajeError = '';
    } else {
      this.archivoSeleccionado = null;
      this.archivoSeleccionadoNombre = '';
    }
  }

  subirDocumento(): void {
    if (!this.puedeSubir) {
      return;
    }

    const { clienteId, tipo, descripcion } = this.uploadForm.value;
    const archivo = this.archivoSeleccionado;
    if (!clienteId || !tipo || !archivo) {
      this.mensajeError = 'Completa los campos requeridos antes de subir.';
      return;
    }

    const formData = new FormData();
    formData.append('clienteId', clienteId);
    formData.append('tipo', tipo);
    if (descripcion && descripcion.trim().length) {
      formData.append('descripcion', descripcion.trim());
    }
    formData.append('archivo', archivo);

    this.subiendo = true;
    this.apiService
      .crearDocumentoCliente(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.subiendo = false))
      )
      .subscribe({
        next: () => {
          this.mensajeExito = 'Documento almacenado correctamente.';
          this.mensajeError = '';
          this.resetFormularioCarga();
          this.paginaActual = 1;
          this.cargarDocumentos();
        },
        error: () => {
          this.mensajeError =
            'No se pudo subir el documento, intenta nuevamente.';
          this.mensajeExito = '';
        },
      });
  }

  descargarDocumento(documento: DocumentoCliente): void {
    if (!documento?.archivo) {
      return;
    }

    this.descargandoId = documento.id;
    this.apiService
      .signedUrl(documento.archivo)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.descargandoId = null))
      )
      .subscribe({
        next: (url) => {
          if (url) {
            window.open(url, '_blank');
          }
        },
        error: () => {
          this.mensajeError =
            'No pudimos obtener el enlace de descarga, inténtalo otra vez.';
        },
      });
  }

  eliminarDocumento(documento: DocumentoCliente): void {
    if (!documento?.id) {
      return;
    }

    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este documento?'
    );
    if (!confirmar) {
      return;
    }

    this.eliminandoId = documento.id;
    this.apiService
      .eliminarDocumentoCliente(documento.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.eliminandoId = null))
      )
      .subscribe({
        next: () => {
          this.mensajeExito = 'Documento eliminado correctamente.';
          this.mensajeError = '';
          this.cargarDocumentos();
        },
        error: () => {
          this.mensajeError = 'No fue posible eliminar el documento.';
          this.mensajeExito = '';
        },
      });
  }

  trackByDocumento = (_: number, documento: DocumentoCliente) => documento.id;

  tipoLabel(tipo: DocumentoClienteTipo): string {
    switch (tipo) {
      case 'factura':
        return 'Factura';
      case 'contrato':
        return 'Contrato';
      default:
        return 'Otros';
    }
  }

  tipoBadgeClass(tipo: DocumentoClienteTipo): string {
    return `tipo-chip ${tipo}`;
  }

  formatearPeso(bytes?: number | null): string {
    if (!bytes || bytes <= 0) {
      return '-';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const unidades = ['KB', 'MB', 'GB'];
    let valor = bytes / 1024;
    let unidad = 0;
    while (valor >= 1024 && unidad < unidades.length - 1) {
      valor /= 1024;
      unidad++;
    }
    return `${valor.toFixed(1)} ${unidades[unidad]}`;
  }

  private actualizarResumenTipos(): void {
    const resumen: ResumenTipoDocumento = {
      total: this.documentos.length,
      factura: 0,
      contrato: 0,
      otros: 0,
    };

    this.documentos.forEach((doc) => {
      const tipo = doc.tipo as DocumentoClienteTipo;
      if (resumen[tipo] !== undefined) {
        resumen[tipo] += 1;
      }
    });

    this.resumenPorTipo = resumen;
  }

  private resetFormularioCarga(): void {
    this.uploadForm.patchValue({
      tipo: 'factura',
      descripcion: '',
    });
    this.archivoSeleccionado = null;
    this.archivoSeleccionadoNombre = '';
    if (this.archivoInput?.nativeElement) {
      this.archivoInput.nativeElement.value = '';
    }
  }
}
