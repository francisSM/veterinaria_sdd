/**
 * TypeScript Backend Models & Interfaces
 * Submódulo: Facturación y Pagos (FAP)
 * Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD
 *
 * Mapeo uno a uno con el esquema relacional DDL (T-21 a T-30)
 * y validaciones de la rúbrica (CH-51 a CH-75).
 */

// T-21: CajasDiarias
export type EstadoCajaTipo = 'abierta' | 'cerrada' | 'auditada';

export interface CajasDiarias {
  id: number;
  cajeroId: number;
  montoApertura: number; // CH-51, CH-52: >= 0.0 y <= 1000000.0
  montoCierre: number | null; // CH-53: >= 0.0 o null
  estado: EstadoCajaTipo; // CH-54
  fechaApertura: Date;
  fechaCierre: Date | null; // CH-70: >= fechaApertura
}

// T-22: ArqueosCaja
export type TipoArqueoTipo = 'apertura' | 'cierre' | 'auditoria';

export interface ArqueosCaja {
  id: number;
  cajaDiariaId: number; // FK -> CajasDiarias.id
  montoFisico: number; // CH-55: >= 0.0
  balanceSistema: number;
  diferencia: number; // CH-56: montoFisico - balanceSistema (auto-calculado)
  tipoArqueo: TipoArqueoTipo; // CH-71
  comentarioSupervisor: string | null; // CH-75: obligatorio si diferencia != 0.0
  fechaArqueo: Date;
}

// T-23: MetodosPago
export type MetodoPagoCodigoTipo = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'seguro';

export interface MetodosPago {
  id: number;
  nombre: string;
  codigo: MetodoPagoCodigoTipo; // CH-63
}

// T-24: ComprobantesFiscales (Boleta / Factura)
export type TipoDocumentoFiscalTipo = 'boleta' | 'factura' | 'nota_credito';
export type EstadoDocumentoFiscalTipo = 'emitida' | 'pagada' | 'anulada';

export interface ComprobantesFiscales {
  id: number;
  propietarioId: number; // FK -> Propietario.id (HCC Módulo 1)
  cajaDiariaId: number; // FK -> CajasDiarias.id
  tipoDocumento: TipoDocumentoFiscalTipo; // CH-59
  folioFactura: string | null;
  montoTotal: number; // CH-60: >= 0.0
  estado: EstadoDocumentoFiscalTipo; // CH-72
  fechaEmision: Date;
}

// T-25: DetallesComprobantes
export interface DetallesComprobantes {
  id: number;
  comprobanteId: number; // FK -> ComprobantesFiscales.id
  descripcion: string;
  cantidadItems: number; // CH-61: > 0
  precioUnitario: number; // CH-62: >= 0.0
  descuentoItem: number; // CH-73, CH-74: >= 0.0 y <= precioUnitario
  consultaId: number | null; // FK logic -> Consulta.id (HCC Módulo 1)
  despachoId: number | null; // FK logic -> DespachoMedicamento.id (ILM Módulo 2)
}

// T-26: Pagos
export interface Pagos {
  id: number;
  boletaId: number; // FK -> ComprobantesFiscales.id
  metodoPagoId: number; // FK -> MetodosPago.id
  montoPagado: number; // CH-64: > 0.0
  fechaPago: Date; // CH-73: <= actual
}

// T-27: ConveniosSeguros
export interface ConveniosSeguros {
  id: number;
  propietarioId: number; // FK -> Propietario.id (HCC Módulo 1)
  compania: string;
  polizaNumero: string; // CH-65: >= 5 caracteres
}

// T-28: NotasCredito
export interface NotasCredito {
  id: number;
  comprobanteOriginalId: number; // FK -> ComprobantesFiscales.id
  comprobanteAnulacionId: number; // FK -> ComprobantesFiscales.id
  motivo: string;
  fechaCreacion: Date;
}

// T-29: DescuentosAplicados
export interface DescuentosAplicados {
  id: number;
  boletaId: number; // FK -> ComprobantesFiscales.id
  motivo: string;
  porcentaje: number; // CH-68, CH-69: >= 0.0 y <= 50.0
}

// T-30: BitacoraTransacciones
export type TipoTransaccionTipo = 'ingreso' | 'egreso' | 'ajuste';

export interface BitacoraTransacciones {
  id: number;
  cajaDiariaId: number; // FK -> CajasDiarias.id
  descripcion: string;
  monto: number;
  tipoTransaccion: TipoTransaccionTipo;
  fechaRegistro: Date;
}

/**
 * Global Schema Registry integration metadata for FAP
 */
export const FAP_SCHEMA_REGISTRY = {
  version: '0.1.0',
  module: 'Facturacion y Pagos',
  tables: [
    'cajas_diarias',
    'arqueos_caja',
    'metodos_pago',
    'comprobantes_fiscales',
    'detalles_comprobantes',
    'pagos',
    'convenios_seguros',
    'notas_credito',
    'descuentos_aplicados',
    'bitacora_transacciones',
  ],
  relationships: [
    { from: 'arqueos_caja.caja_diaria_id', to: 'cajas_diarias.id', type: 'many-to-one' },
    { from: 'comprobantes_fiscales.propietario_id', to: 'propietarios.id', type: 'many-to-one' },
    { from: 'comprobantes_fiscales.caja_diaria_id', to: 'cajas_diarias.id', type: 'many-to-one' },
    { from: 'detalles_comprobantes.comprobante_id', to: 'comprobantes_fiscales.id', type: 'many-to-one' },
    { from: 'detalles_comprobantes.consulta_id', to: 'consultas.id', type: 'many-to-one' },
    { from: 'detalles_comprobantes.despacho_id', to: 'despachos_medicamentos.id', type: 'many-to-one' },
    { from: 'pagos.boleta_id', to: 'comprobantes_fiscales.id', type: 'many-to-one' },
    { from: 'pagos.metodo_pago_id', to: 'metodos_pago.id', type: 'many-to-one' },
    { from: 'convenios_seguros.propietario_id', to: 'propietarios.id', type: 'many-to-one' },
    { from: 'notas_credito.comprobante_original_id', to: 'comprobantes_fiscales.id', type: 'many-to-one' },
    { from: 'notas_credito.comprobante_anulacion_id', to: 'comprobantes_fiscales.id', type: 'many-to-one' },
    { from: 'descuentos_aplicados.boleta_id', to: 'comprobantes_fiscales.id', type: 'many-to-one' },
    { from: 'bitacora_transacciones.caja_diaria_id', to: 'cajas_diarias.id', type: 'many-to-one' },
  ],
};
