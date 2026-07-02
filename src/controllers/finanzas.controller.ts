import { Response } from 'express';
import { AuthenticatedRequest, usuariosDB } from '../middleware/auth';
import { propietariosDB, pacientesDB } from './clinica.controller';
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
  BitacoraTransacciones,
  ServiciosTarifas,
  CampanasDescuentos,
  CompromisosPago
} from '../models/finanzas';

// Almacenes temporales en memoria para FAP
export const cajasDB: CajasDiarias[] = [
  {
    id: 1,
    cajeroId: 2,
    montoApertura: 150000,
    montoCierre: null,
    estado: 'abierta',
    fechaApertura: new Date('2026-06-25T08:00:00Z'),
    fechaCierre: null
  }
];
export const arqueosDB: ArqueosCaja[] = [];
export const metodosPagoDB: MetodosPago[] = [
  { id: 1, nombre: 'Efectivo', codigo: 'efectivo' },
  { id: 2, nombre: 'Tarjeta de Débito', codigo: 'tarjeta_debito' },
  { id: 3, nombre: 'Tarjeta de Crédito', codigo: 'tarjeta_credito' },
  { id: 4, nombre: 'Transferencia', codigo: 'transferencia' },
  { id: 5, nombre: 'Seguro Mascota', codigo: 'seguro' }
];
export const comprobantesDB: ComprobantesFiscales[] = [
  { id: 1, propietarioId: 3, cajaDiariaId: 1, tipoDocumento: 'boleta', folioFactura: null, montoTotal: 35000.00, estado: 'pagada', fechaEmision: new Date('2026-06-29T11:15:00Z'), operadorId: 2, operadorRol: 'veterinario' },
  { id: 2, propietarioId: 4, cajaDiariaId: 1, tipoDocumento: 'factura', folioFactura: 'F-10029', montoTotal: 120000.00, estado: 'pagada', fechaEmision: new Date('2026-06-29T14:30:00Z'), operadorId: 1, operadorRol: 'administrador' },
  { id: 3, propietarioId: 3, cajaDiariaId: 1, tipoDocumento: 'boleta', folioFactura: null, montoTotal: 80000.00, estado: 'emitida', fechaEmision: new Date('2026-06-29T16:30:00Z'), operadorId: 1, operadorRol: 'administrador' }
];
export const detallesComprobantesDB: DetallesComprobantes[] = [
  { id: 1, comprobanteId: 1, descripcion: 'Consulta Médica General + Triaje', cantidadItems: 1, precioUnitario: 35000.00, descuentoItem: 0.00, consultaId: null, despachoId: null },
  { id: 2, comprobanteId: 2, descripcion: 'Procedimiento Quirúrgico Esterilización Completa', cantidadItems: 1, precioUnitario: 120000.00, descuentoItem: 0.00, consultaId: null, despachoId: null },
  { id: 3, comprobanteId: 3, descripcion: 'Cirugía Mayor con Insumos Especiales', cantidadItems: 1, precioUnitario: 80000.00, descuentoItem: 0.00, consultaId: null, despachoId: null }
];
export const pagosDB: Pagos[] = [
  { id: 1, boletaId: 1, metodoPagoId: 1, montoPagado: 35000.00, fechaPago: new Date('2026-06-29T11:16:00Z') },
  { id: 2, boletaId: 2, metodoPagoId: 2, montoPagado: 120000.00, fechaPago: new Date('2026-06-29T14:31:00Z') },
  { id: 3, boletaId: 3, metodoPagoId: 1, montoPagado: 30000.00, fechaPago: new Date('2026-06-29T16:31:00Z') }
];
export const conveniosDB: ConveniosSeguros[] = [
  { id: 1, propietarioId: 3, compania: 'Bupa Pets Cobertura', polizaNumero: 'POL-99281', pacienteId: 1, coberturaPorcentaje: 80.00, cubreCirugias: true, cubreMedicamentos: true, medicamentosCobertura: '1,2,4', cirugiasCobertura: 'Cirugía Mayor, Esterilización (hembra)' },
  { id: 2, propietarioId: 4, compania: 'Sura Seguros Caninos', polizaNumero: 'POL-10023', pacienteId: 2, coberturaPorcentaje: 70.00, cubreCirugias: true, cubreMedicamentos: false, medicamentosCobertura: undefined, cirugiasCobertura: 'Esterilización (macho)' }
];
export const notasCreditoDB: NotasCredito[] = [];
export const descuentosDB: DescuentosAplicados[] = [];
export const bitacoraDB: BitacoraTransacciones[] = [
  { id: 1, cajaDiariaId: 1, descripcion: 'Apertura de caja diaria con saldo base de $150,000', monto: 150000.00, tipoTransaccion: 'ingreso', fechaRegistro: new Date('2026-06-29T08:00:05Z'), operadorId: 1, operadorRol: 'administrador' },
  { id: 2, cajaDiariaId: 1, descripcion: '[AUDITORÍA] Comprobante #1 (boleta) emitido por veterinario (ID 2) — $35,000', monto: 35000.00, tipoTransaccion: 'ingreso', fechaRegistro: new Date('2026-06-29T11:15:20Z'), operadorId: 2, operadorRol: 'veterinario' },
  { id: 3, cajaDiariaId: 1, descripcion: 'Comprobante #2 (factura) emitido por administrador (ID 1) — $120,000', monto: 120000.00, tipoTransaccion: 'ingreso', fechaRegistro: new Date('2026-06-29T14:30:45Z'), operadorId: 1, operadorRol: 'administrador' },
  { id: 4, cajaDiariaId: 1, descripcion: '[ABONO PARCIAL] Comprobante #3 (boleta) emitido por administrador (ID 1). Abonado: $30,000 (Saldo pendiente: $50,000 con plazo de 30 días)', monto: 30000.00, tipoTransaccion: 'ingreso', fechaRegistro: new Date('2026-06-29T16:30:50Z'), operadorId: 1, operadorRol: 'administrador' },
  { id: 5, cajaDiariaId: 1, descripcion: 'Retiro de efectivo de caja para pago menor de papelería', monto: 15000.00, tipoTransaccion: 'egreso', fechaRegistro: new Date('2026-06-29T17:00:00Z'), operadorId: 1, operadorRol: 'administrador' },
  { id: 6, cajaDiariaId: 1, descripcion: 'Ajuste por arqueo. Diferencia detectada: -5,000 (Faltante sin justificación)', monto: 5000.00, tipoTransaccion: 'ajuste', fechaRegistro: new Date('2026-06-29T18:30:00Z'), operadorId: 1, operadorRol: 'administrador' }
];

// Nuevos almacenes para mejoras de L5
export const tarifasDB: ServiciosTarifas[] = [
  { id: 1, nombre: 'Consulta General', categoria: 'Consultas', tipo: 'clinica', tarifaBase: 12000, tarifaMax: null, notas: 'Sin procedimientos adicionales' },
  { id: 2, nombre: 'Consulta a Domicilio', categoria: 'Consultas', tipo: 'domicilio', tarifaBase: 22000, tarifaMax: null, notas: 'Incluye desplazamiento dentro del radio' },
  { id: 3, nombre: 'Control Post-Operatorio', categoria: 'Consultas', tipo: 'clinica', tarifaBase: 10000, tarifaMax: null, notas: 'Seguimiento de cirugia previa' },
  { id: 4, nombre: 'Vacunación (por dosis)', categoria: 'Preventiva', tipo: 'clinica', tarifaBase: 8000, tarifaMax: null, notas: 'Antirabica, Polivalente, etc.' },
  { id: 5, nombre: 'Desparasitación Interna', categoria: 'Preventiva', tipo: 'clinica', tarifaBase: 6000, tarifaMax: null, notas: 'Tableta o pipeta segun peso' },
  { id: 6, nombre: 'Desparasitación Externa', categoria: 'Preventiva', tipo: 'clinica', tarifaBase: 5000, tarifaMax: null, notas: 'Antipulgas y garrapatas' },
  { id: 7, nombre: 'Limpieza Dental', categoria: 'Procedimientos', tipo: 'clinica', tarifaBase: 45000, tarifaMax: null, notas: 'Incluye anestesia general' },
  { id: 8, nombre: 'Cirugía Menor', categoria: 'Cirugia', tipo: 'clinica', tarifaBase: 85000, tarifaMax: 150000, notas: 'Heridas, biopsies, extirpaciones' },
  { id: 9, nombre: 'Cirugía Mayor', categoria: 'Cirugia', tipo: 'clinica', tarifaBase: 180000, tarifaMax: 500000, notas: 'Cotizacion segun complejidad' },
  { id: 10, nombre: 'Esterilización (hembra)', categoria: 'Cirugia', tipo: 'clinica', tarifaBase: 120000, tarifaMax: 180000, notas: 'Seguimiento post-operatorio' },
  { id: 11, nombre: 'Esterilización (macho)', categoria: 'Cirugia', tipo: 'clinica', tarifaBase: 70000, tarifaMax: 100000, notas: 'Especial para felinos y caninos machos' },
  { id: 12, nombre: 'Hospitalización (por dia)', categoria: 'Hospitalizacion', tipo: 'clinica', tarifaBase: 35000, tarifaMax: null, notas: 'Incluye supervision y alimentacion basica' },
  { id: 13, nombre: 'Hospitalización UCI', categoria: 'Hospitalizacion', tipo: 'clinica', tarifaBase: 65000, tarifaMax: null, notas: 'Cuidados intensivos' },
  { id: 14, nombre: 'Baño Básico', categoria: 'Estetica', tipo: 'clinica', tarifaBase: 12000, tarifaMax: 18000, notas: 'Segun tamano del animal' },
  { id: 15, nombre: 'Baño y Corte Completo', categoria: 'Estetica', tipo: 'clinica', tarifaBase: 20000, tarifaMax: 35000, notas: 'Segun tamano y raza' },
  { id: 16, nombre: 'Guardería (por noche)', categoria: 'Hotel', tipo: 'clinica', tarifaBase: 18000, tarifaMax: null, notas: 'Caniles individuales climatizados' },
  { id: 17, nombre: 'Guardería (por dia)', categoria: 'Hotel', tipo: 'clinica', tarifaBase: 12000, tarifaMax: null, notas: 'Supervision y alimentacion incluida' },
  { id: 18, nombre: 'Radiografía', categoria: 'Diagnostico', tipo: 'clinica', tarifaBase: 25000, tarifaMax: null, notas: 'Digital, resultado inmediato' },
  { id: 19, nombre: 'Examen de Sangre Completo', categoria: 'Diagnostico', tipo: 'clinica', tarifaBase: 18000, tarifaMax: null, notas: 'Hemograma + bioquimica basica' },
  { id: 20, nombre: 'Ecografía Abdominal', categoria: 'Diagnostico', tipo: 'clinica', tarifaBase: 35000, tarifaMax: null, notas: 'Con reporte del especialista' },
  { id: 21, nombre: 'Urgencia', categoria: 'Consultas', tipo: 'clinica', tarifaBase: 20000, tarifaMax: null, notas: 'Atención de emergencias y urgencias médicas 24/7' }
];
export const campanasDB: CampanasDescuentos[] = [
  { id: 1, motivo: 'Campaña Esterilización Invierno', porcentaje: 15.00, activo: true },
  { id: 2, motivo: 'Convenio Protectora Mascotas', porcentaje: 25.00, activo: true }
];
export const compromisosDB: CompromisosPago[] = [
  { id: 1, comprobanteId: 3, montoPendiente: 50000.00, fechaLimite: new Date('2026-07-29T18:00:00Z'), estado: 'pendiente' }
];

// --- IMPLEMENTACIÓN DE ENDPOINTS EP-21 A EP-30 ---

// EP-21: POST /api/v1/finanzas/cajas/apertura
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

// EP-22: POST /api/v1/finanzas/cajas/:id/arqueo (Lógica de Arqueo Ciego)
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

// EP-23: POST /api/v1/finanzas/cajas/:id/cierre
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

    // Registrar en bitácora
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: caja.id,
      descripcion: `Cierre de caja de la jornada. Saldo final de cierre: $${montoCierre.toLocaleString('es-CL')}`,
      monto: montoCierre,
      tipoTransaccion: 'egreso',
      fechaRegistro: new Date(),
      operadorId: req.user?.id ?? 0,
      operadorRol: req.user?.rol ?? 'desconocido'
    });

    return res.status(200).json(caja);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-24: POST /api/v1/finanzas/comprobantes
export const crearComprobante = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      propietarioId, 
      cajaDiariaId, 
      tipoDocumento, 
      folioFactura, 
      montoTotal, 
      items,
      montoAbonado,
      plazoDias,
      metodoPagoId
    } = req.body;

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

    // Auditoría: capturar quien emite (admin o vet)
    const operadorId  = req.user?.id  ?? 0;
    const operadorRol = req.user?.rol ?? 'desconocido';

    // Determinar si es un abono parcial
    const abonadoVal = montoAbonado !== undefined ? Number(montoAbonado) : null;
    const esPagoParcial = abonadoVal !== null && abonadoVal > 0 && abonadoVal < montoTotal;

    const nuevo: ComprobantesFiscales = {
      id: comprobantesDB.length + 1,
      propietarioId,
      cajaDiariaId,
      tipoDocumento,
      folioFactura: folioFactura || null,
      montoTotal,
      estado: esPagoParcial ? 'emitida' : 'pagada',
      fechaEmision: new Date(),
      operadorId,
      operadorRol
    };
    comprobantesDB.push(nuevo);

    // Si es pago parcial:
    if (esPagoParcial) {
      // 1. Registrar pago parcial en pagosDB
      pagosDB.push({
        id: pagosDB.length + 1,
        boletaId: nuevo.id,
        metodoPagoId: metodoPagoId || 1, // efectivo por defecto
        montoPagado: abonadoVal,
        fechaPago: new Date()
      });

      // 2. Registrar el compromiso de pago
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + (plazoDias || 30));
      compromisosDB.push({
        id: compromisosDB.length + 1,
        comprobanteId: nuevo.id,
        montoPendiente: montoTotal - abonadoVal,
        fechaLimite,
        estado: 'pendiente'
      });

      // 3. Registrar en la bitácora financiera
      bitacoraDB.push({
        id: bitacoraDB.length + 1,
        cajaDiariaId,
        descripcion: `[ABONO PARCIAL] Comprobante #${nuevo.id} (${tipoDocumento}) emitido por ${operadorRol} (ID ${operadorId}). Abonado: $${abonadoVal.toLocaleString('es-CL')} (Saldo pendiente: $${(montoTotal - abonadoVal).toLocaleString('es-CL')} con plazo de ${plazoDias || 30} días)`,
        monto: abonadoVal,
        tipoTransaccion: 'ingreso',
        fechaRegistro: new Date(),
        operadorId,
        operadorRol
      });
    } else {
      // Registrar pago completo si no es parcial (para que no quede como deuda)
      if (tipoDocumento === 'boleta' || tipoDocumento === 'factura') {
        pagosDB.push({
          id: pagosDB.length + 1,
          boletaId: nuevo.id,
          metodoPagoId: metodoPagoId || 1,
          montoPagado: montoTotal,
          fechaPago: new Date()
        });
      }

      // Registrar entrada en bitácora financiera para todos los comprobantes emitidos
      bitacoraDB.push({
        id: bitacoraDB.length + 1,
        cajaDiariaId,
        descripcion: `Comprobante #${nuevo.id} (${tipoDocumento}) emitido por ${operadorRol === 'veterinario' ? '[AUDITORÍA] veterinario' : operadorRol} (ID ${operadorId}) — $${montoTotal.toLocaleString('es-CL')}`,
        monto: montoTotal,
        tipoTransaccion: 'ingreso',
        fechaRegistro: new Date(),
        operadorId,
        operadorRol
      });
    }

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

// EP-25: POST /api/v1/finanzas/pagos
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

// EP-26: POST /api/v1/finanzas/descuentos
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

// EP-27: POST /api/v1/finanzas/notas-credito
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
      fechaEmision: new Date(),
      operadorId:  req.user?.id  ?? 0,
      operadorRol: req.user?.rol ?? 'administrador'
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

// EP-28: POST /api/v1/finanzas/convenios
export const registrarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      propietarioId, 
      compania, 
      polizaNumero,
      pacienteId,
      coberturaPorcentaje,
      cubreCirugias,
      cubreMedicamentos,
      medicamentosCobertura,
      cirugiasCobertura
    } = req.body;

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
      polizaNumero,
      pacienteId: pacienteId ? Number(pacienteId) : undefined,
      coberturaPorcentaje: coberturaPorcentaje !== undefined ? Number(coberturaPorcentaje) : 0,
      cubreCirugias: !!cubreCirugias,
      cubreMedicamentos: !!cubreMedicamentos,
      medicamentosCobertura: medicamentosCobertura || '',
      cirugiasCobertura: cirugiasCobertura || ''
    };
    conveniosDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/finanzas/convenios
export const obtenerConvenios = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = conveniosDB.map(c => {
      const prop = propietariosDB.find(p => p.id === c.propietarioId);
      const pac = c.pacienteId ? pacientesDB.find(p => p.id === c.pacienteId) : null;
      return {
        ...c,
        propietarioNombre: prop ? prop.nombre : 'Desconocido',
        pacienteNombre: pac ? pac.nombre : 'General'
      };
    });
    return res.status(200).json(listado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/v1/finanzas/convenios/:id
export const eliminarConvenio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const index = conveniosDB.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Convenio no encontrado' });
    }

    const removido = conveniosDB[index];
    conveniosDB.splice(index, 1);

    // Auditoría
    const operadorId = req.user?.id || 1;
    const operadorRol = req.user?.rol || 'administrador';
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: cajasDB.find(c => c.estado === 'abierta')?.id || 1,
      descripcion: `[AUDITORÍA] Convenio de seguro de compañía "${removido.compania}" (Póliza ${removido.polizaNumero}) eliminado por ${operadorRol} (ID ${operadorId})`,
      monto: 0,
      tipoTransaccion: 'ajuste',
      fechaRegistro: new Date(),
      operadorId,
      operadorRol
    });

    return res.status(200).json({ message: 'Convenio eliminado con éxito' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-29: GET /api/v1/finanzas/cajas/historico
export const obtenerCajasHistorico = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    cajas: cajasDB,
    arqueos: arqueosDB
  });
};

// EP-30: GET /api/v1/finanzas/cajas/:id/bitacora
export const obtenerBitacoraCaja = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cajaId = parseInt(req.params.id);
    const transacciones = bitacoraDB.filter(b => b.cajaDiariaId === cajaId);
    return res.status(200).json(transacciones);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/finanzas/comprobantes
export const obtenerComprobantes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let filtered = comprobantesDB;

    // Si el rol es cliente, filtramos sólo las del cliente autenticado
    if (req.user?.rol === 'cliente') {
      const email = req.user.email.toLowerCase();
      const prop = propietariosDB.find(p => p.email.toLowerCase() === email);
      if (!prop) {
        return res.status(200).json([]);
      }
      filtered = comprobantesDB.filter(c => c.propietarioId === prop.id);
    }

    const enriched = filtered.map(c => {
      const prop = propietariosDB.find(p => p.id === c.propietarioId);
      const items = detallesComprobantesDB.filter(d => d.comprobanteId === c.id);
      return {
        ...c,
        propietarioNombre: prop ? prop.nombre : 'Desconocido',
        propietarioRut: prop ? prop.rut : '',
        propietarioEmail: prop ? prop.email : '',
        items
      };
    });

    return res.status(200).json(enriched);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/finanzas/bitacora-global
export const obtenerBitacoraGlobal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = bitacoraDB.map(b => {
      const operador = b.operadorId ? usuariosDB.find(u => u.id === b.operadorId) : null;
      return {
        id: b.id,
        cajaDiariaId: b.cajaDiariaId,
        descripcion: b.descripcion,
        monto: b.monto,
        tipoTransaccion: b.tipoTransaccion,
        fechaRegistro: b.fechaRegistro,
        operadorNombre: operador ? operador.nombre : 'Sistema / Auto',
        operadorRol: b.operadorRol || 'sistema'
      };
    });

    const ordenado = listado.sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());

    return res.status(200).json(ordenado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/clinica/tarifas
export const obtenerTarifas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json(tarifasDB);
  } catch (error: any) {
    return res.status(550).json({ error: error.message });
  }
};

// POST /api/v1/clinica/tarifas
export const crearTarifa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre, categoria, tipo, tarifaBase, tarifaMax, notas } = req.body;
    if (!nombre || !categoria || !tipo || tarifaBase === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para crear el servicio' });
    }

    if (tarifaBase < 0) {
      return res.status(400).json({ error: 'La tarifa base no puede ser negativa' });
    }

    const nueva: ServiciosTarifas = {
      id: tarifasDB.length + 1,
      nombre,
      categoria,
      tipo,
      tarifaBase,
      tarifaMax: tarifaMax || null,
      notas: notas || ''
    };
    tarifasDB.push(nueva);

    // Auditoría en bitácora de caja diaria si existe una caja abierta, o en global
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: cajasDB.find(c => c.estado === 'abierta')?.id || 1,
      descripcion: `[AUDITORÍA] Nuevo servicio clínico/estético creado: "${nombre}" con tarifa base de $${tarifaBase.toLocaleString('es-CL')}`,
      monto: tarifaBase,
      tipoTransaccion: 'ajuste',
      fechaRegistro: new Date(),
      operadorId: req.user?.id || 1,
      operadorRol: req.user?.rol || 'administrador'
    });

    return res.status(201).json(nueva);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/v1/clinica/tarifas/:id
export const actualizarTarifa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, categoria, tipo, tarifaBase, tarifaMax, notas } = req.body;

    const tarifaIndex = tarifasDB.findIndex(t => t.id === id);
    if (tarifaIndex === -1) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    if (tarifaBase !== undefined && tarifaBase < 0) {
      return res.status(400).json({ error: 'La tarifa base no puede ser negativa' });
    }

    const anterior = tarifasDB[tarifaIndex];
    const actualizada: ServiciosTarifas = {
      ...anterior,
      nombre: nombre !== undefined ? nombre : anterior.nombre,
      categoria: categoria !== undefined ? categoria : anterior.categoria,
      tipo: tipo !== undefined ? tipo : anterior.tipo,
      tarifaBase: tarifaBase !== undefined ? tarifaBase : anterior.tarifaBase,
      tarifaMax: tarifaMax !== undefined ? tarifaMax : anterior.tarifaMax,
      notas: notas !== undefined ? notas : anterior.notas
    };
    tarifasDB[tarifaIndex] = actualizada;

    // Auditoría en bitácora
    bitacoraDB.push({
      id: bitacoraDB.length + 1,
      cajaDiariaId: cajasDB.find(c => c.estado === 'abierta')?.id || 1,
      descripcion: `[AUDITORÍA] Tarifa de servicio "${actualizada.nombre}" modificada por admin de $${anterior.tarifaBase.toLocaleString('es-CL')} a $${actualizada.tarifaBase.toLocaleString('es-CL')}`,
      monto: actualizada.tarifaBase,
      tipoTransaccion: 'ajuste',
      fechaRegistro: new Date(),
      operadorId: req.user?.id || 1,
      operadorRol: req.user?.rol || 'administrador'
    });

    return res.status(200).json(actualizada);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/finanzas/campanas
export const obtenerCampanas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json(campanasDB);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/v1/finanzas/campanas
export const crearCampana = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { motivo, porcentaje, tipoDescuento, serviciosIds, medicamentosIds } = req.body;
    if (!motivo || porcentaje === undefined) {
      return res.status(400).json({ error: 'Motivo y porcentaje de descuento requeridos' });
    }

    // CH-68 & CH-69: Porcentaje max 50%
    if (porcentaje < 0 || porcentaje > 50) {
      return res.status(400).json({ error: 'Validación CH-68/69: El descuento no puede ser menor al 0% ni superar el 50%' });
    }

    const nueva: CampanasDescuentos = {
      id: campanasDB.length + 1,
      motivo,
      porcentaje,
      activo: true,
      tipoDescuento: tipoDescuento || 'general',
      serviciosIds: serviciosIds || '',
      medicamentosIds: medicamentosIds || ''
    };
    campanasDB.push(nueva);

    return res.status(201).json(nueva);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

