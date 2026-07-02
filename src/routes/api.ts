import { Router } from 'express';
import { authenticateToken, authorizeRoles, handleLogin, handleSignupCliente, handleCreateVeterinario } from '../middleware/auth';

import {
  crearPropietario,
  crearPaciente,
  crearTriaje,
  obtenerHistorialPaciente,
  crearConsulta,
  crearCirugia,
  listarCirugias,
  eliminarCirugia,
  ingresarHospitalizacion,
  registrarSignosVitales,
  listarVeterinarios,
  obtenerSalasDisponibles,
  obtenerPerfilPropietario,
  crearCita,
  listarCitas,
  obtenerDisponibilidad,
  confirmarCita,
  cancelarCita,
  listarPropietarios,
  listarPacientes,
  listarHospitalizaciones,
  cambiarSalaHospitalizacion,
  darAltaHospitalizacion,
  crearConsentimiento,
  obtenerConsentimientos
} from '../controllers/clinica.controller';
import {
  crearMedicamento,
  crearProveedor,
  registrarCompra,
  crearLote,
  obtenerStockMedicamentos,
  obtenerLotesFEFO,
  registrarMovimiento,
  obtenerMovimientos,
  crearReceta,
  registrarDespacho,
  obtenerAlertasStock,
  registrarAuditoria,
  actualizarMedicamento,
  eliminarMedicamento,
  actualizarLote,
  eliminarLote,
  obtenerRecetas,
  obtenerRecetaPorId
} from '../controllers/inventario.controller';
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
  obtenerBitacoraCaja,
  obtenerBitacoraGlobal,
  obtenerComprobantes,
  obtenerTarifas,
  crearTarifa,
  actualizarTarifa,
  obtenerCampanas,
  crearCampana,
  obtenerConvenios,
  eliminarConvenio
} from '../controllers/finanzas.controller';
import {
  obtenerCanilesDisponibles,
  crearReservaGuarderia,
  registrarInspeccionSalud,
  registrarPertenencia,
  registrarActividadGuarderia,
  listarActividadesGuarderia,
  registrarTurnoCuidador,
  obtenerTurnosCuidadores,
  registrarDieta,
  crearServicioEstetica,
  agendarTurnoEstetica,
  registrarTarifaTemporada,
  listarCaniles,
  listarReservasGuarderia
} from '../controllers/servicios.controller';

export const apiRouter = Router();

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
apiRouter.post('/auth/login', handleLogin);
apiRouter.post('/auth/signup-cliente', handleSignupCliente);
apiRouter.post(
  '/auth/create-veterinario',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  handleCreateVeterinario as any
);

// ==========================================
// RUTAS MÓDULO CLÍNICO (HCC) (EP-01 a EP-10)
// ==========================================

// EP-01: Registrar Propietario (Admin o Recepción)
apiRouter.post(
  '/clinica/propietarios',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearPropietario as any
);

// EP-01b: Obtener Perfil del Propietario Logueado (Cualquier rol autenticado)
apiRouter.get(
  '/clinica/propietario/perfil',
  authenticateToken as any,
  obtenerPerfilPropietario as any
);

// Listar todos los propietarios (Admin o Veterinario)
apiRouter.get(
  '/clinica/propietarios',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  listarPropietarios as any
);

// Listar todos los pacientes (Admin o Veterinario)
apiRouter.get(
  '/clinica/pacientes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  listarPacientes as any
);

// EP-02: Registrar Paciente (Veterinario o Recepción)
apiRouter.post(
  '/clinica/pacientes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  crearPaciente as any
);

// EP-03: Ingesta de Triajes (Veterinario EXCLUSIVO)
apiRouter.post(
  '/clinica/triajes',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  crearTriaje as any
);

// EP-04: Obtener Historial Clínico (Veterinario — admin NO tiene acceso a HCE)
apiRouter.get(
  '/clinica/pacientes/:id/historial',
  authenticateToken as any,
  authorizeRoles(['veterinario', 'cliente']) as any,
  obtenerHistorialPaciente as any
);

// EP-05: Registrar Consulta (Veterinario EXCLUSIVO)
apiRouter.post(
  '/clinica/consultas',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  crearConsulta as any
);

// EP-06: Programación de Cirugía (Veterinario EXCLUSIVO)
apiRouter.post(
  '/clinica/cirugias',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  crearCirugia as any
);

apiRouter.get(
  '/clinica/cirugias',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  listarCirugias as any
);

apiRouter.delete(
  '/clinica/cirugias/:id',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  eliminarCirugia as any
);

// EP-07: Registrar Hospitalización (Veterinario EXCLUSIVO)
apiRouter.post(
  '/clinica/hospitalizaciones',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  ingresarHospitalizacion as any
);

// Listar Hospitalizaciones (Aforo)
apiRouter.get(
  '/clinica/hospitalizaciones',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  listarHospitalizaciones as any
);

// Listar Pacientes (Autenticado)
apiRouter.get(
  '/clinica/pacientes',
  authenticateToken as any,
  listarPacientes as any
);

// EP-08: Ingesta de Signos Vitales (Veterinario EXCLUSIVO)
apiRouter.post(
  '/clinica/hospitalizaciones/:id/signos',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  registrarSignosVitales as any
);

// PUT /clinica/hospitalizaciones/:id/sala — Trasladar (Veterinario EXCLUSIVO)
apiRouter.put(
  '/clinica/hospitalizaciones/:id/sala',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  cambiarSalaHospitalizacion as any
);

// PUT /clinica/hospitalizaciones/:id/alta — Alta/Fallecimiento (Veterinario EXCLUSIVO)
apiRouter.put(
  '/clinica/hospitalizaciones/:id/alta',
  authenticateToken as any,
  authorizeRoles(['veterinario']) as any,
  darAltaHospitalizacion as any
);

// EP-09: Obtener listado de Veterinarios (Autenticado)
apiRouter.get(
  '/clinica/veterinarios',
  authenticateToken as any,
  listarVeterinarios as any
);

// EP-10: Obtener Quirófanos Disponibles (Autenticado)
apiRouter.get(
  '/clinica/cirugias/salas-disponibles',
  authenticateToken as any,
  obtenerSalasDisponibles as any
);

// Consentimientos Informados (POST/GET)
apiRouter.post(
  '/clinica/consentimientos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearConsentimiento as any
);

apiRouter.get(
  '/clinica/consentimientos',
  authenticateToken as any,
  obtenerConsentimientos as any
);

// ==========================================
// RUTAS INVENTARIO Y LOGÍSTICA (ILM) (EP-11 a EP-20)
// ==========================================

// EP-11: Crear Medicamento (Admin)
apiRouter.post(
  '/inventario/medicamentos',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearMedicamento as any
);

apiRouter.put(
  '/inventario/medicamentos/:id',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  actualizarMedicamento as any
);

apiRouter.delete(
  '/inventario/medicamentos/:id',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  eliminarMedicamento as any
);

// EP-12: Registrar Proveedor (Admin)
apiRouter.post(
  '/inventario/proveedores',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearProveedor as any
);

// EP-13: Recepción de Compra (Admin o Farmacéutico)
apiRouter.post(
  '/inventario/compras',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarCompra as any
);

// EP-14: Crear Lote (Admin o Farmacéutico)
apiRouter.post(
  '/inventario/lotes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearLote as any
);

apiRouter.put(
  '/inventario/lotes/:id',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  actualizarLote as any
);

apiRouter.delete(
  '/inventario/lotes/:id',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  eliminarLote as any
);

// EP-15b: Consultar Lotes FEFO de un medicamento (ordenados por vencimiento próximo)
apiRouter.get(
  '/inventario/medicamentos/:id/lotes-fefo',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  obtenerLotesFEFO as any
);

// EP-15: Consultar Stock Disponible (Autenticado)
apiRouter.get(
  '/inventario/medicamentos/stock',
  authenticateToken as any,
  obtenerStockMedicamentos as any
);

// EP-16: Obtener Historial de Movimientos de Inventario (Bitácora - Admin)
apiRouter.get(
  '/inventario/movimientos',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  obtenerMovimientos as any
);

// EP-16b: Registrar Movimiento Inventario (Farmacéutico)
apiRouter.post(
  '/inventario/movimientos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarMovimiento as any
);

// EP-17: Registrar Receta Retenida (Veterinario)
apiRouter.post(
  '/inventario/recetas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearReceta as any
);

apiRouter.get(
  '/inventario/recetas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  obtenerRecetas as any
);

apiRouter.get(
  '/inventario/recetas/:id',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  obtenerRecetaPorId as any
);

// EP-18: Registrar Despacho por Receta (Farmacéutico)
apiRouter.post(
  '/inventario/despachos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarDespacho as any
);

// EP-19: Consultar Alertas de Stock (Farmacéutico)
apiRouter.get(
  '/inventario/alertas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  obtenerAlertasStock as any
);

// EP-20: Concluir Auditoría de Inventario (Farmacéutico)
apiRouter.post(
  '/inventario/auditorias',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarAuditoria as any
);

// ==========================================
// RUTAS FACTURACIÓN Y PAGOS (FAP) (EP-21 a EP-30)
// ==========================================

// EP-21: Apertura de Caja (Cajero)
apiRouter.post(
  '/finanzas/cajas/apertura',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  abrirCaja as any
);

// EP-22: Arqueo de Caja Ciego (Cajero)
apiRouter.post(
  '/finanzas/cajas/:id/arqueo',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarArqueo as any
);

// EP-23: Cierre de Caja (Cajero)
apiRouter.post(
  '/finanzas/cajas/:id/cierre',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  cerrarCaja as any
);

// EP-24: Emitir Comprobante Fiscal (Cajero)
apiRouter.post(
  '/finanzas/comprobantes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearComprobante as any
);

// GET /finanzas/comprobantes (Consultar comprobantes)
apiRouter.get(
  '/finanzas/comprobantes',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  obtenerComprobantes as any
);

// EP-25: Registrar Pago (Cajero)
apiRouter.post(
  '/finanzas/pagos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarPago as any
);

// EP-26: Aplicar Descuento (Admin o Cajero)
apiRouter.post(
  '/finanzas/descuentos',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  aplicarDescuento as any
);

// EP-27: Emitir Nota de Crédito / Anular Venta (Admin o Cajero)
apiRouter.post(
  '/finanzas/notas-credito',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  emitirNotaCredito as any
);

// EP-28: Registrar Convenio Seguro Mascota (Cajero)
apiRouter.post(
  '/finanzas/convenios',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarConvenio as any
);

// EP-29: Obtener Histórico de Arqueos y Cierres (Admin)
apiRouter.get(
  '/finanzas/cajas/historico',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  obtenerCajasHistorico as any
);

// EP-30: Consultar Bitácora de Transacciones (Admin o Cajero)
apiRouter.get(
  '/finanzas/cajas/:id/bitacora',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  obtenerBitacoraCaja as any
);

// GET /finanzas/bitacora-global (Admin)
apiRouter.get(
  '/finanzas/bitacora-global',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  obtenerBitacoraGlobal as any
);

// --- TARIFAS DE SERVICIOS CLINICOS/ESTETICOS ---
apiRouter.get(
  '/clinica/tarifas',
  authenticateToken as any,
  obtenerTarifas as any
);

apiRouter.post(
  '/clinica/tarifas',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearTarifa as any
);

apiRouter.put(
  '/clinica/tarifas/:id',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  actualizarTarifa as any
);

// --- CAMPAÑAS DE DESCUENTOS ---
apiRouter.get(
  '/finanzas/campanas',
  authenticateToken as any,
  obtenerCampanas as any
);

apiRouter.post(
  '/finanzas/campanas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearCampana as any
);

// --- CONVENIOS DE SEGUROS ---
apiRouter.get(
  '/finanzas/convenios',
  authenticateToken as any,
  obtenerConvenios as any
);

apiRouter.delete(
  '/finanzas/convenios/:id',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  eliminarConvenio as any
);

// ==========================================
// RUTAS GUARDERÍA Y PELUQUERÍA (GAP) (EP-31 a EP-40)
// ==========================================

// EP-31: Consultar Caniles Disponibles (Autenticado)
apiRouter.get(
  '/servicios/caniles/disponibles',
  authenticateToken as any,
  obtenerCanilesDisponibles as any
);

// Listar todos los caniles (Aforo)
apiRouter.get(
  '/servicios/caniles',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  listarCaniles as any
);

// EP-32: Registrar Reserva de Guardería (Admin o Recepción)
apiRouter.post(
  '/servicios/reservas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  crearReservaGuarderia as any
);

// Listar todas las reservas de guardería (Aforo)
apiRouter.get(
  '/servicios/reservas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  listarReservasGuarderia as any
);

// EP-33: Registrar Inspección de Salud al Ingreso (Recepcionista o Veterinario)
apiRouter.post(
  '/servicios/inspecciones',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarInspeccionSalud as any
);

// EP-34: Registrar Pertenencias de Mascota (Recepcionista)
apiRouter.post(
  '/servicios/pertenencias',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarPertenencia as any
);

// EP-35: Registrar Actividades en Hotel (Cuidador o Veterinario)
apiRouter.post(
  '/servicios/actividades',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarActividadGuarderia as any
);

apiRouter.get(
  '/servicios/actividades',
  authenticateToken as any,
  listarActividadesGuarderia as any
);

// EP-36: Registrar Turno de Cuidador (Admin)
apiRouter.post(
  '/servicios/turnos-cuidadores',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  registrarTurnoCuidador as any
);

apiRouter.get(
  '/servicios/turnos-cuidadores',
  authenticateToken as any,
  obtenerTurnosCuidadores as any
);

// EP-37: Registrar Dieta Especial de Paciente (Veterinario o Recepción)
apiRouter.post(
  '/servicios/dietas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  registrarDieta as any
);

// EP-38: Registrar Servicio Estético en Catálogo (Admin)
apiRouter.post(
  '/servicios/estetica/servicios',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  crearServicioEstetica as any
);

// EP-39: Agendar Turno Estética/Peluquería (Recepcionista)
apiRouter.post(
  '/servicios/estetica/agendar',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  agendarTurnoEstetica as any
);

// EP-40: Registrar Tarifas de Temporada (Admin)
apiRouter.post(
  '/servicios/estetica/tarifas',
  authenticateToken as any,
  authorizeRoles(['administrador']) as any,
  registrarTarifaTemporada as any
);

// ==========================================
// RUTAS MÓDULO CITAS (EP-C1 a EP-C5)
// ==========================================

// EP-C1: Crear Cita (Cliente, Vet, Admin)
apiRouter.post(
  '/citas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  crearCita as any
);

// EP-C2: Listar Citas (filtrado por rol)
apiRouter.get(
  '/citas',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  listarCitas as any
);

// EP-C3: Disponibilidad de Bloques (todos los roles)
apiRouter.get(
  '/citas/disponibilidad',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  obtenerDisponibilidad as any
);

// EP-C4: Confirmar Cita y Asignar Veterinario (Vet, Admin)
apiRouter.put(
  '/citas/:id/confirmar',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario']) as any,
  confirmarCita as any
);

// EP-C5: Cancelar Cita (todos, con validación de propietario para clientes)
apiRouter.put(
  '/citas/:id/cancelar',
  authenticateToken as any,
  authorizeRoles(['administrador', 'veterinario', 'cliente']) as any,
  cancelarCita as any
);
