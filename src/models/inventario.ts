/**
 * TypeScript Backend Models & Interfaces
 * Submódulo: Inventario y Logística de Medicamentos (ILM)
 * Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD
 *
 * Mapeo uno a uno con el esquema relacional DDL (T-11 a T-20)
 * y validaciones de la rúbrica (CH-26 a CH-50).
 */

// T-11: CategoriaInsumos
export type CategoriaInsumoTipo = 'antibiotico' | 'analgesico' | 'anestesico' | 'vacuna' | 'desparasitante' | 'psicotropico';

export interface CategoriaInsumos {
  id: number;
  nombre: CategoriaInsumoTipo; // CH-41
}

// T-12: Medicamento
export interface Medicamento {
  id: number;
  nombreComercial: string; // CH-49: >= 3 caracteres
  principioActivo: string; // CH-50: >= 3 caracteres
  precioVenta: number; // CH-26: >= 0.0
  stockMinimo: number; // CH-27: >= 0
  categoriaId: number; // FK -> CategoriaInsumos.id
}

// T-13: Proveedor
export interface Proveedor {
  id: number;
  razonSocial: string;
  rut: string; // CH-45: >= 9 caracteres
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
}

// T-14: CompraInventario
export interface CompraInventario {
  id: number;
  proveedorId: number; // FK -> Proveedor.id
  montoTotal: number; // CH-40: >= 0.0
  fechaCompra: Date;
  numeroFactura: string;
}

// T-14b: DetalleCompra
export interface DetalleCompra {
  id: number;
  compraId: number; // FK -> CompraInventario.id
  medicamentoId: number; // FK -> Medicamento.id
  cantidad: number; // > 0
  precioUnitario: number; // > 0.0
}

// T-15: Lote
export type EstadoLoteTipo = 'disponible' | 'bloqueado' | 'vencido';

export interface Lote {
  id: number;
  codigoLote: string; // UNIQUE
  medicamentoId: number; // FK -> Medicamento.id
  compraId: number; // FK -> CompraInventario.id
  cantidadInicial: number; // CH-28: > 0
  cantidadActual: number; // CH-29: >= 0, CH-30: <= cantidadInicial
  precioCompraUnitario: number; // CH-42: > 0.0
  fechaIngreso: Date;
  fechaVencimiento: Date; // CH-31: > fechaIngreso
  estado: EstadoLoteTipo; // CH-32
}

// T-16: MovimientoInventario
export type TipoMovimientoTipo = 'compra' | 'venta' | 'merma' | 'ajuste';

export interface MovimientoInventario {
  id: number;
  medicamentoId: number; // FK -> Medicamento.id
  loteId: number; // FK -> Lote.id
  tipo: TipoMovimientoTipo; // CH-33
  cantidad: number; // CH-34: != 0
  motivo: string | null; // CH-47: requerido si tipo es 'merma' o 'ajuste'
  fechaMovimiento: Date;
}

// T-17: RecetaRetenida
export type EstadoRecetaTipo = 'emitida' | 'despachada' | 'vencida';

export interface RecetaRetenida {
  id: number;
  consultaId: number; // FK -> Consulta.id (HCC Módulo 1)
  medicamentoId: number; // FK -> Medicamento.id
  dosis: string; // CH-35: >= 2 caracteres
  duracionDias: number; // CH-43 & CH-44: >= 1 y <= 365
  estado: EstadoRecetaTipo;
  firmaVeterinario: string;
  fechaEmision: Date;
}

// T-18: DespachoMedicamento
export interface DespachoMedicamento {
  id: number;
  recetaId: number; // FK -> RecetaRetenida.id
  loteId: number; // FK -> Lote.id
  cantidadDespachada: number; // CH-36: > 0
  fechaDespacho: Date; // CH-48: <= CURRENT_TIMESTAMP
}

// T-19: AlertaStock
export type NivelAlertaTipo = 'bajo' | 'critico';

export interface AlertaStock {
  id: number;
  medicamentoId: number; // FK -> Medicamento.id
  nivelAlerta: NivelAlertaTipo; // CH-37
  fechaCreacion: Date; // CH-46: <= CURRENT_TIMESTAMP
}

/**
 * Global Schema Registry integration metadata for ILM
 */
export const ILM_SCHEMA_REGISTRY = {
  version: '0.1.0',
  module: 'Inventario y Logistica de Medicamentos',
  tables: [
    'categorias_insumos',
    'medicamentos',
    'proveedores',
    'compras_inventario',
    'detalle_compras',
    'lotes',
    'movimientos_inventario',
    'recetas_retenidas',
    'despachos_medicamentos',
    'alertas_stock',
  ],
  relationships: [
    { from: 'medicamentos.categoria_id', to: 'categorias_insumos.id', type: 'many-to-one' },
    { from: 'compras_inventario.proveedor_id', to: 'proveedores.id', type: 'many-to-one' },
    { from: 'detalle_compras.compra_id', to: 'compras_inventario.id', type: 'many-to-one' },
    { from: 'detalle_compras.medicamento_id', to: 'medicamentos.id', type: 'many-to-one' },
    { from: 'lotes.medicamento_id', to: 'medicamentos.id', type: 'many-to-one' },
    { from: 'lotes.compra_id', to: 'compras_inventario.id', type: 'many-to-one' },
    { from: 'movimientos_inventario.medicamento_id', to: 'medicamentos.id', type: 'many-to-one' },
    { from: 'movimientos_inventario.lote_id', to: 'lotes.id', type: 'many-to-one' },
    { from: 'recetas_retenidas.medicamento_id', to: 'medicamentos.id', type: 'many-to-one' },
    { from: 'despachos_medicamentos.receta_id', to: 'recetas_retenidas.id', type: 'many-to-one' },
    { from: 'despachos_medicamentos.lote_id', to: 'lotes.id', type: 'many-to-one' },
    { from: 'alertas_stock.medicamento_id', to: 'medicamentos.id', type: 'many-to-one' },
  ],
};
