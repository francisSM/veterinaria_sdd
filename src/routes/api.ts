import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../app';
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
