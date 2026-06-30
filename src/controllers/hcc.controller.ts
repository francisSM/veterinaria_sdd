import { Response } from 'express';
import { AuthenticatedRequest } from '../app';
import {
  Propietario,
  Paciente,
  Triaje,
  Historial,
  Consulta,
  Cirugia,
  Hospitalizacion,
  SignosVitales,
  Veterinario
} from '../models/hcc';

// Almacén transitorio en memoria para simular la persistencia y validaciones CHECK
export const propietariosDB: Propietario[] = [];
export const pacientesDB: Paciente[] = [];
export const triajesDB: Triaje[] = [];
export const historialesDB: Historial[] = [];
export const consultasDB: Consulta[] = [];
export const cirugiasDB: Cirugia[] = [];
export const hospitalizacionesDB: Hospitalizacion[] = [];
export const signosVitalesDB: SignosVitales[] = [];

// Veterinarios cargados por defecto (Veterinarios de turno)
export const veterinariosDB: Veterinario[] = [
  { id: 1, nombre: 'Dr. John Doe', rut: '12345678-9', licenciaMedica: 'VET-9901' },
  { id: 2, nombre: 'Dra. Jane Smith', rut: '98765432-1', licenciaMedica: 'VET-8832' }
];

// Almacén temporal de reservas de quirófanos para bloqueo pesimista (enlazado a consultas/cirugías)
interface ReservaSalaQuirofano {
  salaId: number;
  bloqueHorario: string; // Formato YYYY-MM-DD HH:MM
  reservadoHasta: Date;
}
export const reservasQuirofanoDB: ReservaSalaQuirofano[] = [];

// --- IMPLEMENTACIÓN DE ENDPOINTS EP-01 A EP-10 ---

// EP-01: POST /api/v1/hcc/propietarios
export const crearPropietario = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre, rut, email, telefono } = req.body;

    if (!nombre || !rut || !email || !telefono) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar propietario' });
    }

    // CH-04 & CH-05: Validar formato email
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Validacion CH-04/05 Fallida: Formato de correo electronico invalido' });
    }

    // CH-06 & CH-07: Validar telefono
    if (telefono.length < 8 || !/^[0-9]+$/.test(telefono)) {
      return res.status(400).json({ error: 'Validacion CH-06/07 Fallida: El telefono debe tener al menos 8 digitos numericos' });
    }

    const existeRut = propietariosDB.some(p => p.rut === rut);
    if (existeRut) {
      return res.status(400).json({ error: 'El RUT del propietario ya esta registrado' });
    }

    const nuevo: Propietario = {
      id: propietariosDB.length + 1,
      nombre,
      rut,
      email,
      telefono
    };
    propietariosDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-02: POST /api/v1/hcc/pacientes
export const crearPaciente = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre, especie, raza, edadMeses, pesoKg, propietarioId } = req.body;

    if (!nombre || !especie || !raza || edadMeses === undefined || pesoKg === undefined || !propietarioId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios del paciente' });
    }

    // Validar propietario existente
    const propietario = propietariosDB.find(p => p.id === propietarioId);
    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado en el sistema' });
    }

    // Validar especie
    if (!['canino', 'felino', 'exotico', 'equino'].includes(especie)) {
      return res.status(400).json({ error: 'Especie no permitida en la clinica' });
    }

    // CH-01: Validar edad
    if (edadMeses < 0) {
      return res.status(400).json({ error: 'Validacion CH-01 Fallida: La edad del paciente no puede ser negativa' });
    }

    // CH-02 & CH-03: Validar peso
    if (pesoKg <= 0.0 || pesoKg > 150.0) {
      return res.status(400).json({ error: 'Validacion CH-02/03 Fallida: El peso del paciente debe estar entre 0.0 y 150.0 kg' });
    }

    const nuevo: Paciente = {
      id: pacientesDB.length + 1,
      nombre,
      especie,
      raza,
      edadMeses,
      pesoKg,
      propietarioId
    };
    pacientesDB.push(nuevo);

    // Crear de forma automatica el historial clinico (T-06)
    const nuevoHistorial: Historial = {
      id: historialesDB.length + 1,
      pacienteId: nuevo.id,
      fechaCreacion: new Date()
    };
    historialesDB.push(nuevoHistorial);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-03: POST /api/v1/hcc/triajes
export const crearTriaje = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, veterinarioId, nivelUrgencia, temperaturaC, frecuenciaCardiaca, frecuenciaRespiratoria, escalaDolor, tiempoEsperaMinutos } = req.body;

    // Validaciones basicas
    const paciente = pacientesDB.find(p => p.id === pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado en el sistema' });
    }

    // CH-08: Nivel urgencia
    if (!['rojo', 'naranja', 'amarillo', 'verde', 'azul'].includes(nivelUrgencia)) {
      return res.status(400).json({ error: 'Validacion CH-08 Fallida: Nivel de urgencia invalido' });
    }

    // CH-09 & CH-10: Temperatura
    if (temperaturaC < 30.0 || temperaturaC > 45.0) {
      return res.status(400).json({ error: 'Validacion CH-09/10 Fallida: Temperatura fuera de rango critico (30C - 45C)' });
    }

    // CH-11 & CH-12: Frecuencia cardiaca
    if (frecuenciaCardiaca < 20 || frecuenciaCardiaca > 350) {
      return res.status(400).json({ error: 'Validacion CH-11/12 Fallida: Frecuencia cardiaca fuera de limites fisiologicos' });
    }

    // CH-13 & CH-14: Frecuencia respiratoria
    if (frecuenciaRespiratoria < 5 || frecuenciaRespiratoria > 150) {
      return res.status(400).json({ error: 'Validacion CH-13/14 Fallida: Frecuencia respiratoria fuera de limites' });
    }

    // CH-15 & CH-16: Escala de dolor
    if (escalaDolor < 1 || escalaDolor > 10) {
      return res.status(400).json({ error: 'Validacion CH-15/16 Fallida: Escala de dolor debe situarse entre 1 y 10' });
    }

    const nuevo: Triaje = {
      id: triajesDB.length + 1,
      pacienteId,
      veterinarioId,
      nivelUrgencia,
      temperaturaC,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      escalaDolor,
      tiempoEsperaMinutos: tiempoEsperaMinutos || 0
    };
    triajesDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-04: GET /api/v1/hcc/pacientes/{id}/historial
export const obtenerHistorialPaciente = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pacienteId = parseInt(req.params.id);
    const historial = historialesDB.find(h => h.pacienteId === pacienteId);

    if (!historial) {
      return res.status(404).json({ error: 'Historial clinico no encontrado para la mascota' });
    }

    const consultas = consultasDB.filter(c => c.historialId === historial.id);
    return res.status(200).json({
      historial,
      consultas
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-05: POST /api/v1/hcc/consultas
export const crearConsulta = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { historialId, veterinarioId, motivo, costoBase } = req.body;

    if (!historialId || !veterinarioId || !motivo || costoBase === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios en la consulta' });
    }

    // Validaciones
    const historial = historialesDB.find(h => h.id === historialId);
    if (!historial) {
      return res.status(404).json({ error: 'Historial clinico no encontrado' });
    }

    if (costoBase < 0.0) {
      return res.status(400).json({ error: 'El costo base de la consulta no puede ser negativo' });
    }

    if (motivo.trim().length < 5) {
      return res.status(400).json({ error: 'El motivo de la consulta debe tener al menos 5 caracteres' });
    }

    const nuevo: Consulta = {
      id: consultasDB.length + 1,
      historialId,
      veterinarioId,
      motivo,
      costoBase,
      fechaConsulta: new Date()
    };
    consultasDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-06: POST /api/v1/hcc/cirugias
export const crearCirugia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { consultaId, veterinarioId, tipoCirugia, salaId, bloqueHorario, costoAdicional } = req.body;

    if (!consultaId || !veterinarioId || !tipoCirugia || !salaId || !bloqueHorario || costoAdicional === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar la cirugia' });
    }

    // Validar tipo cirugia (CH-17)
    if (!['mayor', 'menor', 'emergencia', 'estetica'].includes(tipoCirugia)) {
      return res.status(400).json({ error: 'Validacion CH-17 Fallida: Tipo de cirugia invalido' });
    }

    // LÓGICA DE BLOQUEO PESIMISTA (Quirófano)
    // Comprobar si existe una reserva vigente sobre esa sala y bloque horario
    const ahora = new Date();
    const conflicto = reservasQuirofanoDB.find(r =>
      r.salaId === salaId &&
      r.bloqueHorario === bloqueHorario &&
      r.reservadoHasta > ahora
    );

    if (conflicto) {
      return res.status(409).json({
        error: `Conflicto de reserva: La sala de quirofano ${salaId} ya esta reservada para el bloque ${bloqueHorario}.`
      });
    }

    // Reservar el quirófano con un TTL de 10 minutos
    const reservadoHasta = new Date(ahora.getTime() + 10 * 60 * 1000);
    reservasQuirofanoDB.push({
      salaId,
      bloqueHorario,
      reservadoHasta
    });

    const nuevo: Cirugia = {
      id: cirugiasDB.length + 1,
      consultaId,
      veterinarioId,
      tipoCirugia,
      consentimientoFirmado: true,
      costoAdicional,
      fechaCirugia: new Date(bloqueHorario)
    };
    cirugiasDB.push(nuevo);

    return res.status(201).json({
      cirugia: nuevo,
      reservaQuirofano: {
        salaId,
        bloqueHorario,
        status: 'bloqueado_pesimista',
        expiraEn: reservadoHasta.toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-07: POST /api/v1/hcc/hospitalizaciones
export const ingresarHospitalizacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, salaId, costoDia } = req.body;

    if (!pacienteId || !salaId || costoDia === undefined) {
      return res.status(400).json({ error: 'Faltan campos del ingreso' });
    }

    if (costoDia < 0.0) {
      return res.status(400).json({ error: 'El costo por dia no puede ser negativo' });
    }

    const nuevo: Hospitalizacion = {
      id: hospitalizacionesDB.length + 1,
      pacienteId,
      salaId,
      fechaIngreso: new Date(),
      fechaAlta: null,
      costoDia,
      estado: 'activo'
    };
    hospitalizacionesDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-08: POST /api/v1/hcc/hospitalizaciones/{id}/signos
export const registrarSignosVitales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitalizacionId = parseInt(req.params.id);
    const { saturacionOxigeno, presionArterialSistolica, presionArterialDiastolica } = req.body;

    const hosp = hospitalizacionesDB.find(h => h.id === hospitalizacionId);
    if (!hosp) {
      return res.status(404).json({ error: 'Hospitalizacion activa no encontrada' });
    }

    // CH-20 & CH-21: Saturacion
    if (saturacionOxigeno < 50 || saturacionOxigeno > 100) {
      return res.status(400).json({ error: 'Validacion CH-20/21 Fallida: Saturacion de oxigeno debe estar entre 50 y 100%' });
    }

    // CH-22 & CH-23: Presion sistolica
    if (presionArterialSistolica < 50 || presionArterialSistolica > 250) {
      return res.status(400).json({ error: 'Validacion CH-22/23 Fallida: Presion sistolica fuera de limites (50-250 mmHg)' });
    }

    // CH-24 & CH-25: Presion diastolica
    if (presionArterialDiastolica < 30 || presionArterialDiastolica > 180) {
      return res.status(400).json({ error: 'Validacion CH-24/25 Fallida: Presion diastolica fuera de limites (30-180 mmHg)' });
    }

    const nuevo: SignosVitales = {
      id: signosVitalesDB.length + 1,
      hospitalizacionId,
      saturacionOxigeno,
      presionArterialSistolica,
      presionArterialDiastolica,
      fechaRegistro: new Date()
    };
    signosVitalesDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-09: GET /api/v1/hcc/veterinarios
export const listarVeterinarios = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(veterinariosDB);
};

// EP-10: GET /api/v1/hcc/cirugias/salas-disponibles
export const obtenerSalasDisponibles = async (req: AuthenticatedRequest, res: Response) => {
  // Salas estáticas configuradas en la clínica
  const salasConfiguradas = [
    { salaId: 101, nombre: 'Quirófano A - Mayor' },
    { salaId: 102, nombre: 'Quirófano B - Menor' }
  ];
  return res.status(200).json(salasConfiguradas);
};
