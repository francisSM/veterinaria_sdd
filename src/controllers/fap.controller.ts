import { Response } from 'express';
import { AuthenticatedRequest } from '../app';
import {
  CajasDiarias,
  ArqueosCaja,
  MetodosPago,
  ComprobantesFiscales,
  DetallesComprobantes,
  Pagos,
  ConveniosSeguros,
  NotasCredito,
  DescuentosAplicados,
  BitacoraTransacciones
} from '../models/fap';

// Almacenes temporales en memoria para FAP
export const cajasDB: CajasDiarias[] = [];
export const arqueosDB: ArqueosCaja[] = [];
export const metodosPagoDB: MetodosPago[] = [
  { id: 1, nombre: 'Efectivo', codigo: 'efectivo' },
  { id: 2, nombre: 'Tarjeta de Débito', codigo: 'tarjeta_debito' },
  { id: 3, nombre: 'Tarjeta de Crédito', codigo: 'tarjeta_credito' },
  { id: 4, nombre: 'Transferencia', codigo: 'transferencia' },
  { id: 5, nombre: 'Seguro Mascota', codigo: 'seguro' }
];
export const comprobantesDB: ComprobantesFiscales[] = [];
export const detallesComprobantesDB: DetallesComprobantes[] = [];
export const pagosDB: Pagos[] = [];
export const conveniosDB: ConveniosSeguros[] = [];
export const notasCreditoDB: NotasCredito[] = [];
export const descuentosDB: DescuentosAplicados[] = [];
export const bitacoraDB: BitacoraTransacciones[] = [];

// --- IMPLEMENTACIÓN DE ENDPOINTS EP-21 A EP-30 ---

// EP-21: POST /api/v1/fap/cajas/apertura
export const abrirCaja = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cajeroId, montoApertura } = req.body;

    if (cajeroId === undefined || montoApertura === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para abrir caja' });
    }

    // CH-51 & CH-52: Monto apertura entre 0 y 1000000
    if (montoApertura < 0.0 || montoApertura > 1000000.0) {
      return res.status(400).json({
        error: 'Validacion CH-51/52 Fallida: El monto de apertura debe estar entre 0.0 y 1,000,000.0'
      });
    }

    // Validar si ya hay una caja abierta para este cajero
    const abierta = cajasDB.some(c => c.cajeroId === cajeroId && c.estado === 'abierta');
    if (abierta) {
      return res.status(400).json({ error: 'El cajero ya tiene una caja abierta' });
    }

    const nueva: CajasDiarias = {
      id: cajasDB.length + 1,
      cajeroId,
      montoApertura,
      montoCierre: null,
      estado: 'abierta',
      fechaApertura: new Date(),
      fechaCierre: null
    };
    cajasDB.push(nueva);

    // Registrar en bitácora
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: nueva.id,
      descripcion: `Apertura de caja con saldo de ${montoApertura}`,
      monto: montoApertura,
      tipoTransaccion: 'ingreso',
      fechaRegistro: new Date()
    });

    return res.status(201).json(nueva);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-22: POST /api/v1/fap/cajas/:id/arqueo (Lógica de Arqueo Ciego)
export const registrarArqueo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cajaId = parseInt(req.params.id);
    const { montoFisico, tipoArqueo, comentarioSupervisor } = req.body;

    if (montoFisico === undefined || !tipoArqueo) {
      return res.status(400).json({ error: 'Faltan campos para registrar el arqueo' });
    }

    // CH-55: Monto físico positivo
    if (montoFisico < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-55 Fallida: El monto fisico no puede ser negativo' });
    }

    // CH-71: Tipos de arqueo
    if (!['apertura', 'cierre', 'auditoria'].includes(tipoArqueo)) {
      return res.status(400).json({ error: 'Validacion CH-71 Fallida: Tipo de arqueo invalido' });
    }

    const caja = cajasDB.find(c => c.id === cajaId);
    if (!caja) {
      return res.status(404).json({ error: 'Caja diaria especificada no encontrada' });
    }

    // Calcular balance del sistema a partir de las transacciones registradas en la bitácora para esta caja
    const ingresos = bitacoraDB
      .filter(b => b.cajaDiariaId === cajaId && b.tipoTransaccion === 'ingreso')
      .reduce((sum, curr) => sum + curr.monto, 0);

    const egresos = bitacoraDB
      .filter(b => b.cajaDiariaId === cajaId && b.tipoTransaccion === 'egreso')
      .reduce((sum, curr) => sum + curr.monto, 0);

    const balanceSistema = caja.montoApertura + ingresos - egresos;

    // Lógica de arqueo ciego: calcular diferencia
    const diferencia = montoFisico - balanceSistema;

    // CH-75: Exigir comentario de supervisor si hay diferencias
    if (diferencia !== 0.0 && (!comentarioSupervisor || comentarioSupervisor.trim().length < 5)) {
      return res.status(400).json({
        error: 'Validacion CH-75 Fallida: Se exige un comentario de supervisor descriptivo (minimo 5 caracteres) debido a diferencias en el arqueo ciego'
      });
    }

    const nuevoArqueo: ArqueosCaja = {
      id: arqueosDB.length + 1,
      cajaDiariaId: cajaId,
      montoFisico,
      balanceSistema,
      diferencia,
      tipoArqueo,
      comentarioSupervisor: comentarioSupervisor || null,
      fechaArqueo: new Date()
    };
    arqueosDB.push(nuevoArqueo);

    // Si hay diferencia, registrar en bitácora como ajuste
    if (diferencia !== 0.0) {
      bitacoraDB.push({
        id: bitacoraDB.length + 1,
        cajaDiariaId: cajaId,
        descripcion: `Ajuste por arqueo. Diferencia detectada: ${diferencia}`,
        monto: Math.abs(diferencia),
        tipoTransaccion: 'ajuste',
        fechaRegistro: new Date()
      });
    }

    return res.status(201).json(nuevoArqueo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-23: POST /api/v1/fap/cajas/:id/cierre
export const cerrarCaja = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cajaId = parseInt(req.params.id);
    const { montoCierre } = req.body;

    if (montoCierre === undefined) {
      return res.status(400).json({ error: 'Falta ingresar el monto de cierre' });
    }

    // CH-53: Monto de cierre positivo
    if (montoCierre < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-53 Fallida: El monto de cierre no puede ser negativo' });
    }

    const caja = cajasDB.find(c => c.id === cajaId);
    if (!caja) {
      return res.status(404).json({ error: 'Caja diaria no encontrada' });
    }

    if (caja.estado !== 'abierta') {
      return res.status(400).json({ error: 'La caja ya no se encuentra abierta' });
    }

    caja.montoCierre = montoCierre;
    caja.estado = 'cerrada';
    caja.fechaCierre = new Date();

    return res.status(200).json(caja);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-24: POST /api/v1/fap/comprobantes
export const crearComprobante = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propietarioId, cajaDiariaId, tipoDocumento, folioFactura, montoTotal, items } = req.body;

    if (!propietarioId || !cajaDiariaId || !tipoDocumento || montoTotal === undefined || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el comprobante' });
    }

    // CH-59: Tipo de comprobante
    if (!['boleta', 'factura', 'nota_credito'].includes(tipoDocumento)) {
      return res.status(400).json({ error: 'Validacion CH-59 Fallida: Tipo de documento fiscal no valido' });
    }

    // CH-60: Monto total positivo
    if (montoTotal < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-60 Fallida: El monto total no puede ser negativo' });
    }

    const nuevo: ComprobantesFiscales = {
      id: comprobantesDB.length + 1,
      propietarioId,
      cajaDiariaId,
      tipoDocumento,
      folioFactura: folioFactura || null,
      montoTotal,
      estado: 'emitida',
      fechaEmision: new Date()
    };
    comprobantesDB.push(nuevo);

    // Registrar detalles
    items.forEach((item: any) => {
      // CH-73 & CH-74: Validación de descuento del ítem
      const descuento = item.descuentoItem || 0.0;
      if (descuento < 0.0 || descuento > item.precioUnitario) {
        throw new Error('Validacion CH-73/74 Fallida: Descuento de item fuera de limites permitidos');
      }

      detallesComprobantesDB.push({
        id: detallesComprobantesDB.length + 1,
        comprobanteId: nuevo.id,
        descripcion: item.descripcion,
        cantidadItems: item.cantidadItems,
        precioUnitario: item.precioUnitario,
        descuentoItem: descuento,
        consultaId: item.consultaId || null,
        despachoId: item.despachoId || null
      });
    });

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// EP-25: POST /api/v1/fap/pagos
export const registrarPago = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { boletaId, metodoPagoId, montoPagado } = req.body;

    if (!boletaId || !metodoPagoId || montoPagado === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios del pago' });
    }

    // CH-64: Monto pagado positivo
    if (montoPagado <= 0.0) {
      return res.status(400).json({ error: 'Validacion CH-64 Fallida: El monto pagado debe ser mayor a 0.0' });
    }

    const comp = comprobantesDB.find(c => c.id === boletaId);
    if (!comp) {
      return res.status(404).json({ error: 'Comprobante fiscal no encontrado' });
    }

    const met = metodosPagoDB.find(m => m.id === metodoPagoId);
    if (!met) {
      return res.status(404).json({ error: 'Metodo de pago no encontrado' });
    }

    const nuevo: Pagos = {
      id: pagosDB.length + 1,
      boletaId,
      metodoPagoId,
      montoPagado,
      fechaPago: new Date()
    };
    pagosDB.push(nuevo);

    // Cambiar estado de comprobante
    comp.estado = 'pagada';

    // Registrar en bitácora de caja diaria
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: comp.cajaDiariaId,
      descripcion: `Pago boleta/factura ${boletaId} - Metodo: ${met.nombre}`,
      monto: montoPagado,
      tipoTransaccion: 'ingreso',
      fechaRegistro: new Date()
    });

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-26: POST /api/v1/fap/descuentos
export const aplicarDescuento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { boletaId, motivo, porcentaje } = req.body;

    if (!boletaId || !motivo || porcentaje === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el descuento' });
    }

    // CH-68 & CH-69: Porcentaje entre 0 y 50%
    if (porcentaje < 0.0 || porcentaje > 50.0) {
      return res.status(400).json({
        error: 'Validacion CH-68/69 Fallida: El porcentaje de descuento debe situarse entre 0% y 50%'
      });
    }

    const comp = comprobantesDB.find(c => c.id === boletaId);
    if (!comp) {
      return res.status(404).json({ error: 'Comprobante fiscal no encontrado' });
    }

    const nuevo: DescuentosAplicados = {
      id: descuentosDB.length + 1,
      boletaId,
      motivo,
      porcentaje
    };
    descuentosDB.push(nuevo);

    // Re-calcular total del comprobante
    const descuentoMonto = comp.montoTotal * (porcentaje / 100);
    comp.montoTotal -= descuentoMonto;

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-27: POST /api/v1/fap/notas-credito
export const emitirNotaCredito = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { comprobanteOriginalId, motivo } = req.body;

    if (!comprobanteOriginalId || !motivo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para nota de credito' });
    }

    const original = comprobantesDB.find(c => c.id === comprobanteOriginalId);
    if (!original) {
      return res.status(404).json({ error: 'Comprobante original no encontrado' });
    }

    // Emitir comprobante de anulación
    const anulacion: ComprobantesFiscales = {
      id: comprobantesDB.length + 1,
      propietarioId: original.propietarioId,
      cajaDiariaId: original.cajaDiariaId,
      tipoDocumento: 'nota_credito',
      folioFactura: original.folioFactura ? `NC-${original.folioFactura}` : null,
      montoTotal: original.montoTotal,
      estado: 'emitida',
      fechaEmision: new Date()
    };
    comprobantesDB.push(anulacion);

    const nota: NotasCredito = {
      id: notasCreditoDB.length + 1,
      comprobanteOriginalId,
      comprobanteAnulacionId: anulacion.id,
      motivo,
      fechaCreacion: new Date()
    };
    notasCreditoDB.push(nota);

    // Cambiar estado original
    original.estado = 'anulada';

    // Registrar en bitácora como egreso
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: original.cajaDiariaId,
      descripcion: `Nota de Credito emitida para anular boleta ${comprobanteOriginalId}`,
      monto: original.montoTotal,
      tipoTransaccion: 'egreso',
      fechaRegistro: new Date()
    });

    return res.status(201).json(nota);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-28: POST /api/v1/fap/convenios
export const registrarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propietarioId, compania, polizaNumero } = req.body;

    if (!propietarioId || !compania || !polizaNumero) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // CH-65: Poliza longitud >= 5
    if (polizaNumero.trim().length < 5) {
      return res.status(400).json({
        error: 'Validacion CH-65 Fallida: El numero de poliza debe poseer al menos 5 caracteres de longitud'
      });
    }

    const nuevo: ConveniosSeguros = {
      id: conveniosDB.length + 1,
      propietarioId,
      compania,
      polizaNumero
    };
    conveniosDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-29: GET /api/v1/fap/cajas/historico
export const obtenerCajasHistorico = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    cajas: cajasDB,
    arqueos: arqueosDB
  });
};

// EP-30: GET /api/v1/fap/cajas/:id/bitacora
export const obtenerBitacoraCaja = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cajaId = parseInt(req.params.id);
    const transacciones = bitacoraDB.filter(b => b.cajaDiariaId === cajaId);
    return res.status(200).json(transacciones);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
