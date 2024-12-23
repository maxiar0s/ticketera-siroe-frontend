
import { Validators } from '@angular/forms';
import { EquipoFormField } from '../../../interfaces/EquipoForm.interface';

export const EquipoFormConfig: { [key: string]: EquipoFormField[] } = {
  "Televisor": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: LG', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: 55UT8050PSB' },
    { name: 'numeroSerie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: 20139412ABC' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
  ],
  "Celular": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Samsung', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Galaxy S24' },
    { name: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej: Snapdragon 8 Gen 2' },
    { name: 'velocidadProcesador', label: 'Velocidad del Procesador (GHz)', type: 'text', placeholder: 'Ej: 3.2' },
    { name: 'ram', label: 'RAM (GB)', type: 'number', placeholder: 'Ej: 12' },
    { name: 'tipoAlmacenamiento', label: 'Tipo de Almacenamiento', type: 'text', placeholder: 'Ej: UFS 4.0' },
    { name: 'cantidadAlmacenamiento', label: 'Capacidad de Almacenamiento (GB)', type: 'number', placeholder: 'Ej: 256' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Android 14' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ],
  "Notebook": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Lenovo', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: ThinkPad X1 Carbon' },
    { name: 'numeroSerie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: 1234-5678-ABCD' },
    { name: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej: Intel Core i7' },
    { name: 'velocidadProcesador', label: 'Velocidad del Procesador', type: 'text', placeholder: 'Ej: 3.4 GHz' },
    { name: 'ram', label: 'RAM (GB)', type: 'number', placeholder: 'Ej: 16' },
    { name: 'tipoAlmacenamiento', label: 'Tipo de Almacenamiento', type: 'text', placeholder: 'Ej: SSD NVMe' },
    { name: 'cantidadAlmacenamiento', label: 'Capacidad de Almacenamiento (GB)', type: 'number', placeholder: 'Ej: 512' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Windows 11 Pro' },
    { name: 'ofimatica', label: 'Software de Ofimática', type: 'text', placeholder: 'Ej: Microsoft Office 365' },
    { name: 'antivirus', label: 'Antivirus', type: 'text', placeholder: 'Ej: Kaspersky Total Security' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Juan Pérez' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega detalles adicionales, si los hay' }
  ],
  "Data Show": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Epson', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: PowerLite X49' },
    { name: 'numeroSerie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: DS123456789' },
    { name: 'tipoAlmacenamiento', label: 'Tipo de Almacenamiento', type: 'text', placeholder: 'Ej: Memoria Interna' },
    { name: 'cantidadAlmacenamiento', label: 'Capacidad de Almacenamiento (GB)', type: 'number', placeholder: 'Ej: 16' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Ana López' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ],
  "Tablet": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Samsung', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Galaxy Tab S9' },
    { name: 'numeroSerie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: TAB123456789' },
    { name: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej: Qualcomm Snapdragon 8 Gen 2' },
    { name: 'velocidadProcesador', label: 'Velocidad del Procesador', type: 'text', placeholder: 'Ej: 3.2 GHz' },
    { name: 'ram', label: 'RAM (GB)', type: 'number', placeholder: 'Ej: 8' },
    { name: 'tipoAlmacenamiento', label: 'Tipo de Almacenamiento', type: 'text', placeholder: 'Ej: SSD o eMMC' },
    { name: 'cantidadAlmacenamiento', label: 'Capacidad de Almacenamiento (GB)', type: 'number', placeholder: 'Ej: 256' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Android 14 o iPadOS 17' },
    { name: 'ofimatica', label: 'Software de Ofimática', type: 'text', placeholder: 'Ej: Microsoft Office 365' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Juan Pérez' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ],
  "Pantalla": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Samsung', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Smart Monitor M8' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Tizen OS' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Ana Rodríguez' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ],
  "Periferico": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Logitech', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: MX Master 3' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Compatible con Windows 10 y macOS' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Pedro Gómez' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ],
  "Pizarra Interactiva": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Lenovo', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: ThinkSmart Hub' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Windows 10 IoT' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Juan Martínez' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega detalles adicionales, si los hay' }
  ],
  "Sistema de Audio": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Sony', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: SRS-XV800' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: Roberto Osses' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
  ],
  "Aire Acondicionado": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: TCL', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: BreezeIN 24000' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
  ],
  "All in One": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: HP', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Pavilion 24' },
    { name: 'numeroSerie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: AIO123456789' },
    { name: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej: Intel Core i5' },
    { name: 'velocidadProcesador', label: 'Velocidad del Procesador', type: 'text', placeholder: 'Ej: 3.0 GHz' },
    { name: 'ram', label: 'RAM (GB)', type: 'number', placeholder: 'Ej: 8' },
    { name: 'tipoAlmacenamiento', label: 'Tipo de Almacenamiento', type: 'text', placeholder: 'Ej: SSD' },
    { name: 'cantidadAlmacenamiento', label: 'Capacidad de Almacenamiento (GB)', type: 'number', placeholder: 'Ej: 512' },
    { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Windows 11' },
    { name: 'ofimatica', label: 'Software de Ofimática', type: 'text', placeholder: 'Ej: Microsoft Office 365' },
    { name: 'usuario', label: 'Usuario Responsable', type: 'text', placeholder: 'Ej: María Pérez' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ],
  "Impresora": [
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Epson', validators: [Validators.required] },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: EcoTank L3250' },
    { name: 'numeroSerie', label: 'Número de Serie', type: 'text', placeholder: 'Ej: IMP123456789' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Agrega comentarios adicionales, si los hay' }
  ]
};
