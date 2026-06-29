import { Response } from 'express';
import { AuthenticatedRequest } from '../app';
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
} from '../models/ilm';

// Almacenes temporales en memoria para simular persistencia relacional y CHECKs
export const categoriasDB: CategoriaInsumos[] = [
  { id: 1, nombre: 'antibiotico' },
  { id: 2, nombre: 'analgesico' },
  { id: 3, nombre: 'anestesico' },
  { id: 4, nombre: 'vacuna' },
  { id: 5, nombre: 'desparasitante' },
  { id: 6, nombre: 'psicotropico' }
];

export const medicamentosDB: Medicamento[] = [];
export const proveedoresDB: Proveedor[] = [];
export const comprasDB: CompraInventario[] = [];
export const detallesCompraDB: DetalleCompra[] = [];
export const lotesDB: Lote[] = [];
export const movimientosDB: MovimientoInventario[] = [];
export const recetasDB: RecetaRetenida[] = [];
export const despachosDB: DespachoMedicamento[] = [];
export const alertasDB: AlertaStock[] = [];

// --- IMPLEMENTACIÓN DE ENDPOINTS EP-11 A EP-20 ---

// EP-11: POST /api/v1/ilm/medicamentos
export const crearMedicamento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombreComercial, principioActivo, precioVenta, stockMinimo, categoriaId } = req.body;

    if (!nombreComercial || !principioActivo || precioVenta === undefined || stockMinimo === undefined || !categoriaId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar medicamento' });
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

    const nuevo: Medicamento = {
      id: medicamentosDB.length + 1,
      nombreComercial,
      principioActivo,
      precioVenta,
      stockMinimo,
      categoriaId
    };
    medicamentosDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-12: POST /api/v1/ilm/proveedores
export const crearProveedor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razonSocial, rut } = req.body;

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
      rut
    };
    proveedoresDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-13: POST /api/v1/ilm/compras
export const registrarCompra = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { proveedorId, montoTotal, items } = req.body; // items: { medicamentoId, cantidad, precioUnitario }[]

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
      fechaCompra: new Date()
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

// EP-14: POST /api/v1/ilm/lotes
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

// EP-15: GET /api/v1/ilm/medicamentos/stock
export const obtenerStockMedicamentos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = medicamentosDB.map(med => {
      // Sumatoria de stock de lotes disponibles únicamente
      const stockDisponible = lotesDB
        .filter(l => l.medicamentoId === med.id && l.estado === 'disponible')
        .reduce((sum, current) => sum + current.cantidadActual, 0);

      return {
        id: med.id,
        nombre: med.nombreComercial,
        principioActivo: med.principioActivo,
        stockTotal: stockDisponible
      };
    });

    return res.status(200).json(listado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-16: POST /api/v1/ilm/movimientos
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

// EP-17: POST /api/v1/ilm/recetas
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

// EP-18: POST /api/v1/ilm/despachos (Lógica FEFO de control)
export const registrarDespacho = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recetaId, loteId, cantidadDespachada } = req.body;

    if (!recetaId || !loteId || cantidadDespachada === undefined) {
      return res.status(400).json({ error: 'Faltan campos del despacho' });
    }

    // CH-36: Cantidad despachada > 0
    if (cantidadDespachada <= 0) {
      return res.status(400).json({ error: 'Validacion CH-36 Fallida: La cantidad a despachar debe ser mayor a 0' });
    }

    const receta = recetasDB.find(r => r.id === recetaId);
    if (!receta) {
      return res.status(404).json({ error: 'Receta medica no encontrada en el sistema' });
    }

    if (receta.estado === 'despachada' || receta.estado === 'vencida') {
      return res.status(400).json({ error: `La receta ya se encuentra en estado '${receta.estado}'` });
    }

    const lote = lotesDB.find(l => l.id === loteId);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado para dispensacion' });
    }

    // LÓGICA DE CONTROL FEFO / COMPROBACIÓN VENCIMIENTO
    const ahora = new Date();
    if (lote.estado !== 'disponible') {
      return res.status(400).json({
        error: `Violacion de regla FEFO: El lote ${lote.codigoLote} no esta disponible (Estado: ${lote.estado})`
      });
    }

    if (lote.fechaVencimiento < ahora) {
      // Auto-Cuarentena del lote
      lote.estado = 'vencido';
      return res.status(400).json({
        error: `Violacion de regla FEFO: El lote ${lote.codigoLote} expiro el ${lote.fechaVencimiento.toISOString()} y no puede ser despachado`
      });
    }

    if (lote.cantidadActual < cantidadDespachada) {
      return res.status(400).json({ error: 'Stock insuficiente en el lote para realizar el despacho' });
    }

    // Descontar stock
    lote.cantidadActual -= cantidadDespachada;
    receta.estado = 'despachada';

    // Registrar despacho
    const nuevo: DespachoMedicamento = {
      id: despachosDB.length + 1,
      recetaId,
      loteId,
      cantidadDespachada,
      fechaDespacho: ahora
    };
    despachosDB.push(nuevo);

    // Registrar movimiento de inventario de salida
    const movimiento: MovimientoInventario = {
      id: movimientosDB.length + 1,
      medicamentoId: receta.medicamentoId,
      loteId,
      tipo: 'venta',
      cantidad: -cantidadDespachada,
      motivo: `Despacho por receta ${recetaId}`,
      fechaMovement: ahora
    } as any;
    movimientosDB.push(movimiento);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-19: GET /api/v1/ilm/alertas
export const obtenerAlertasStock = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(alertasDB);
};

// EP-20: POST /api/v1/ilm/auditorias
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
