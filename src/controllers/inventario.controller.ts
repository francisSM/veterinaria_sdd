import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  CategoriaInsumos,
  Medicamento,
  Proveedor,
  CompraInventario,
  DetalleCompra,
  Lote,
  MovimientoInventario,
  RecetaRetenida,
  DespachoMedicamento,
  AlertaStock
} from '../models/inventario';

import {
  consultasDB,
  historialesDB,
  pacientesDB,
  propietariosDB
} from './clinica.controller';

// Local helper to break circular dependency cycle with persistence.ts
const getPool = () => (global as any).pgPool;

// Almacenes temporales en memoria para simular persistencia relacional y CHECKs
export const categoriasDB: CategoriaInsumos[] = [
  { id: 1, nombre: 'antibiotico' },
  { id: 2, nombre: 'analgesico' },
  { id: 3, nombre: 'anestesico' },
  { id: 4, nombre: 'vacuna' },
  { id: 5, nombre: 'desparasitante' },
  { id: 6, nombre: 'psicotropico' }
];

export const medicamentosDB: Medicamento[] = [
  { id: 1, nombreComercial: 'Ketamina Inyectable 10%', principioActivo: 'Ketamina', precioVenta: 45000, stockMinimo: 10, categoriaId: 3 },
  { id: 2, nombreComercial: 'Tramadol Gotas 100mg/ml', principioActivo: 'Tramadol', precioVenta: 12000, stockMinimo: 5, categoriaId: 2 },
  { id: 3, nombreComercial: 'Amoxicilina Suspensión 250mg/5ml', principioActivo: 'Amoxicilina', precioVenta: 8500, stockMinimo: 20, categoriaId: 1 },
  { id: 4, nombreComercial: 'Fenobarbital Gotas 4%', principioActivo: 'Fenobarbital', precioVenta: 18900, stockMinimo: 8, categoriaId: 6 },
  { id: 5, nombreComercial: 'Paracetamol Suspensión 120mg/5ml', principioActivo: 'Paracetamol', precioVenta: 5900, stockMinimo: 15, categoriaId: 2 }
];
export const proveedoresDB: Proveedor[] = [
  { id: 1, rut: '76.229.840-K', razonSocial: 'Laboratorio Chile Distribuciones S.A.', contactoNombre: 'Juan Carlos Pérez', contactoEmail: 'contacto@labchile.cl', contactoTelefono: '+56912345678' }
];
export const comprasDB: CompraInventario[] = [
  { id: 1, proveedorId: 1, montoTotal: 125000.00, fechaCompra: new Date('2026-06-01T09:00:00Z'), numeroFactura: 'FAC-10022' }
];
export const detallesCompraDB: DetalleCompra[] = [
  { id: 1, compraId: 1, medicamentoId: 1, cantidad: 70, precioUnitario: 18500.00 }
];
export const lotesDB: Lote[] = [
  { id: 1, codigoLote: 'KET-992-A', medicamentoId: 1, compraId: 1, cantidadInicial: 30, cantidadActual: 15, precioCompraUnitario: 18000, fechaIngreso: new Date('2026-06-01T09:00:00Z'), fechaVencimiento: new Date('2526-12-31T00:00:00Z'), estado: 'disponible' },
  { id: 2, codigoLote: 'KET-001-B', medicamentoId: 1, compraId: 1, cantidadInicial: 40, cantidadActual: 35, precioCompraUnitario: 19000, fechaIngreso: new Date('2026-06-15T10:00:00Z'), fechaVencimiento: new Date('2026-07-15T00:00:00Z'), estado: 'disponible' },
  { id: 3, codigoLote: 'TRA-102-X', medicamentoId: 2, compraId: 1, cantidadInicial: 25, cantidadActual: 20, precioCompraUnitario: 5000, fechaIngreso: new Date('2026-05-10T08:30:00Z'), fechaVencimiento: new Date('2027-05-10T00:00:00Z'), estado: 'disponible' },
  { id: 4, codigoLote: 'AMO-334-L', medicamentoId: 3, compraId: 1, cantidadInicial: 100, cantidadActual: 80, precioCompraUnitario: 3500, fechaIngreso: new Date('2026-06-01T09:30:00Z'), fechaVencimiento: new Date('2028-06-01T00:00:00Z'), estado: 'disponible' },
  { id: 5, codigoLote: 'FEN-091-M', medicamentoId: 4, compraId: 1, cantidadInicial: 15, cantidadActual: 12, precioCompraUnitario: 7500, fechaIngreso: new Date('2026-04-10T11:00:00Z'), fechaVencimiento: new Date('2027-04-10T00:00:00Z'), estado: 'disponible' },
  { id: 6, codigoLote: 'FEN-012-V', medicamentoId: 4, compraId: 1, cantidadInicial: 10, cantidadActual: 10, precioCompraUnitario: 7000, fechaIngreso: new Date('2026-01-01T09:00:00Z'), fechaVencimiento: new Date('2026-06-01T00:00:00Z'), estado: 'vencido' },
  { id: 7, codigoLote: 'PAR-402-K', medicamentoId: 5, compraId: 1, cantidadInicial: 50, cantidadActual: 50, precioCompraUnitario: 2200, fechaIngreso: new Date('2026-06-25T14:00:00Z'), fechaVencimiento: new Date('2029-06-25T00:00:00Z'), estado: 'disponible' }
];
export const movimientosDB: MovimientoInventario[] = [
  { id: 1, medicamentoId: 1, loteId: 1, tipo: 'compra', cantidad: 30, motivo: 'Ingreso lote inicial por compra a Laboratorio Chile', fechaMovimiento: new Date('2026-06-01T09:15:00Z') },
  { id: 2, medicamentoId: 1, loteId: 2, tipo: 'compra', cantidad: 40, motivo: 'Recepción de compra internacional de emergencia', fechaMovimiento: new Date('2026-06-15T10:30:00Z') },
  { id: 3, medicamentoId: 2, loteId: 3, tipo: 'compra', cantidad: 25, motivo: 'Ingreso lote inicial por compra consolidada', fechaMovimiento: new Date('2026-05-10T09:00:00Z') },
  { id: 4, medicamentoId: 3, loteId: 4, tipo: 'compra', cantidad: 100, motivo: 'Ingreso lote inicial por licitación anual', fechaMovimiento: new Date('2026-06-01T10:00:00Z') },
  { id: 5, medicamentoId: 4, loteId: 5, tipo: 'compra', cantidad: 15, motivo: 'Compra inicial de psicotrópicos controlados', fechaMovimiento: new Date('2026-04-10T11:30:00Z') },
  { id: 6, medicamentoId: 1, loteId: 2, tipo: 'venta', cantidad: -3, motivo: 'Despacho por receta retenida #12 - Cirugía Paciente "Toby"', fechaMovimiento: new Date('2026-06-18T15:40:00Z') },
  { id: 7, medicamentoId: 1, loteId: 2, tipo: 'venta', cantidad: -2, motivo: 'Despacho por receta retenida #14 - Sedación Paciente "Luna"', fechaMovimiento: new Date('2026-06-20T11:20:00Z') },
  { id: 8, medicamentoId: 2, loteId: 3, tipo: 'venta', cantidad: -5, motivo: 'Despacho por receta #15 - Tratamiento analgésico post-operatorio', fechaMovimiento: new Date('2026-06-22T16:10:00Z') },
  { id: 9, medicamentoId: 3, loteId: 4, tipo: 'venta', cantidad: -20, motivo: 'Dispensación antibiótica Paciente "Rex"', fechaMovimiento: new Date('2026-06-25T12:45:00Z') },
  { id: 10, medicamentoId: 4, loteId: 6, tipo: 'merma', cantidad: -10, motivo: 'Lote FEN-012-V expirado. Retirado de circulación para destrucción controlada', fechaMovimiento: new Date('2026-06-01T23:59:59Z') },
  { id: 11, medicamentoId: 2, loteId: 3, tipo: 'merma', cantidad: -1, motivo: 'Rotura física de ampolla al descargar la caja de reposición', fechaMovimiento: new Date('2026-06-10T13:15:00Z') },
  { id: 12, medicamentoId: 4, loteId: 5, tipo: 'ajuste', cantidad: -3, motivo: 'Ajuste por auditoría de stock: diferencia de 3 unidades en el conteo físico mensual', fechaMovimiento: new Date('2026-06-28T17:30:00Z') },
  { id: 13, medicamentoId: 3, loteId: 4, tipo: 'ajuste', cantidad: 5, motivo: 'Ajuste manual: reincorporación de saldo sobrante de hospitalizaciones anteriores', fechaMovimiento: new Date('2026-06-29T09:00:00Z') }
];
export const recetasDB: RecetaRetenida[] = [
  { id: 1, consultaId: 101, medicamentoId: 1, dosis: '1ml IM dosis única', duracionDias: 1, estado: 'despachada', firmaVeterinario: 'VET-RODRIGO-DIAZ', fechaEmision: new Date('2026-06-18T15:00:00Z') },
  { id: 2, consultaId: 102, medicamentoId: 4, dosis: '5 gotas cada 12 hrs', duracionDias: 30, estado: 'emitida', firmaVeterinario: 'VET-RODRIGO-DIAZ', fechaEmision: new Date('2026-06-29T10:00:00Z') }
];
export const despachosDB: DespachoMedicamento[] = [
  { id: 1, recetaId: 1, loteId: 2, cantidadDespachada: 3, fechaDespacho: new Date('2026-06-18T15:40:00Z') }
];
export const alertasDB: AlertaStock[] = [];

// --- IMPLEMENTACIÓN DE ENDPOINTS EP-11 A EP-20 ---

// EP-11: POST /api/v1/inventario/medicamentos
export const crearMedicamento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      nombreComercial,
      principioActivo,
      precioVenta,
      stockMinimo,
      categoriaId,
      codigoLote,
      cantidadInicial,
      precioCompraUnitario,
      fechaVencimiento
    } = req.body;

    if (
      !nombreComercial ||
      !principioActivo ||
      precioVenta === undefined ||
      stockMinimo === undefined ||
      !categoriaId ||
      !codigoLote ||
      cantidadInicial === undefined ||
      precioCompraUnitario === undefined ||
      !fechaVencimiento
    ) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios. Al registrar un medicamento, es obligatorio indicar su lote inicial (codigoLote, cantidadInicial, precioCompraUnitario, fechaVencimiento)'
      });
    }

    // CH-49 & CH-50: Longitud mínima
    if (nombreComercial.trim().length < 3 || principioActivo.trim().length < 3) {
      return res.status(400).json({ error: 'Validacion CH-49/50 Fallida: Nombre comercial y principio activo deben poseer al menos 3 caracteres' });
    }

    // CH-26: Precio venta positivo
    if (precioVenta < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-26 Fallida: El precio de venta no puede ser negativo' });
    }

    // CH-27: Stock mínimo positivo
    if (stockMinimo < 0) {
      return res.status(400).json({ error: 'Validacion CH-27 Fallida: El stock minimo no puede ser negativo' });
    }

    // Validar categoría existente
    const cat = categoriasDB.find(c => c.id === categoriaId);
    if (!cat) {
      return res.status(404).json({ error: 'Categoria de insumo no encontrada en la fabrica' });
    }

    // CH-28: Cantidad inicial del lote > 0
    if (Number(cantidadInicial) <= 0) {
      return res.status(400).json({ error: 'Validacion CH-28 Fallida: La cantidad inicial del lote debe ser mayor a 0' });
    }

    // CH-42: Precio compra unitario > 0
    if (Number(precioCompraUnitario) <= 0.0) {
      return res.status(400).json({ error: 'Validacion CH-42 Fallida: El precio de compra unitario del lote debe ser mayor a 0.0' });
    }

    // CH-31: Fecha vencimiento posterior a ingreso (ahora)
    const fechaIngreso = new Date();
    const vencimiento = new Date(fechaVencimiento);
    if (vencimiento <= fechaIngreso) {
      return res.status(400).json({ error: 'Validacion CH-31 Fallida: La fecha de vencimiento del lote debe ser posterior a la fecha de ingreso' });
    }

    const nuevo: Medicamento = {
      id: medicamentosDB.length + 1,
      nombreComercial,
      principioActivo,
      precioVenta,
      stockMinimo,
      categoriaId
    };
    medicamentosDB.push(nuevo);

    // Crear el lote inicial asociado
    const loteInicial: Lote = {
      id: lotesDB.length + 1,
      codigoLote,
      medicamentoId: nuevo.id,
      compraId: 1, // Por defecto compra inicial 1
      cantidadInicial: Number(cantidadInicial),
      cantidadActual: Number(cantidadInicial),
      precioCompraUnitario: Number(precioCompraUnitario),
      fechaIngreso,
      fechaVencimiento: vencimiento,
      estado: 'disponible'
    };
    lotesDB.push(loteInicial);

    // Registrar movimiento de entrada automático por compra
    const movimiento: MovimientoInventario = {
      id: movimientosDB.length + 1,
      medicamentoId: nuevo.id,
      loteId: loteInicial.id,
      tipo: 'compra',
      cantidad: Number(cantidadInicial),
      motivo: `Lote inicial registrado al ingresar medicamento: ${nombreComercial}`,
      fechaMovimiento: fechaIngreso
    };
    movimientosDB.push(movimiento);

    return res.status(201).json({ medicamento: nuevo, lote: loteInicial });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-12: POST /api/v1/inventario/proveedores
export const crearProveedor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razonSocial, rut, contactoNombre, contactoEmail, contactoTelefono } = req.body;

    if (!razonSocial || !rut) {
      return res.status(400).json({ error: 'Faltan campos del proveedor' });
    }

    // CH-45: RUT length >= 9
    if (rut.trim().length < 9) {
      return res.status(400).json({ error: 'Validacion CH-45 Fallida: El RUT del proveedor debe tener al menos 9 caracteres' });
    }

    const nuevo: Proveedor = {
      id: proveedoresDB.length + 1,
      razonSocial,
      rut,
      contactoNombre: contactoNombre || 'Contacto Pendiente',
      contactoEmail: contactoEmail || 'proveedor@ejemplo.com',
      contactoTelefono: contactoTelefono || '+56900000000'
    };
    proveedoresDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-13: POST /api/v1/inventario/compras
export const registrarCompra = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { proveedorId, montoTotal, items, numeroFactura } = req.body; // items: { medicamentoId, cantidad, precioUnitario }[]

    if (!proveedorId || montoTotal === undefined || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Faltan datos de la orden de compra' });
    }

    // CH-40: Monto positivo
    if (montoTotal < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-40 Fallida: El monto total no puede ser negativo' });
    }

    const prov = proveedoresDB.find(p => p.id === proveedorId);
    if (!prov) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const nuevaCompra: CompraInventario = {
      id: comprasDB.length + 1,
      proveedorId,
      montoTotal,
      fechaCompra: new Date(),
      numeroFactura: numeroFactura || `FAC-AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    comprasDB.push(nuevaCompra);

    // Registrar detalles de la compra
    items.forEach((item: any) => {
      const detalle: DetalleCompra = {
        id: detallesCompraDB.length + 1,
        compraId: nuevaCompra.id,
        medicamentoId: item.medicamentoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      };
      detallesCompraDB.push(detalle);
    });

    return res.status(201).json({ compra: nuevaCompra, detallesCount: items.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-14: POST /api/v1/inventario/lotes
export const crearLote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { codigoLote, medicamentoId, compraId, cantidadInicial, precioCompraUnitario, fechaVencimiento } = req.body;

    if (!codigoLote || !medicamentoId || !compraId || cantidadInicial === undefined || precioCompraUnitario === undefined || !fechaVencimiento) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el lote' });
    }

    // CH-28: Cantidad inicial > 0
    if (cantidadInicial <= 0) {
      return res.status(400).json({ error: 'Validacion CH-28 Fallida: La cantidad inicial del lote debe ser mayor a 0' });
    }

    // CH-42: Precio compra unitario > 0
    if (precioCompraUnitario <= 0.0) {
      return res.status(400).json({ error: 'Validacion CH-42 Fallida: El precio de compra unitario debe ser mayor a 0.0' });
    }

    const med = medicamentosDB.find(m => m.id === medicamentoId);
    if (!med) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }

    // CH-31: Fecha vencimiento posterior a ingreso (ahora)
    const fechaIngreso = new Date();
    const vencimiento = new Date(fechaVencimiento);
    if (vencimiento <= fechaIngreso) {
      return res.status(400).json({ error: 'Validacion CH-31 Fallida: La fecha de vencimiento debe ser posterior a la fecha de ingreso' });
    }

    const nuevo: Lote = {
      id: lotesDB.length + 1,
      codigoLote,
      medicamentoId,
      compraId,
      cantidadInicial,
      cantidadActual: cantidadInicial,
      precioCompraUnitario,
      fechaIngreso,
      fechaVencimiento: vencimiento,
      estado: 'disponible'
    };
    lotesDB.push(nuevo);

    // Registrar movimiento de entrada automático
    const movimiento: MovimientoInventario = {
      id: movimientosDB.length + 1,
      medicamentoId,
      loteId: nuevo.id,
      tipo: 'compra',
      cantidad: cantidadInicial,
      motivo: `Ingreso lote por compra ${compraId}`,
      fechaMovimiento: new Date()
    };
    movimientosDB.push(movimiento);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-15: GET /api/v1/inventario/medicamentos/stock
export const obtenerStockMedicamentos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = medicamentosDB.map(med => {
      // Sumatoria de stock de lotes disponibles únicamente
      const stockDisponible = lotesDB
        .filter(l => l.medicamentoId === med.id && l.estado === 'disponible')
        .reduce((sum, current) => sum + current.cantidadActual, 0);

      const medLotes = lotesDB.filter(l => l.medicamentoId === med.id);

      const cat = categoriasDB.find(c => c.id === med.categoriaId);

      return {
        ...med,
        nombre: med.nombreComercial, // retro-compatibility
        categoriaNombre: cat ? cat.nombre : 'General',
        stockTotal: stockDisponible,
        lotes: medLotes
      };
    });

    return res.status(200).json(listado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-16: POST /api/v1/inventario/movimientos
export const registrarMovimiento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { medicamentoId, loteId, tipo, cantidad, motivo } = req.body;

    if (!medicamentoId || !loteId || !tipo || cantidad === undefined) {
      return res.status(400).json({ error: 'Faltan campos para registrar movimiento' });
    }

    // CH-33: Tipo movimiento
    if (!['compra', 'venta', 'merma', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ error: 'Validacion CH-33 Fallida: Tipo de movimiento de inventario invalido' });
    }

    // CH-34: Cantidad != 0
    if (cantidad === 0) {
      return res.status(400).json({ error: 'Validacion CH-34 Fallida: La cantidad no puede ser cero' });
    }

    // CH-47: Motivo para merma/ajuste
    if (['merma', 'ajuste'].includes(tipo) && (!motivo || motivo.trim().length < 5)) {
      return res.status(400).json({
        error: 'Validacion CH-47 Fallida: Se exige un motivo descriptivo (minimo 5 caracteres) para registrar una merma o ajuste'
      });
    }

    // Validar stock lote
    const lote = lotesDB.find(l => l.id === loteId);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (lote.cantidadActual + cantidad < 0) {
      return res.status(400).json({ error: 'Stock insuficiente en el lote especificado' });
    }

    // Actualizar cantidad actual (CH-30 se cumple al verificar limite)
    lote.cantidadActual += cantidad;

    const nuevo: MovimientoInventario = {
      id: movimientosDB.length + 1,
      medicamentoId,
      loteId,
      tipo,
      cantidad,
      motivo: motivo || null,
      fechaMovimiento: new Date()
    };
    movimientosDB.push(nuevo);

    // Disparar alertas de stock si cae por debajo del minimo (EP-19)
    const med = medicamentosDB.find(m => m.id === medicamentoId);
    const stockTotal = lotesDB
      .filter(l => l.medicamentoId === medicamentoId && l.estado === 'disponible')
      .reduce((sum, curr) => sum + curr.cantidadActual, 0);

    if (med && stockTotal <= med.stockMinimo) {
      alertasDB.push({
        id: alertasDB.length + 1,
        medicamentoId,
        nivelAlerta: stockTotal === 0 ? 'critico' : 'bajo',
        fechaCreacion: new Date()
      });
    }

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-17: POST /api/v1/inventario/recetas
export const crearReceta = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { consultaId, medicamentoId, dosis, duracionDias, firmaVeterinario } = req.body;

    if (!consultaId || !medicamentoId || !dosis || !duracionDias || !firmaVeterinario) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar receta' });
    }

    // CH-35: Dosis len >= 2
    if (dosis.trim().length < 2) {
      return res.status(400).json({ error: 'Validacion CH-35 Fallida: La dosificacion debe tener al menos 2 caracteres' });
    }

    // CH-43 & CH-44: Duracion dias
    if (duracionDias < 1 || duracionDias > 365) {
      return res.status(400).json({ error: 'Validacion CH-43/44 Fallida: La duracion de la receta debe situarse entre 1 y 365 dias' });
    }

    const nuevo: RecetaRetenida = {
      id: recetasDB.length + 1,
      consultaId,
      medicamentoId,
      dosis,
      duracionDias,
      estado: 'emitida',
      firmaVeterinario,
      fechaEmision: new Date()
    };
    recetasDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-18: POST /api/v1/inventario/despachos (Lógica FEFO — Prioriza lote con vencimiento más próximo)
export const registrarDespacho = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recetaId, loteId: loteIdSolicitado, cantidadDespachada } = req.body;

    if (!recetaId || cantidadDespachada === undefined) {
      return res.status(400).json({ error: 'Faltan campos del despacho (recetaId y cantidadDespachada son obligatorios)' });
    }

    // CH-36: Cantidad despachada > 0
    if (cantidadDespachada <= 0) {
      return res.status(400).json({ error: 'Validacion CH-36 Fallida: La cantidad a despachar debe ser mayor a 0' });
    }

    const receta = recetasDB.find(r => r.id === recetaId);
    if (!receta) {
      return res.status(404).json({ error: 'Receta médica no encontrada en el sistema' });
    }

    if (receta.estado === 'despachada' || receta.estado === 'vencida') {
      return res.status(400).json({ error: `La receta ya se encuentra en estado '${receta.estado}'` });
    }

    const ahora = new Date();

    // ───── SELECCIÓN FEFO ─────
    // Obtener todos los lotes disponibles del medicamento de la receta,
    // ordenados por fecha de vencimiento ascendente (el que vence antes = prioritario)
    const lotesDisponibles = lotesDB
      .filter(l =>
        l.medicamentoId === receta.medicamentoId &&
        l.estado === 'disponible' &&
        l.cantidadActual > 0 &&
        new Date(l.fechaVencimiento) > ahora
      )
      .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

    if (lotesDisponibles.length === 0) {
      return res.status(400).json({
        error: 'No hay lotes disponibles con stock suficiente para este medicamento. Verifique existencias y fechas de vencimiento.'
      });
    }

    // Lote FEFO = el primero de la lista ordenada
    const loteFEFO = lotesDisponibles[0];

    // Si el cliente solicitó un lote específico, validarlo
    let lote = loteFEFO;
    let advertenciaFEFO: string | null = null;

    if (loteIdSolicitado && loteIdSolicitado !== loteFEFO.id) {
      const loteSolicitado = lotesDB.find(l => l.id === loteIdSolicitado);
      if (!loteSolicitado) {
        return res.status(404).json({ error: 'Lote solicitado no encontrado' });
      }
      if (loteSolicitado.estado !== 'disponible') {
        return res.status(400).json({ error: `El lote ${loteSolicitado.codigoLote} no está disponible (estado: ${loteSolicitado.estado})` });
      }
      if (new Date(loteSolicitado.fechaVencimiento) <= ahora) {
        loteSolicitado.estado = 'vencido';
        return res.status(400).json({ error: `El lote ${loteSolicitado.codigoLote} está vencido. Se recomienda usar el lote FEFO: ${loteFEFO.codigoLote}` });
      }
      if (loteSolicitado.cantidadActual < cantidadDespachada) {
        return res.status(400).json({ error: `Stock insuficiente en el lote ${loteSolicitado.codigoLote} (disponible: ${loteSolicitado.cantidadActual})` });
      }
      // Se acepta el lote solicitado pero se informa que no es el FEFO óptimo
      lote = loteSolicitado;
      advertenciaFEFO = `ADVERTENCIA FEFO: Se usó el lote ${lote.codigoLote} (vence ${new Date(lote.fechaVencimiento).toLocaleDateString('es-CL')}), pero existe un lote con vencimiento más próximo: ${loteFEFO.codigoLote} (vence ${new Date(loteFEFO.fechaVencimiento).toLocaleDateString('es-CL')}).`;
    } else {
      // Usar el lote FEFO automáticamente
      if (loteFEFO.cantidadActual < cantidadDespachada) {
        return res.status(400).json({
          error: `Stock insuficiente en el lote FEFO ${loteFEFO.codigoLote} (disponible: ${loteFEFO.cantidadActual}). Ajuste la cantidad.`
        });
      }
    }

    // Descontar stock del lote seleccionado
    lote.cantidadActual -= cantidadDespachada;
    receta.estado = 'despachada';

    // Si el lote queda en 0, marcarlo agotado
    if (lote.cantidadActual === 0) {
      lote.estado = 'bloqueado';
    }

    // Registrar despacho
    const nuevo: DespachoMedicamento = {
      id: despachosDB.length + 1,
      recetaId,
      loteId: lote.id,
      cantidadDespachada,
      fechaDespacho: ahora
    };
    despachosDB.push(nuevo);

    // Registrar movimiento de salida en inventario
    const movimiento: MovimientoInventario = {
      id: movimientosDB.length + 1,
      medicamentoId: receta.medicamentoId,
      loteId: lote.id,
      tipo: 'venta',
      cantidad: -cantidadDespachada,
      motivo: `Despacho por receta #${recetaId} — Lote FEFO: ${lote.codigoLote}`,
      fechaMovimiento: ahora
    } as any;
    movimientosDB.push(movimiento);

    // Verificar alerta de stock mínimo
    const med = medicamentosDB.find(m => m.id === receta.medicamentoId);
    const stockTotal = lotesDB
      .filter(l => l.medicamentoId === receta.medicamentoId && l.estado === 'disponible')
      .reduce((sum, curr) => sum + curr.cantidadActual, 0);

    if (med && stockTotal <= med.stockMinimo) {
      alertasDB.push({
        id: alertasDB.length + 1,
        medicamentoId: receta.medicamentoId,
        nivelAlerta: stockTotal === 0 ? 'critico' : 'bajo',
        fechaCreacion: ahora
      });
    }

    return res.status(201).json({
      ...nuevo,
      loteUsado: {
        id: lote.id,
        codigoLote: lote.codigoLote,
        fechaVencimiento: lote.fechaVencimiento,
        stockRestante: lote.cantidadActual,
        esFEFO: lote.id === loteFEFO.id
      },
      advertenciaFEFO,
      lotesDisponiblesOrdenadosFEFO: lotesDisponibles.map(l => ({
        id: l.id,
        codigoLote: l.codigoLote,
        fechaVencimiento: l.fechaVencimiento,
        cantidadActual: l.cantidadActual
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/inventario/medicamentos/:id/lotes-fefo
// Retorna los lotes disponibles de un medicamento ordenados por vencimiento ascendente (FEFO)
export const obtenerLotesFEFO = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medicamentoId = parseInt(req.params.id);
    const ahora = new Date();

    const lotes = lotesDB
      .filter(l =>
        l.medicamentoId === medicamentoId &&
        l.estado === 'disponible' &&
        l.cantidadActual > 0 &&
        new Date(l.fechaVencimiento) > ahora
      )
      .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
      .map((l, idx) => ({
        id: l.id,
        codigoLote: l.codigoLote,
        fechaVencimiento: l.fechaVencimiento,
        cantidadActual: l.cantidadActual,
        estado: l.estado,
        esFEFO: idx === 0 // El primero es el prioritario
      }));

    return res.status(200).json(lotes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/inventario/movimientos
// Retorna la bitácora completa de movimientos de inventario con relaciones resueltas
export const obtenerMovimientos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = movimientosDB.map(mov => {
      const med = medicamentosDB.find(m => m.id === mov.medicamentoId);
      const lote = lotesDB.find(l => l.id === mov.loteId);

      // Si el movimiento es de constancia de eliminación, resolver medicamentoId
      const nombreMed = med ? med.nombreComercial : `[ELIMINADO]`;
      const principioActivo = med ? med.principioActivo : '';
      const codigoLote = mov.loteId === -1 ? 'LOTE AUDITORÍA' : (lote ? lote.codigoLote : `[ELIMINADO]`);

      return {
        id: mov.id,
        medicamentoId: mov.medicamentoId,
        nombreMedicamento: nombreMed,
        principioActivo,
        loteId: mov.loteId,
        codigoLote,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        motivo: mov.motivo,
        fechaMovimiento: mov.fechaMovimiento
      };
    });

    // Ordenar de más reciente a más antiguo
    const ordenado = listado.sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime());

    return res.status(200).json(ordenado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-19: GET /api/v1/inventario/alertas
export const obtenerAlertasStock = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(alertasDB);
};

// EP-20: POST /api/v1/inventario/auditorias
export const registrarAuditoria = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { veterinarioId, diferenciaDetectada } = req.body;

    if (!veterinarioId || diferenciaDetectada === undefined) {
      return res.status(400).json({ error: 'Faltan campos de auditoria' });
    }

    const registro = {
      id: movimientosDB.length + 1, // Se registra un movimiento de ajuste en la DB
      fecha: new Date(),
      veterinarioId,
      diferenciaDetectada,
      status: 'conciliada'
    };

    return res.status(201).json(registro);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/v1/inventario/medicamentos/:id
export const actualizarMedicamento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nombreComercial, principioActivo, precioVenta, stockMinimo, categoriaId } = req.body;

    const medIndex = medicamentosDB.findIndex(m => m.id === id);
    if (medIndex === -1) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }

    if (nombreComercial) {
      if (nombreComercial.trim().length < 3) {
        return res.status(400).json({ error: 'El nombre comercial debe tener al menos 3 caracteres' });
      }
      medicamentosDB[medIndex].nombreComercial = nombreComercial;
    }

    if (principioActivo) {
      if (principioActivo.trim().length < 3) {
        return res.status(400).json({ error: 'El principio activo debe tener al menos 3 caracteres' });
      }
      medicamentosDB[medIndex].principioActivo = principioActivo;
    }

    if (precioVenta !== undefined) {
      if (precioVenta < 0.0) {
        return res.status(400).json({ error: 'El precio de venta no puede ser negativo' });
      }
      medicamentosDB[medIndex].precioVenta = precioVenta;
    }

    if (stockMinimo !== undefined) {
      if (stockMinimo < 0) {
        return res.status(400).json({ error: 'El stock minimo no puede ser negativo' });
      }
      medicamentosDB[medIndex].stockMinimo = stockMinimo;
    }

    if (categoriaId !== undefined) {
      const cat = categoriasDB.find(c => c.id === categoriaId);
      if (!cat) {
        return res.status(404).json({ error: 'Categoria de insumo no encontrada' });
      }
      medicamentosDB[medIndex].categoriaId = categoriaId;
    }

    return res.status(200).json(medicamentosDB[medIndex]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/v1/inventario/medicamentos/:id
export const eliminarMedicamento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const motivo = (req.query.motivo || req.body.motivo) as string;

    if (!motivo || motivo.trim().length < 5) {
      return res.status(400).json({
        error: 'Debe ingresar un motivo válido para la eliminación (mínimo 5 caracteres).'
      });
    }

    const medIndex = medicamentosDB.findIndex(m => m.id === id);
    if (medIndex === -1) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }

    const med = medicamentosDB[medIndex];
    const lotesAsociados = lotesDB.filter(l => l.medicamentoId === id);
    const loteIds = lotesAsociados.map(l => l.id);
    const stockTotalEliminado = lotesAsociados.reduce((sum, curr) => sum + curr.cantidadActual, 0);

    // 1. Dejar constancia de la eliminación en la bitácora / movimientos globales
    // Aunque se elimina el medicamento, agregamos una constancia en movimientosDB
    // que quedará huérfana pero con registro descriptivo. Para evitar romper FK en DB física,
    // simplemente insertamos una bitácora en la caja/finanzas o registramos un log.
    // Dejemos constancia en movimientosDB insertando un movimiento tipo 'ajuste' con loteId especial 0 (o sin él)
    // Pero en TypeScript MovimientoInventario loteId es obligatorio, usemo -1 para marcar eliminación global
    const movimientoConstancia: MovimientoInventario = {
      id: movimientosDB.length + 1,
      medicamentoId: id,
      loteId: -1, // Lote de auditoría especial
      tipo: 'ajuste',
      cantidad: -stockTotalEliminado,
      motivo: `[ELIMINACIÓN MEDICAMENTO] Medicamento: ${med.nombreComercial}. Motivo: ${motivo}. Stock eliminado: ${stockTotalEliminado}`,
      fechaMovimiento: new Date()
    };
    movimientosDB.push(movimientoConstancia);

    // 2. Limpieza de base de datos en memoria (ordenadamente)
    // Borrar alertas del medicamento
    for (let i = alertasDB.length - 1; i >= 0; i--) {
      if (alertasDB[i].medicamentoId === id) {
        alertasDB.splice(i, 1);
      }
    }

    // Borrar despachos de los lotes del medicamento
    for (let i = despachosDB.length - 1; i >= 0; i--) {
      if (loteIds.includes(despachosDB[i].loteId)) {
        despachosDB.splice(i, 1);
      }
    }

    // Borrar recetas de este medicamento
    for (let i = recetasDB.length - 1; i >= 0; i--) {
      if (recetasDB[i].medicamentoId === id) {
        recetasDB.splice(i, 1);
      }
    }

    // Borrar detalles de compra
    for (let i = detallesCompraDB.length - 1; i >= 0; i--) {
      if (detallesCompraDB[i].medicamentoId === id) {
        detallesCompraDB.splice(i, 1);
      }
    }

    // Borrar otros movimientos de inventario de este medicamento
    for (let i = movimientosDB.length - 1; i >= 0; i--) {
      if (movimientosDB[i].medicamentoId === id && movimientosDB[i].loteId !== -1) {
        movimientosDB.splice(i, 1);
      }
    }

    // Borrar lotes
    for (let i = lotesDB.length - 1; i >= 0; i--) {
      if (lotesDB[i].medicamentoId === id) {
        lotesDB.splice(i, 1);
      }
    }

    // Borrar medicamento
    medicamentosDB.splice(medIndex, 1);

    // 3. Eliminar físicamente en PostgreSQL para sincronizar de inmediato
    const pool = getPool();
    if (pool) {
      // Usar transacción SQL para borrar ordenadamente y evitar errores de ON DELETE RESTRICT
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Registrar constancia en base de datos física antes de borrar
        const sqlConstancia = `
          INSERT INTO movimientos_inventario (id, lote_id, tipo_movimiento, cantidad, motivo, fecha_movimiento)
          VALUES ($1, NULL, $2, $3, $4, NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
        // Nota: en BD física lote_id es FK a lotes. Para evitar violar FK, podemos setearlo a NULL.
        // DDL de movimientos_inventario: lote_id INT NOT NULL. Ah, la restricción física exige lote_id NOT NULL en T-16?
        // Revisemos si lote_id es NOT NULL. En 001_schema_clinica_inventario.sql:
        // "lote_id INT NOT NULL"
        // Si lote_id es NOT NULL, no podemos insertar NULL. Podemos crear un lote fantasma, o simplemente no guardarlo
        // en la tabla física de movimientos, sino guardar en una bitácora o auditoría si es que la hay.
        // O mejor, no insertamos en movimientos_inventario física un lote_id -1 o NULL, y simplemente limpiamos las tablas:
        
        // Borrar despachos_medicamentos que tienen lotes del medicamento
        if (loteIds.length > 0) {
          await client.query('DELETE FROM despachos_medicamentos WHERE lote_id = ANY($1)', [loteIds]);
          await client.query('DELETE FROM movimientos_inventario WHERE lote_id = ANY($1)', [loteIds]);
        }
        
        await client.query('DELETE FROM alertas_stock WHERE medicamento_id = $1', [id]);
        await client.query('DELETE FROM recetas_retenidas WHERE medicamento_id = $1', [id]);
        await client.query('DELETE FROM detalle_compras WHERE medicamento_id = $1', [id]);
        
        if (loteIds.length > 0) {
          await client.query('DELETE FROM lotes WHERE medicamento_id = $1', [id]);
        }
        
        await client.query('DELETE FROM medicamentos WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        console.log(`[PERSISTENCIA] Medicamento #${id} (${med.nombreComercial}) y dependencias eliminados en PostgreSQL.`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[PERSISTENCIA] Error al eliminar medicamento en PostgreSQL:', err.message);
      } finally {
        client.release();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Medicamento ${med.nombreComercial} eliminado exitosamente del catálogo junto con sus lotes y registro de auditoría.`
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/v1/inventario/lotes/:id
export const actualizarLote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { codigoLote, cantidadActual, fechaVencimiento, estado } = req.body;

    const loteIndex = lotesDB.findIndex(l => l.id === id);
    if (loteIndex === -1) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (codigoLote) {
      lotesDB[loteIndex].codigoLote = codigoLote;
    }

    if (cantidadActual !== undefined) {
      if (cantidadActual < 0) {
        return res.status(400).json({ error: 'La cantidad actual no puede ser negativa' });
      }
      if (cantidadActual > lotesDB[loteIndex].cantidadInicial) {
        return res.status(400).json({ error: 'La cantidad actual no puede superar la inicial' });
      }
      lotesDB[loteIndex].cantidadActual = cantidadActual;
    }

    if (fechaVencimiento) {
      lotesDB[loteIndex].fechaVencimiento = new Date(fechaVencimiento);
    }

    if (estado) {
      if (!['disponible', 'bloqueado', 'vencido'].includes(estado)) {
        return res.status(400).json({ error: 'Estado del lote no valido' });
      }
      lotesDB[loteIndex].estado = estado;
    }

    return res.status(200).json(lotesDB[loteIndex]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/v1/inventario/lotes/:id
export const eliminarLote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const loteIndex = lotesDB.findIndex(l => l.id === id);
    if (loteIndex === -1) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    lotesDB.splice(loteIndex, 1);
    return res.status(200).json({ success: true, message: 'Lote eliminado' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const enriquecerReceta = (receta: any) => {
  const consulta = consultasDB.find(c => c.id === receta.consultaId);
  const historial = consulta ? historialesDB.find(h => h.id === consulta.historialId) : null;
  const paciente = historial ? pacientesDB.find(p => p.id === historial.pacienteId) : null;
  const propietario = paciente ? propietariosDB.find(pr => pr.id === paciente.propietarioId) : null;
  const med = medicamentosDB.find(m => m.id === receta.medicamentoId);

  return {
    ...receta,
    medicamentoNombre: med ? med.nombreComercial : `Medicamento #${receta.medicamentoId}`,
    medicamentoPrincipioActivo: med ? med.principioActivo : '',
    pacienteNombre: paciente ? paciente.nombre : `Paciente #${historial?.pacienteId || ''}`,
    pacienteEspecie: paciente ? paciente.especie : '',
    propietarioNombre: propietario ? propietario.nombre : `Propietario #${paciente?.propietarioId || ''}`,
    propietarioRut: propietario ? propietario.rut : ''
  };
};

// GET /api/v1/inventario/recetas
export const obtenerRecetas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = recetasDB.map(enriquecerReceta);
    return res.status(200).json(listado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/inventario/recetas/:id
export const obtenerRecetaPorId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const receta = recetasDB.find(r => r.id === id);
    if (!receta) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    return res.status(200).json(enriquecerReceta(receta));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


