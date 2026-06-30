import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

import {
  crearPropietario,
  crearPaciente,
  crearTriaje,
  obtenerHistorialPaciente,
  crearConsulta,
  crearCirugia,
  ingresarHospitalizacion,
  registrarSignosVitales,
  listarVeterinarios,
  obtenerSalasDisponibles
} from '../controllers/hcc.controller';
import {
  crearMedicamento,
  crearProveedor,
  registrarCompra,
  crearLote,
  obtenerStockMedicamentos,
  registrarMovimiento,
  crearReceta,
  registrarDespacho,
  obtenerAlertasStock,
  registrarAuditoria
} from '../controllers/ilm.controller';
import {
  abrirCaja,
  registrarArqueo,
  cerrarCaja,
  crearComprobante,
  registrarPago,
  aplicarDescuento,
  emitirNotaCredito,
  registrarConvenio,
  obtenerCajasHistorico,
  obtenerBitacoraCaja
} from '../controllers/fap.controller';
import {
  obtenerCanilesDisponibles,
  crearReservaGuarderia,
  registrarInspeccionSalud,
  registrarPertenencia,
  registrarActividadGuarderia,
  registrarTurnoCuidador,
  registrarDieta,
  crearServicioEstetica,
  agendarTurnoEstetica,
  registrarTarifaTemporada
} from '../controllers/gap.controller';

export const apiRouter = Router();

// ==========================================
// RUTAS MÓDULO CLÍNICO (HCC) (EP-01 a EP-10)
// ==========================================

// EP-01: Registrar Propietario (Admin o Recepción)
apiRouter.post(
  '/hcc/propietarios',
  authenticateToken as any,
  authorizeRoles(['administrador', 'recepcionista']) as any,
  crearPropietario as any
);

// EP-02: Registrar Paciente (Veterinario o Recepción)
apiRouter.post(
  '/hcc/pacientes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'recepcionista']) as any,
  crearPaciente as any
);

// EP-03: Ingesta de Triajes (Veterinario)
apiRouter.post(
  '/hcc/triajes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearTriaje as any
);

// EP-04: Obtener Historial Clínico de Mascota (Veterinario)
apiRouter.get(
  '/hcc/pacientes/:id/historial',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  obtenerHistorialPaciente as any
);

// EP-05: Registrar Consulta (Veterinario)
apiRouter.post(
  '/hcc/consultas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearConsulta as any
);

// EP-06: Programación de Cirugía (Cirujano)
apiRouter.post(
  '/hcc/cirugias',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cirujano']) as any,
  crearCirugia as any
);

// EP-07: Registrar Hospitalización (Veterinario)
apiRouter.post(
  '/hcc/hospitalizaciones',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  ingresarHospitalizacion as any
);

// EP-08: Ingesta de Signos Vitales (Veterinario o Técnico)
apiRouter.post(
  '/hcc/hospitalizaciones/:id/signos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any, // 'tecnico' se agrupa en veterinario en este mock
  registrarSignosVitales as any
);

// EP-09: Obtener listado de Veterinarios (Autenticado)
apiRouter.get(
  '/hcc/veterinarios',
  authenticateToken as any,
  listarVeterinarios as any
);

// EP-10: Obtener Quirófanos Disponibles (Autenticado)
apiRouter.get(
  '/hcc/cirugias/salas-disponibles',
  authenticateToken as any,
  obtenerSalasDisponibles as any
);

// ==========================================
// RUTAS INVENTARIO Y LOGÍSTICA (ILM) (EP-11 a EP-20)
// ==========================================

// EP-11: Crear Medicamento (Admin)
apiRouter.post(
  '/ilm/medicamentos',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearMedicamento as any
);

// EP-12: Registrar Proveedor (Admin)
apiRouter.post(
  '/ilm/proveedores',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearProveedor as any
);

// EP-13: Recepción de Compra (Admin o Farmacéutico)
apiRouter.post(
  '/ilm/compras',
  authenticateToken as any,
  authorizeRoles(['administrador', 'farmaceutico']) as any,
  registrarCompra as any
);

// EP-14: Crear Lote (Admin o Farmacéutico)
apiRouter.post(
  '/ilm/lotes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'farmaceutico']) as any,
  crearLote as any
);

// EP-15: Consultar Stock Disponible (Autenticado)
apiRouter.get(
  '/ilm/medicamentos/stock',
  authenticateToken as any,
  obtenerStockMedicamentos as any
);

// EP-16: Registrar Movimiento Inventario (Farmacéutico)
apiRouter.post(
  '/ilm/movimientos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'farmaceutico']) as any,
  registrarMovimiento as any
);

// EP-17: Registrar Receta Retenida (Veterinario)
apiRouter.post(
  '/ilm/recetas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearReceta as any
);

// EP-18: Registrar Despacho por Receta (Farmacéutico)
apiRouter.post(
  '/ilm/despachos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'farmaceutico']) as any,
  registrarDespacho as any
);

// EP-19: Consultar Alertas de Stock (Farmacéutico)
apiRouter.get(
  '/ilm/alertas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'farmaceutico']) as any,
  obtenerAlertasStock as any
);

// EP-20: Concluir Auditoría de Inventario (Farmacéutico)
apiRouter.post(
  '/ilm/auditorias',
  authenticateToken as any,
  authorizeRoles(['administrador', 'farmaceutico']) as any,
  registrarAuditoria as any
);

// ==========================================
// RUTAS FACTURACIÓN Y PAGOS (FAP) (EP-21 a EP-30)
// ==========================================

// EP-21: Apertura de Caja (Cajero)
apiRouter.post(
  '/fap/cajas/apertura',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  abrirCaja as any
);

// EP-22: Arqueo de Caja Ciego (Cajero)
apiRouter.post(
  '/fap/cajas/:id/arqueo',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  registrarArqueo as any
);

// EP-23: Cierre de Caja (Cajero)
apiRouter.post(
  '/fap/cajas/:id/cierre',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  cerrarCaja as any
);

// EP-24: Emitir Comprobante Fiscal (Cajero)
apiRouter.post(
  '/fap/comprobantes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  crearComprobante as any
);

// EP-25: Registrar Pago (Cajero)
apiRouter.post(
  '/fap/pagos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  registrarPago as any
);

// EP-26: Aplicar Descuento (Admin o Cajero)
apiRouter.post(
  '/fap/descuentos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  aplicarDescuento as any
);

// EP-27: Emitir Nota de Crédito / Anular Venta (Admin o Cajero)
apiRouter.post(
  '/fap/notas-credito',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  emitirNotaCredito as any
);

// EP-28: Registrar Convenio Seguro Mascota (Cajero)
apiRouter.post(
  '/fap/convenios',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  registrarConvenio as any
);

// EP-29: Obtener Histórico de Arqueos y Cierres (Admin)
apiRouter.get(
  '/fap/cajas/historico',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  obtenerCajasHistorico as any
);

// EP-30: Consultar Bitácora de Transacciones (Admin o Cajero)
apiRouter.get(
  '/fap/cajas/:id/bitacora',
  authenticateToken as any,
  authorizeRoles(['administrador', 'cajero']) as any,
  obtenerBitacoraCaja as any
);

// ==========================================
// RUTAS GUARDERÍA Y PELUQUERÍA (GAP) (EP-31 a EP-40)
// ==========================================

// EP-31: Consultar Caniles Disponibles (Autenticado)
apiRouter.get(
  '/gap/caniles/disponibles',
  authenticateToken as any,
  obtenerCanilesDisponibles as any
);

// EP-32: Registrar Reserva de Guardería (Admin o Recepción)
apiRouter.post(
  '/gap/reservas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'recepcionista']) as any,
  crearReservaGuarderia as any
);

// EP-33: Registrar Inspección de Salud al Ingreso (Recepcionista o Veterinario)
apiRouter.post(
  '/gap/inspecciones',
  authenticateToken as any,
  authorizeRoles(['administrador', 'recepcionista', 'veterinario']) as any,
  registrarInspeccionSalud as any
);

// EP-34: Registrar Pertenencias de Mascota (Recepcionista)
apiRouter.post(
  '/gap/pertenencias',
  authenticateToken as any,
  authorizeRoles(['administrador', 'recepcionista']) as any,
  registrarPertenencia as any
);

// EP-35: Registrar Actividades en Hotel (Cuidador o Veterinario)
apiRouter.post(
  '/gap/actividades',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any, // Cuidadores se agrupan aquí en el mock
  registrarActividadGuarderia as any
);

// EP-36: Registrar Turno de Cuidador (Admin)
apiRouter.post(
  '/gap/turnos-cuidadores',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  registrarTurnoCuidador as any
);

// EP-37: Registrar Dieta Especial de Paciente (Veterinario o Recepción)
apiRouter.post(
  '/gap/dietas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'recepcionista']) as any,
  registrarDieta as any
);

// EP-38: Registrar Servicio Estético en Catálogo (Admin)
apiRouter.post(
  '/gap/estetica/servicios',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearServicioEstetica as any
);

// EP-39: Agendar Turno Estética/Peluquería (Recepcionista)
apiRouter.post(
  '/gap/estetica/agendar',
  authenticateToken as any,
  authorizeRoles(['administrador', 'recepcionista']) as any,
  agendarTurnoEstetica as any
);

// EP-40: Registrar Tarifas de Temporada (Admin)
apiRouter.post(
  '/gap/estetica/tarifas',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  registrarTarifaTemporada as any
);

