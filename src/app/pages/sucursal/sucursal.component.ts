import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { TableComponent } from './table/table.component';
import { SignalService } from '../../services/signal.service';
import { ApiService } from '../../services/api.service';
import { Sucursal } from '../../interfaces/Sucursal.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonsComponent } from './options/options.component';
import { OptionsComponent } from '../../shared/options/options.component';
import { ImprimirEquipo } from '../../interfaces/ImprimirEquipo.interface';
import { Equipo } from '../../interfaces/equipo.interface';
import { EstadoEquipo } from '../../interfaces/estado-equipo.interface';
import { LoaderService } from '../../services/loader.service';
import { NavegationComponent } from '../../shared/navegation/navegation.component';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EquiposFiltersComponent } from './filters/filters.component';
import { EquipoFiltros } from '../../interfaces/equipo-filtros.interface';
import { normalizarEsArriendo, normalizarServicios } from '../../utils/servicios.util';
import { EquipoFormField } from '../../interfaces/EquipoForm.interface';
import { CampoColor, CampoPresetOption, CampoStandard } from '../../interfaces/campo.interface';

interface EquipoExcelRow {
  Numero: number;
  CodigoID: string;
  Estado: string;
  TipoEquipo: string;
  FechaIngreso: string;
  Departamento: string;
  Usuario: string;
  Marca: string;
  Modelo: string;
  NumeroSerie: string;
  Procesador: string;
  VelocidadProcesador: string | number;
  RAM: string | number;
  TipoAlmacenamiento: string;
  CantidadAlmacenamiento: string | number;
  SistemaOperativo: string;
  Ofimatica: string;
  Antivirus: string;
  Observaciones: string;
}

@Component({
  selector: 'sucursal',
  standalone: true,
  imports: [
    HeaderComponent,
    TableComponent,
    CommonModule,
    ButtonsComponent,
    OptionsComponent,
    EquiposFiltersComponent,
    NavegationComponent,
  ],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent {
  // Elementos para el paginador
  public paginaActual:        number = 1;
  public paginas:             number = 1;
  // Filtro de equipos
  public option!:             string;
  // Arreglo de los equipos
  public sucursal?:           Sucursal;
  public equipos:             Equipo[] | undefined = undefined;
  public obtainedEquipments:  boolean = false;
  public estado:              boolean = false;
  public Title:               boolean = false;
  public cerrarModal!:        boolean;
  public clienteTieneArriendo: boolean = false;

  public Devices:       ImprimirEquipo[] = [];
  public filtrosEquipos: EquipoFiltros = {};
  private estadosEquipoCache: EstadoEquipo[] = [];
  private camposTipoCache = new Map<number, EquipoFormField[]>();
  private readonly coloresPorCriticidad: Record<CampoColor, string> = {
    verde: 'FF22C55E',
    amarillo: 'FFFACC15',
    rojo: 'FFDC2626',
  };

  constructor(
    private apiService:     ApiService,
    private signalService:  SignalService,
    public loaderService :  LoaderService,
    private route:          ActivatedRoute,
    private router:         Router
  ) {}

  ngOnInit() {
    this.cambiarSeleccion();
  }

  // Metodo para obtener el ID de la sucursal actual de la ruta
  getSucursalId(): string {
    let id = '';
    this.route.params.subscribe(params => {
      id = params['id'];
    });
    return id;
  }

  crearEquipos(datos: any) {
    this.cerrarModal = true;
    const { cantidad } = datos;
    const payloadBase = {
      ...datos,
      esArriendo: this.clienteTieneArriendo ? !!datos?.esArriendo : false,
    };

    const solicitudes = Array.from({ length: cantidad }, () =>
      this.apiService.createEquiptment(payloadBase)
    );

    forkJoin(solicitudes).subscribe({
      next: (respuestas) => {
        respuestas.forEach((respuesta, index) => {
          if (respuesta?.error) {
            console.error(`Error en el equipo ${index + 1}:`, respuesta.error);
          } else {
            console.log(`Equipo ${index + 1} creado exitosamente:`, respuesta);
          }
        });
      },
      error: (error: unknown) => {
        console.error('Error general al crear equipos:', error);
      },
      complete: () => {
        console.log('Proceso de creacion de equipos completado.');
        this.cerrarModal = false;
        this.cambiarSeleccion();
      }
    });
  }

  selectedOption(value: string) {
    this.option = value;
    this.equipos = undefined;
    this.paginaActual = 1;
    this.paginas = 1;
    this.cambiarSeleccion();
  }

  onFiltrosChange(filtros: EquipoFiltros): void {
    this.filtrosEquipos = { ...filtros };
    this.paginaActual = 1;
    this.paginas = 1;
    this.cambiarSeleccion();
  }

  cambiarSeleccion() {
    this.equipos = undefined;
    this.loaderService.showSection();
    this.obtainedEquipments = false;
    this.clienteTieneArriendo = false;

    if (!this.Title) {
      this.signalService.updateData('');
    }

    const params = this.route.snapshot.params as { [key: string]: string };
    const id = params['id'];
    const idCliente = params['idCliente'];

    if (!id) {
      this.loaderService.hideSection();
      return;
    }

    this.apiService
      .sucursal(id, this.paginaActual, this.option ?? '', this.filtrosEquipos)
      .subscribe({
        next: (respuesta) => {
          const { sucursal, paginas } = respuesta;

          if (!sucursal) {
            if (idCliente) {
              this.router.navigate([`/clientes/${idCliente}`]);
            }
            return;
          }

          if (!this.Title) {
            this.headerTitle(sucursal.casaMatriz.razonSocial);
          }

          const serviciosCliente = normalizarServicios(sucursal.casaMatriz?.servicios);
          const equiposNormalizados = this.ordenarEquiposPorCodigo(sucursal.equipos ?? []).map(
            (equipo) => ({
              ...equipo,
              esArriendo: normalizarEsArriendo(equipo.esArriendo),
            })
          );

          this.sucursal = {
            ...sucursal,
            casaMatriz: {
              ...sucursal.casaMatriz,
              servicios: serviciosCliente,
            },
            equipos: equiposNormalizados,
          };
          this.clienteTieneArriendo = this.incluyeArriendo(serviciosCliente);
          this.equipos = equiposNormalizados;
          this.Devices = [];

          this.paginas = paginas;

          this.obtainedEquipments = true;
          if (sucursal.estado !== 3) {
            this.estado = true;
          }

          this.loaderService.hideSection();
        },
        error: (error: unknown) => {
          console.error('Error al obtener sucursales', error);
          this.loaderService.hideSection();
        },
      });
  }

  headerTitle(value: string) {
    this.signalService.updateData(value);
    this.Title = true;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.paginas) {
      this.paginaActual = pagina;
      this.cambiarSeleccion();
    }
  }

  nextPage(): void {
    if (this.paginaActual < this.paginas) {
      this.paginaActual++;
      this.cambiarSeleccion();
    }
  }

  prevPage(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cambiarSeleccion();
    }
  }

  selectedDevices(devices: ImprimirEquipo[]) {
    this.Devices = [...devices];
  }

  eliminarEquiposSeleccionados(ids: number[]): void {
    if (!ids || ids.length === 0) {
      return;
    }

    const confirmar = window.confirm(`Deseas borrar ${ids.length} equipo(s) seleccionados?`);
    if (!confirmar) {
      return;
    }

    this.loaderService.showModal();

    const eliminaciones$ = ids.map((id) => this.apiService.deleteEquipment(id));

    forkJoin(eliminaciones$).subscribe({
      next: () => {
        this.Devices = [];
        this.cambiarSeleccion();
      },
      error: (error: unknown) => {
        console.error('Error al eliminar equipos seleccionados:', error);
        this.loaderService.hideModal();
      },
      complete: () => {
        this.loaderService.hideModal();
      }
    });
  }

  exportarEquipos(): void {
    if (!this.sucursal?.id) {
      return;
    }

    this.loaderService.showModal();

    this.obtenerEquiposYEstados().subscribe({
      next: ({ equipos, estados }) => {
        if (equipos.length === 0) {
          console.warn('No hay equipos para exportar.');
          return;
        }

        this.generarExcelEquipos(equipos, estados);
      },
      error: (error: unknown) => {
        console.error('Error al exportar equipos:', error);
        this.loaderService.hideModal();
      },
      complete: () => {
        this.loaderService.hideModal();
      }
    });
  }

  generarInformeEquipos(): void {
    if (!this.sucursal?.id) {
      return;
    }

    this.loaderService.showModal();

    this.obtenerEquiposYEstados().subscribe({
      next: ({ equipos, estados, camposPorTipo }) => {
        if (equipos.length === 0) {
          console.warn('No hay equipos para generar informe.');
          this.loaderService.hideModal();
          return;
        }

        this.generarInformeExcel(equipos, estados, camposPorTipo)
          .catch((error: unknown) => {
            console.error('Error al generar informe de equipos:', error);
          })
          .finally(() => {
            this.loaderService.hideModal();
          });
      },
      error: (error: unknown) => {
        console.error('Error al preparar datos para el informe de equipos:', error);
        this.loaderService.hideModal();
      }
    });
  }

  private obtenerEquiposYEstados(): Observable<{
    equipos: Equipo[];
    estados: EstadoEquipo[];
    camposPorTipo: Map<number, EquipoFormField[]>;
  }> {
    const totalPaginas = Math.max(this.paginas, 1);
    const pageRequests = Array.from({ length: totalPaginas }, (_, index) =>
      this.apiService.sucursal(
        this.sucursal!.id,
        index + 1,
        this.option ?? '',
        this.filtrosEquipos
      )
    );

    const paginas$ = pageRequests.length > 0 ? forkJoin(pageRequests) : of([]);
    const estados$ =
      this.estadosEquipoCache.length > 0
        ? of(this.estadosEquipoCache)
        : this.apiService.getEstadosEquipo();

    return forkJoin({ paginas: paginas$, estados: estados$ }).pipe(
      switchMap(({ paginas, estados }) => {
        this.estadosEquipoCache = estados ?? [];

        const equipos: Equipo[] = (paginas as any[])
          .flatMap((respuesta: any) => respuesta?.sucursal?.equipos ?? [])
          .map((equipo: Equipo) => ({
            ...equipo,
            esArriendo: normalizarEsArriendo(equipo.esArriendo),
          }));

        const ordenados = this.ordenarEquiposPorCodigo(equipos);

        const tipoIds = Array.from(
          new Set(
            ordenados
              .map((equipo) => equipo?.tipoEquipoId)
              .filter(
                (id): id is number =>
                  typeof id === 'number' && !Number.isNaN(id)
              )
          )
        );

        const pendientes = tipoIds.filter(
          (tipoId) => !this.camposTipoCache.has(tipoId)
        );

        const campos$ = pendientes.length
          ? forkJoin(
              pendientes.map((tipoId) =>
                this.apiService
                  .formEquipment(String(tipoId))
                  .pipe(
                    map((respuesta) => ({
                      tipoId,
                      campos: this.normalizarCamposFormulario(respuesta),
                    })),
                    catchError((error) => {
                      console.error(
                        `Error al obtener campos para el tipo de equipo ${tipoId}:`,
                        error
                      );
                      return of({
                        tipoId,
                        campos: [] as EquipoFormField[],
                      });
                    })
                  )
              )
            )
          : of([] as { tipoId: number; campos: EquipoFormField[] }[]);

        return campos$.pipe(
          map((resultados) => {
            resultados.forEach(({ tipoId, campos }) => {
              this.camposTipoCache.set(tipoId, campos);
            });

            const camposPorTipo = new Map<number, EquipoFormField[]>();
            tipoIds.forEach((tipoId) => {
              const campos = this.camposTipoCache.get(tipoId) ?? [];
              camposPorTipo.set(tipoId, campos);
            });

            return {
              equipos: ordenados,
              estados: this.estadosEquipoCache,
              camposPorTipo,
            };
          })
        );
      })
    );
  }

  private normalizarCamposFormulario(respuesta: unknown): EquipoFormField[] {
    if (!Array.isArray(respuesta)) {
      return [];
    }

    return (respuesta as any[]).map((campo: any) => ({
      id: campo?.id ?? 0,
      name: campo?.name ?? '',
      label: campo?.label ?? '',
      type: campo?.type ?? 'text',
      placeholder: campo?.placeholder ?? '',
      required: Boolean(campo?.required),
      presetOptions: this.normalizarPresetOptions(campo?.presetOptions),
      standards: this.normalizarStandards(campo?.standards),
    }));
  }

  private normalizarPresetOptions(datos: unknown): CampoPresetOption[] {
    if (!Array.isArray(datos)) {
      return [];
    }

    return (datos as any[])
      .map((opcion: any) => ({
        label: opcion?.label ?? '',
        value: opcion?.value ?? '',
        color: this.normalizarColorCriticidad(opcion?.color),
      }))
      .filter((opcion) => opcion.label && opcion.value);
  }

  private normalizarStandards(datos: unknown): CampoStandard[] {
    if (!Array.isArray(datos)) {
      return [];
    }

    return (datos as any[]).map((standard: any) => ({
      label: standard?.label ?? '',
      description: standard?.description ?? null,
      operator: standard?.operator ?? '',
      value: standard?.value ?? null,
      secondaryValue: standard?.secondaryValue ?? null,
      unit: standard?.unit ?? null,
      color: this.normalizarColorCriticidad(standard?.color),
    }));
  }

  private normalizarColorCriticidad(color: string | null | undefined): CampoColor {
    const valor = `${color ?? ''}`.trim().toLowerCase();
    if (valor === 'rojo' || valor === 'verde' || valor === 'amarillo') {
      return valor;
    }
    return 'amarillo';
  }

  private ordenarEquiposPorCodigo(equipos: Equipo[]): Equipo[] {
    if (!equipos || equipos.length === 0) {
      return [];
    }
    return [...equipos].sort((a, b) => {
      const codigoA = a.codigoId ?? '';
      const codigoB = b.codigoId ?? '';
      const numA = parseInt(codigoA.slice(-3), 10);
      const numB = parseInt(codigoB.slice(-3), 10);
      if (Number.isNaN(numA) || Number.isNaN(numB)) {
        return codigoA.localeCompare(codigoB);
      }
      return numA - numB;
    });
  }

  private mapearEquiposAData(equipos: Equipo[], estados: EstadoEquipo[]): EquipoExcelRow[] {
    return equipos.map((equipo, index) => ({
      Numero: index + 1,
      CodigoID: equipo.codigoId ?? '',
      Estado: this.obtenerNombreEstado(estados, equipo.estado),
      TipoEquipo: equipo.tipoEquipo?.name ?? '',
      FechaIngreso: this.formatearFecha(equipo.fechaIngreso),
      Departamento: equipo.departamento ?? '',
      Usuario: equipo.usuario ?? '',
      Marca: equipo.marca ?? '',
      Modelo: equipo.modelo ?? '',
      NumeroSerie: equipo.numeroSerie ?? '',
      Procesador: equipo.procesador ?? '',
      VelocidadProcesador: equipo.velocidadProcesador ?? '',
      RAM: equipo.ram ?? '',
      TipoAlmacenamiento: equipo.tipoAlmacenamiento ?? '',
      CantidadAlmacenamiento: equipo.cantidadAlmacenamiento ?? '',
      SistemaOperativo: equipo.sistemaOperativo ?? '',
      Ofimatica: equipo.ofimatica ?? '',
      Antivirus: equipo.antivirus ?? '',
      Observaciones: this.unirObservaciones(equipo.observaciones ?? [])
    }));
  }

  private generarExcelEquipos(equipos: Equipo[], estados: EstadoEquipo[]): void {
    const data = this.mapearEquiposAData(equipos, estados);

    if (data.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos');

    const nombreSucursal = this.sucursal?.sucursal ?? 'sucursal';
    const fileName = `${this.normalizarTexto(nombreSucursal)}-equipos.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private generarInformeExcel(
    equipos: Equipo[],
    estados: EstadoEquipo[],
    camposPorTipo: Map<number, EquipoFormField[]>
  ): Promise<void> {
    const data = this.mapearEquiposAData(equipos, estados);

    if (data.length === 0) {
      return Promise.resolve();
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Equipos');

    worksheet.columns = [
      { header: 'Numero', key: 'Numero', width: 8 },
      { header: 'CodigoID', key: 'CodigoID', width: 18 },
      { header: 'Estado', key: 'Estado', width: 20 },
      { header: 'TipoEquipo', key: 'TipoEquipo', width: 20 },
      { header: 'FechaIngreso', key: 'FechaIngreso', width: 18 },
      { header: 'Departamento', key: 'Departamento', width: 20 },
      { header: 'Usuario', key: 'Usuario', width: 18 },
      { header: 'Marca', key: 'Marca', width: 16 },
      { header: 'Modelo', key: 'Modelo', width: 16 },
      { header: 'NumeroSerie', key: 'NumeroSerie', width: 20 },
      { header: 'Procesador', key: 'Procesador', width: 20 },
      { header: 'VelocidadProcesador', key: 'VelocidadProcesador', width: 22 },
      { header: 'RAM', key: 'RAM', width: 10 },
      { header: 'TipoAlmacenamiento', key: 'TipoAlmacenamiento', width: 22 },
      { header: 'CantidadAlmacenamiento', key: 'CantidadAlmacenamiento', width: 24 },
      { header: 'SistemaOperativo', key: 'SistemaOperativo', width: 22 },
      { header: 'Ofimatica', key: 'Ofimatica', width: 20 },
      { header: 'Antivirus', key: 'Antivirus', width: 20 },
      { header: 'Observaciones', key: 'Observaciones', width: 36 },
    ];

    data.forEach((registro) => {
      worksheet.addRow(registro);
    });

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const columnasPorKey = new Map<string, string>();
    worksheet.columns?.forEach((columna) => {
      if (columna?.key && typeof columna.key === 'string') {
        columnasPorKey.set(columna.key.toLowerCase(), columna.key);
      }
    });

    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      row.alignment = {
        vertical: 'middle',
        horizontal: rowNumber === 1 ? 'center' : 'left',
        wrapText: true,
      };

      if (rowNumber === 1) {
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6366F1' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF4338CA' } },
            left: { style: 'thin', color: { argb: 'FF4338CA' } },
            bottom: { style: 'thin', color: { argb: 'FF4338CA' } },
            right: { style: 'thin', color: { argb: 'FF4338CA' } },
          };
        });
        return;
      }

      const equipo = equipos[rowNumber - 2];
      if (!equipo) {
        return;
      }

      const columnasColoreadas = this.aplicarColoresDefinidos(
        row,
        equipo,
        camposPorTipo,
        columnasPorKey
      );

      if (!columnasColoreadas.has('RAM')) {
        const ramCell = row.getCell('RAM') as ExcelJS.Cell;
        const color = this.obtenerColorRam(ramCell.value);

        if (color) {
          this.aplicarEstiloCriticidad(ramCell, color);
        }
      }
    });

    const nombreSucursal = this.sucursal?.sucursal ?? 'sucursal';
    const fileName = `${this.normalizarTexto(nombreSucursal)}-informe.xlsx`;

    return workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, fileName);
    });
  }

  private aplicarColoresDefinidos(
    row: ExcelJS.Row,
    equipo: Equipo,
    camposPorTipo: Map<number, EquipoFormField[]>,
    columnas: Map<string, string>
  ): Set<string> {
    const columnasColoreadas = new Set<string>();
    const tipoId =
      typeof equipo.tipoEquipoId === 'number'
        ? equipo.tipoEquipoId
        : Number(equipo.tipoEquipoId);

    if (!tipoId || Number.isNaN(tipoId)) {
      return columnasColoreadas;
    }

    const campos = camposPorTipo.get(tipoId);
    if (!campos || campos.length === 0) {
      return columnasColoreadas;
    }

    const procesados = new Set<string>();

    campos.forEach((campo) => {
      const nombre = campo?.name ?? '';
      if (!nombre || procesados.has(nombre) || !this.campoConCriticidad(campo)) {
        return;
      }

      const llaveColumna = columnas.get(nombre.toLowerCase());
      if (!llaveColumna) {
        return;
      }

      procesados.add(nombre);

      const cell = row.getCell(llaveColumna) as ExcelJS.Cell;
      const valor = (equipo as any)[nombre];

      const color = this.obtenerColorDesdeDefiniciones(valor, campo);
      if (color) {
        this.aplicarEstiloCriticidad(cell, color);
        columnasColoreadas.add(llaveColumna);
      }
    });

    return columnasColoreadas;
  }

  private campoConCriticidad(campo: EquipoFormField): boolean {
    return Boolean(campo.presetOptions?.length) || Boolean(campo.standards?.length);
  }

  private obtenerColorDesdeDefiniciones(
    valor: unknown,
    campo: EquipoFormField
  ): string | null {
    const colorPreset = this.obtenerColorDesdePreset(
      valor,
      campo.presetOptions ?? []
    );
    if (colorPreset) {
      return colorPreset;
    }

    return this.obtenerColorDesdeStandards(valor, campo.standards ?? []);
  }

  private obtenerColorDesdePreset(
    valor: unknown,
    opciones: CampoPresetOption[]
  ): string | null {
    if (!opciones || opciones.length === 0) {
      return null;
    }

    const valorComparacion = this.normalizarStringComparacion(valor);
    if (!valorComparacion) {
      return null;
    }

    for (const opcion of opciones) {
      const opcionComparacion = this.normalizarStringComparacion(opcion.value);
      if (opcionComparacion && opcionComparacion === valorComparacion) {
        return this.coloresPorCriticidad[
          this.normalizarColorCriticidad(opcion.color)
        ];
      }
    }

    return null;
  }

  private obtenerColorDesdeStandards(
    valor: unknown,
    standards: CampoStandard[]
  ): string | null {
    if (!standards || standards.length === 0) {
      return null;
    }

    for (const standard of standards) {
      if (this.cumpleReglaStandards(valor, standard)) {
        return this.coloresPorCriticidad[
          this.normalizarColorCriticidad(standard.color)
        ];
      }
    }

    return null;
  }

  private cumpleReglaStandards(valor: unknown, standard: CampoStandard): boolean {
    const operador = `${standard.operator ?? ''}`.trim().toLowerCase();
    if (!operador) {
      return false;
    }

    switch (operador) {
      case 'gte': {
        const actual = this.valorComoNumero(valor);
        const referencia = this.valorComoNumero(standard.value);
        return actual !== null && referencia !== null && actual >= referencia;
      }
      case 'gt': {
        const actual = this.valorComoNumero(valor);
        const referencia = this.valorComoNumero(standard.value);
        return actual !== null && referencia !== null && actual > referencia;
      }
      case 'lte': {
        const actual = this.valorComoNumero(valor);
        const referencia = this.valorComoNumero(standard.value);
        return actual !== null && referencia !== null && actual <= referencia;
      }
      case 'lt': {
        const actual = this.valorComoNumero(valor);
        const referencia = this.valorComoNumero(standard.value);
        return actual !== null && referencia !== null && actual < referencia;
      }
      case 'eq': {
        const actualNum = this.valorComoNumero(valor);
        const referenciaNum = this.valorComoNumero(standard.value);
        if (actualNum !== null && referenciaNum !== null) {
          return actualNum === referenciaNum;
        }
        const actualTexto = this.normalizarStringComparacion(valor);
        const referenciaTexto = this.normalizarStringComparacion(
          standard.value
        );
        return (
          actualTexto !== null &&
          referenciaTexto !== null &&
          actualTexto === referenciaTexto
        );
      }
      case 'between': {
        const actual = this.valorComoNumero(valor);
        const minimo = this.valorComoNumero(standard.value);
        const maximo = this.valorComoNumero(standard.secondaryValue);
        return (
          actual !== null &&
          minimo !== null &&
          maximo !== null &&
          actual >= minimo &&
          actual <= maximo
        );
      }
      case 'contains': {
        const texto = this.valorComoString(valor);
        const objetivo = this.valorComoString(standard.value);
        return (
          texto !== null &&
          objetivo !== null &&
          texto.toLowerCase().includes(objetivo.toLowerCase())
        );
      }
      case 'regex': {
        const texto = this.valorComoString(valor);
        const patron = this.valorComoString(standard.value);
        if (!texto || !patron) {
          return false;
        }
        try {
          const regex = new RegExp(patron, 'i');
          return regex.test(texto);
        } catch {
          return false;
        }
      }
      default:
        return false;
    }
  }

  private valorComoNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : null;
    }

    if (typeof valor === 'boolean') {
      return valor ? 1 : 0;
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim();
      if (!trimmed) {
        return null;
      }
      const normalizado = trimmed.replace(',', '.');
      const match = normalizado.match(/-?\d+(\.\d+)?/);
      if (!match) {
        return null;
      }
      const numero = Number.parseFloat(match[0]);
      return Number.isNaN(numero) ? null : numero;
    }

    return null;
  }

  private valorComoString(valor: unknown): string | null {
    if (valor === null || valor === undefined) {
      return null;
    }
    if (typeof valor === 'string') {
      const trimmed = valor.trim();
      return trimmed.length ? trimmed : null;
    }
    const convertido = String(valor).trim();
    return convertido.length ? convertido : null;
  }

  private normalizarStringComparacion(valor: unknown): string | null {
    const texto = this.valorComoString(valor);
    return texto ? texto.toLowerCase() : null;
  }

  private aplicarEstiloCriticidad(cell: ExcelJS.Cell, color: string): void {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color },
    };
    cell.font = { color: { argb: 'FF111827' }, bold: true };
  }

  private obtenerColorRam(valor: unknown): string | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    let procesado: number | null = null;

    if (typeof valor === 'number') {
      procesado = valor;
    } else if (typeof valor === 'string') {
      const texto = valor.replace(',', '.').trim();
      if (!texto) {
        return null;
      }
      const numero = Number(texto);
      if (!Number.isNaN(numero)) {
        procesado = numero;
      }
    } else {
      const texto = String(valor ?? '').replace(',', '.').trim();
      if (!texto) {
        return null;
      }
      const numero = Number(texto);
      if (!Number.isNaN(numero)) {
        procesado = numero;
      }
    }

    if (procesado === null || Number.isNaN(procesado)) {
      return null;
    }

    if (procesado >= 16) {
      return 'FF22C55E';
    }

    if (procesado <= 6) {
      return 'FFDC2626';
    }

    if (procesado >= 8) {
      return 'FFFACC15';
    }

    return null;
  }

  private obtenerNombreEstado(estados: EstadoEquipo[], estadoId: number): string {
    const estado = estados.find((item) => item.id === estadoId);
    return estado ? estado.name : 'Sin estado';
  }

  private formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) {
      return '';
    }
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('es-CL');
  }

  private unirObservaciones(observaciones: { text: string }[]): string {
    if (!observaciones || observaciones.length === 0) {
      return '';
    }
    return observaciones
      .map((observacion) => observacion.text)
      .filter((texto) => !!texto)
      .join(' | ');
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }

  private incluyeArriendo(servicios: string[]): boolean {
    return servicios.some(
      (servicio) => servicio?.toLowerCase().trim() === 'arriendo'
    );
  }
}


