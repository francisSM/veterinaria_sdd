import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pacientesDB, propietariosDB } from './clinica.controller';
import {
  Canil,
  ReservaGuarderia,
  ServicioEstetica,
  TurnoCuidador,
  RegistroActividad,
  DietaEspecial,
  InspeccionSaludIngreso,
  ControlPertenencia,
  HistorialEstetica,
  TarifaTemporada
} from '../models/servicios';

// Almacenes temporales en memoria para GAP
export const canilesDB: Canil[] = [
  { id: 1, nombre: 'Canil-A Perros Grandes', capacidadMaxima: 4,  estado: 'libre',  tipoEspecie: 'canino' },
  { id: 2, nombre: 'Canil-B Perros Medianos', capacidadMaxima: 6, estado: 'libre',  tipoEspecie: 'canino' },
  { id: 3, nombre: 'Canil-C Gatos',           capacidadMaxima: 8, estado: 'libre',  tipoEspecie: 'felino' },
];

// Reservas de guardería pre-cargadas
export const reservasGuarderiaDB: ReservaGuarderia[] = [
  { id: 1, pacienteId: 1,  canilId: 1, fechaCheckin: new Date('2026-07-01'), fechaCheckout: new Date('2026-07-03'), costoTotal: 30000, estado: 'activa'   }, // Thor (canino) → Canil-A
  { id: 2, pacienteId: 10, canilId: 2, fechaCheckin: new Date('2026-07-01'), fechaCheckout: new Date('2026-07-02'), costoTotal: 15000, estado: 'activa'   }, // Beto (canino) → Canil-B
  { id: 3, pacienteId: 4,  canilId: 3, fechaCheckin: new Date('2026-07-01'), fechaCheckout: new Date('2026-07-04'), costoTotal: 45000, estado: 'activa'   }, // Mishi (felino) → Canil-C
  { id: 4, pacienteId: 6,  canilId: 3, fechaCheckin: new Date('2026-07-01'), fechaCheckout: new Date('2026-07-02'), costoTotal: 15000, estado: 'reservada' }, // Pelusa (felino) → Canil-C
];
export const serviciosEsteticaDB: ServicioEstetica[] = [];
export const turnosCuidadoresDB: TurnoCuidador[] = [];
export const registroActividadesDB: RegistroActividad[] = [];
export const dietasEspecialesDB: DietaEspecial[] = [];
export const inspeccionesDB: InspeccionSaludIngreso[] = [];
export const pertenenciasDB: ControlPertenencia[] = [];
export const historialEsteticaDB: HistorialEstetica[] = [];
export const tarifasTemporadaDB: TarifaTemporada[] = [];

// Listar todos los caniles
export const listarCaniles = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(canilesDB);
};

// Listar todas las reservas de guardería
export const listarReservasGuarderia = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(reservasGuarderiaDB);
};

// EP-31: GET /api/v1/servicios/caniles/disponibles
export const obtenerCanilesDisponibles = async (req: AuthenticatedRequest, res: Response) => {
  const disponibles = canilesDB.filter(c => c.estado === 'libre');
  return res.status(200).json(disponibles);
};

// EP-32: POST /api/v1/servicios/reservas
export const crearReservaGuarderia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, canilId, fechaCheckin, fechaCheckout, costoTotal } = req.body;

    if (!pacienteId || !canilId || !fechaCheckin || !fechaCheckout || costoTotal === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios de la reserva' });
    }

    const checkin = new Date(fechaCheckin);
    const checkout = new Date(fechaCheckout);

    // CH-80: Checkout posterior a Checkin
    if (checkout < checkin) {
      return res.status(400).json({
        error: 'Validacion CH-80 Fallida: La fecha de checkout debe ser posterior a la fecha de checkin'
      });
    }

    // CH-82: Costo positivo
    if (costoTotal < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-82 Fallida: El costo total no puede ser negativo' });
    }

    const canil = canilesDB.find(c => c.id === canilId);
    if (!canil) {
      return res.status(404).json({ error: 'Canil no encontrado' });
    }

    if (canil.estado === 'mantenimiento') {
      return res.status(400).json({ error: 'El canil seleccionado se encuentra en mantenimiento' });
    }

    // Validar aforo / capacidad actual de reservas simultáneas activas
    const activas = reservasGuarderiaDB.filter(r => r.canilId === canilId && r.estado === 'activa');
    if (activas.length >= canil.capacidadMaxima) {
      canil.estado = 'llena';
      return res.status(400).json({ error: 'El canil ya se encuentra a su maxima capacidad' });
    }

    const nuevo: ReservaGuarderia = {
      id: reservasGuarderiaDB.length + 1,
      pacienteId,
      canilId,
      fechaCheckin: checkin,
      fechaCheckout: checkout,
      costoTotal,
      estado: 'reservada'
    };
    reservasGuarderiaDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-33: POST /api/v1/servicios/inspecciones
export const registrarInspeccionSalud = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservaId, temperaturaIngreso, pesoIngreso, estadoGeneral, observaciones } = req.body;

    if (!reservaId || temperaturaIngreso === undefined || pesoIngreso === undefined || !estadoGeneral) {
      return res.status(400).json({ error: 'Faltan campos de inspeccion de ingreso' });
    }

    // CH-83 & CH-84: Temperatura ingreso
    if (temperaturaIngreso < 35.0 || temperaturaIngreso > 42.0) {
      return res.status(400).json({
        error: 'Validacion CH-83/84 Fallida: Temperatura veterinaria fuera de limites normales (35C - 42C)'
      });
    }

    // CH-85 & CH-86: Peso
    if (pesoIngreso <= 0.0 || pesoIngreso > 150.0) {
      return res.status(400).json({
        error: 'Validacion CH-85/86 Fallida: Peso fuera de rango permitido (0.0 - 150.0 kg)'
      });
    }

    // CH-87: Estado general
    if (!['bueno', 'regular', 'critico'].includes(estadoGeneral)) {
      return res.status(400).json({ error: 'Validacion CH-87 Fallida: Estado general de ingreso invalido' });
    }

    const reser = reservasGuarderiaDB.find(r => r.id === reservaId);
    if (!reser) {
      return res.status(404).json({ error: 'Reserva de guarderia no encontrada' });
    }

    const nuevo: InspeccionSaludIngreso = {
      id: inspeccionesDB.length + 1,
      reservaId,
      temperaturaIngreso,
      pesoIngreso,
      estadoGeneral,
      observaciones: observaciones || null
    };
    inspeccionesDB.push(nuevo);

    // Cambiar estado de reserva a activa (ingreso completado)
    reser.estado = 'activa';

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-34: POST /api/v1/servicios/pertenencias
export const registrarPertenencia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservaId, itemNombre, cantidad, estadoRecibido } = req.body;

    if (!reservaId || !itemNombre || cantidad === undefined || !estadoRecibido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // CH-92: Cantidad positiva
    if (cantidad <= 0) {
      return res.status(400).json({ error: 'Validacion CH-92 Fallida: La cantidad debe ser mayor a 0' });
    }

    // CH-93: Estado recibido
    if (!['bueno', 'dañado', 'sucio'].includes(estadoRecibido)) {
      return res.status(400).json({ error: 'Validacion CH-93 Fallida: Estado de pertenencia no valido' });
    }

    const nuevo: ControlPertenencia = {
      id: pertenenciasDB.length + 1,
      reservaId,
      itemNombre,
      cantidad,
      estadoRecibido
    };
    pertenenciasDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-35: POST /api/v1/servicios/actividades
export const registrarActividadGuarderia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservaId, tipoActividad, comentario, medicamentoInsumoId } = req.body;

    if (!reservaId || !tipoActividad) {
      return res.status(400).json({ error: 'Faltan campos de la actividad' });
    }

    // CH-88: Tipo actividad
    if (!['alimentacion', 'recreacion', 'medicacion', 'descanso'].includes(tipoActividad)) {
      return res.status(400).json({ error: 'Validacion CH-88 Fallida: Tipo de actividad en hotel invalido' });
    }

    const nuevo: RegistroActividad = {
      id: registroActividadesDB.length + 1,
      reservaId,
      tipoActividad,
      horaRegistro: new Date(),
      comentario: comentario || null,
      medicamentoInsumoId: medicamentoInsumoId || null
    };
    registroActividadesDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-36: POST /api/v1/servicios/turnos-cuidadores
export const registrarTurnoCuidador = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cuidadorNombre, rut, fechaTurno, turnoTipo } = req.body;

    if (!cuidadorNombre || !rut || !fechaTurno || !turnoTipo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios del turno' });
    }

    // CH-100: Tipo de turno
    if (!['mañana', 'tarde', 'noche'].includes(turnoTipo)) {
      return res.status(400).json({ error: 'Validacion CH-100 Fallida: Turno de cuidador fuera de limites' });
    }

    const nuevo: TurnoCuidador = {
      id: turnosCuidadoresDB.length + 1,
      cuidadorNombre,
      rut,
      fechaTurno: new Date(fechaTurno),
      turnoTipo
    };
    turnosCuidadoresDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-37: POST /api/v1/servicios/dietas
export const registrarDieta = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, tipoAlimento, porcionGramos, observaciones } = req.body;

    if (!pacienteId || !tipoAlimento || porcionGramos === undefined) {
      return res.status(400).json({ error: 'Faltan campos de dieta especial' });
    }

    // CH-90: Porción positiva
    if (porcionGramos <= 0) {
      return res.status(400).json({ error: 'Validacion CH-90 Fallida: La porcion en gramos debe ser mayor a 0' });
    }

    // CH-91: Tipo de alimento
    if (!['seco', 'humedo', 'barf', 'prescrito'].includes(tipoAlimento)) {
      return res.status(400).json({ error: 'Validacion CH-91 Fallida: Tipo de alimento invalido' });
    }

    const nuevo: DietaEspecial = {
      id: dietasEspecialesDB.length + 1,
      pacienteId,
      tipoAlimento,
      porcionGramos,
      observaciones: observaciones || null
    };
    dietasEspecialesDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-38: POST /api/v1/servicios/estetica/servicios
export const crearServicioEstetica = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombreServicio, duracionEstimadaMinutos } = req.body;

    if (!nombreServicio || duracionEstimadaMinutos === undefined) {
      return res.status(400).json({ error: 'Faltan campos del servicio' });
    }

    // CH-94 & CH-95: Duración entre 15 y 180 min
    if (duracionEstimadaMinutos < 15 || duracionEstimadaMinutos > 180) {
      return res.status(400).json({
        error: 'Validacion CH-94/95 Fallida: La duracion estimada debe estar entre 15 y 180 minutos'
      });
    }

    const nuevo: ServicioEstetica = {
      id: serviciosEsteticaDB.length + 1,
      nombreServicio,
      duracionEstimadaMinutos
    };
    serviciosEsteticaDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-39: POST /api/v1/servicios/estetica/agendar
export const agendarTurnoEstetica = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, servicioId, estilistaNombre, costoEfectivo, observaciones } = req.body;

    if (!pacienteId || !servicioId || !estilistaNombre || costoEfectivo === undefined) {
      return res.status(400).json({ error: 'Faltan campos para agendar estética' });
    }

    // CH-96: Costo positivo
    if (costoEfectivo < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-96 Fallida: El costo efectivo no puede ser negativo' });
    }

    // CH-97: Estilista longitud nombre
    if (estilistaNombre.trim().length < 3) {
      return res.status(400).json({
        error: 'Validacion CH-97 Fallida: El nombre del estilista debe poseer al menos 3 caracteres'
      });
    }

    const nuevo: HistorialEstetica = {
      id: historialEsteticaDB.length + 1,
      pacienteId,
      servicioId,
      fechaServicio: new Date(),
      estilistaNombre,
      costoEfectivo,
      observaciones: observaciones || null
    };
    historialEsteticaDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-40: POST /api/v1/servicios/estetica/tarifas
export const registrarTarifaTemporada = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { servicioId, tipoTemporada, monto } = req.body;

    if (!servicioId || !tipoTemporada || monto === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios de la tarifa' });
    }

    // CH-98: Tipo temporada
    if (!['base', 'festivo', 'alta_demanda'].includes(tipoTemporada)) {
      return res.status(400).json({ error: 'Validacion CH-98 Fallida: Tipo de temporada no valido' });
    }

    // CH-99: Monto positivo
    if (monto < 0.0) {
      return res.status(400).json({ error: 'Validacion CH-99 Fallida: El monto de la tarifa no puede ser negativo' });
    }

    const nuevo: TarifaTemporada = {
      id: tarifasTemporadaDB.length + 1,
      servicioId,
      tipoTemporada,
      monto
    };
    tarifasTemporadaDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/servicios/turnos-cuidadores
export const obtenerTurnosCuidadores = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json(turnosCuidadoresDB);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/servicios/actividades
export const listarActividadesGuarderia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = registroActividadesDB.map(act => {
      const resv = reservasGuarderiaDB.find(r => r.id === act.reservaId);
      const pac = resv ? pacientesDB.find(p => p.id === resv.pacienteId) : null;
      return {
        ...act,
        pacienteId: resv ? resv.pacienteId : null,
        pacienteNombre: pac ? pac.nombre : 'Desconocido',
        canilId: resv ? resv.canilId : null
      };
    });
    return res.status(200).json(listado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
