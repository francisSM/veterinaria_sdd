import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  Propietario,
  Paciente,
  Triaje,
  Historial,
  Consulta,
  Cirugia,
  Hospitalizacion,
  SignosVitales,
  Veterinario,
  Consentimiento
} from '../models/clinica';

const getRelativeDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Almacén transitorio en memoria para simular la persistencia y validaciones CHECK
export const propietariosDB: Propietario[] = [
  { id: 3,  nombre: 'Marta Gómez',        rut: '15928345-K', email: 'cliente@vetguard.com',     telefono: '988887766' },
  { id: 4,  nombre: 'Fabián Sanhueza',     rut: '17892341-2', email: 'fbisanhueza@gmail.com',    telefono: '976543210' },
  { id: 5,  nombre: 'Camila Torres',       rut: '19234567-8', email: 'camila.torres@gmail.com',  telefono: '956781234' },
  { id: 6,  nombre: 'Rodrigo Muñoz',       rut: '14567891-3', email: 'rodrigo.m@hotmail.com',    telefono: '943218765' },
  { id: 7,  nombre: 'Valentina Ríos',      rut: '20345678-9', email: 'valerios@gmail.com',       telefono: '912345678' },
  { id: 8,  nombre: 'Diego Contreras',     rut: '16789012-K', email: 'dcontreras@outlook.com',   telefono: '934567890' },
  { id: 9,  nombre: 'Sofía Paredes',       rut: '18901234-5', email: 'sofiaparedes@gmail.com',   telefono: '967890123' },
];
export const pacientesDB: Paciente[] = [
  { id: 1,  nombre: 'Thor',      especie: 'canino', raza: 'Golden Retriever', edadMeses: 36,  pesoKg: 32.5, propietarioId: 3, fechaNacimiento: '2023-07-01', fechaNacimientoTipo: 'precisa' },
  { id: 2,  nombre: 'Coco',      especie: 'felino', raza: 'Siamés',           edadMeses: 12,  pesoKg: 4.2,  propietarioId: 4, fechaNacimiento: '2025-07-01', fechaNacimientoTipo: 'precisa' },
  { id: 3,  nombre: 'Luna',      especie: 'canino', raza: 'Labrador',         edadMeses: 24,  pesoKg: 28.0, propietarioId: 5, fechaNacimiento: '2024-07-01', fechaNacimientoTipo: 'estimada' },
  { id: 4,  nombre: 'Mishi',     especie: 'felino', raza: 'Persa',            edadMeses: 48,  pesoKg: 5.1,  propietarioId: 5, fechaNacimiento: '2022-07-01', fechaNacimientoTipo: 'precisa' },
  { id: 5,  nombre: 'Rex',       especie: 'canino', raza: 'Pastor Alemán',    edadMeses: 60,  pesoKg: 38.0, propietarioId: 6, fechaNacimiento: '2021-07-01', fechaNacimientoTipo: 'estimada' },
  { id: 6,  nombre: 'Pelusa',    especie: 'felino', raza: 'Angora',           edadMeses: 18,  pesoKg: 3.7,  propietarioId: 6, fechaNacimiento: '2024-11-01', fechaNacimientoTipo: 'precisa' },
  { id: 7,  nombre: 'Rocky',     especie: 'canino', raza: 'Bulldog Francés',  edadMeses: 20,  pesoKg: 12.5, propietarioId: 7, fechaNacimiento: '2024-11-01', fechaNacimientoTipo: 'estimada' },
  { id: 8,  nombre: 'Nala',      especie: 'canino', raza: 'Husky Siberiano',  edadMeses: 30,  pesoKg: 22.0, propietarioId: 8, fechaNacimiento: '2023-11-01', fechaNacimientoTipo: 'precisa' },
  { id: 9,  nombre: 'Simba',     especie: 'felino', raza: 'Maine Coon',       edadMeses: 36,  pesoKg: 6.8,  propietarioId: 8, fechaNacimiento: '2023-07-01', fechaNacimientoTipo: 'estimada' },
  { id: 10, nombre: 'Beto',      especie: 'canino', raza: 'Beagle',           edadMeses: 14,  pesoKg: 9.2,  propietarioId: 9, fechaNacimiento: '2025-05-01', fechaNacimientoTipo: 'precisa' },
  { id: 11, nombre: 'Oreo',      especie: 'felino', raza: 'Doméstico Negro',  edadMeses: 8,   pesoKg: 3.1,  propietarioId: 9, fechaNacimiento: '2025-11-01', fechaNacimientoTipo: 'estimada' },
  { id: 12, nombre: 'Max',       especie: 'canino', raza: 'Rottweiler',       edadMeses: 42,  pesoKg: 45.0, propietarioId: 3, fechaNacimiento: '2022-11-01', fechaNacimientoTipo: 'precisa' },
];
export const triajesDB: Triaje[] = [
  {
    id: 1,
    pacienteId: 2, // Coco
    veterinarioId: 5,
    nivelUrgencia: 'amarillo',
    temperaturaC: 38.6,
    frecuenciaCardiaca: 140,
    frecuenciaRespiratoria: 28,
    escalaDolor: 4,
    tiempoEsperaMinutos: 15,
    fechaRegistro: new Date('2026-06-25T10:15:00')
  }
];
export const historialesDB: Historial[] = [
  { id: 1,  pacienteId: 1,  fechaCreacion: new Date('2026-06-10') },
  { id: 2,  pacienteId: 2,  fechaCreacion: new Date('2026-06-20') },
  { id: 3,  pacienteId: 3,  fechaCreacion: new Date('2026-06-01') },
  { id: 4,  pacienteId: 4,  fechaCreacion: new Date('2026-06-05') },
  { id: 5,  pacienteId: 5,  fechaCreacion: new Date('2026-05-20') },
  { id: 6,  pacienteId: 6,  fechaCreacion: new Date('2026-06-15') },
  { id: 7,  pacienteId: 7,  fechaCreacion: new Date('2026-06-18') },
  { id: 8,  pacienteId: 8,  fechaCreacion: new Date('2026-06-22') },
  { id: 9,  pacienteId: 9,  fechaCreacion: new Date('2026-06-25') },
  { id: 10, pacienteId: 10, fechaCreacion: new Date('2026-06-28') },
  { id: 11, pacienteId: 11, fechaCreacion: new Date('2026-06-29') },
  { id: 12, pacienteId: 12, fechaCreacion: new Date('2026-06-30') },
];
export const consultasDB: Consulta[] = [
  { id: 101, historialId: 1,  veterinarioId: 2, motivo: 'Control anual y vacuna antirrábica', costoBase: 25000, fechaConsulta: new Date('2026-06-15') },
  { id: 102, historialId: 2,  veterinarioId: 5, motivo: 'Revisión general y desparasitación', costoBase: 18000, fechaConsulta: new Date('2026-06-25') },
  { id: 103, historialId: 3,  veterinarioId: 2, motivo: 'Fractura pata delantera derecha, requiere inmovilización', costoBase: 45000, fechaConsulta: new Date('2026-06-28') },
  { id: 104, historialId: 5,  veterinarioId: 2, motivo: 'Trauma abdominal por atropello, cirugía de urgencia', costoBase: 120000, fechaConsulta: new Date('2026-06-29') },
  { id: 105, historialId: 7,  veterinarioId: 5, motivo: 'Post-operatorio esterilización', costoBase: 65000, fechaConsulta: new Date('2026-06-30') },
  { id: 106, historialId: 9,  veterinarioId: 5, motivo: 'Síntomas respiratorios, posible neumonía', costoBase: 38000, fechaConsulta: new Date('2026-07-01') },
];
export const cirugiasDB: Cirugia[] = [
  {
    id: 1,
    consultaId: 102,
    veterinarioId: 5, // Dra. Jane Smith
    tipoCirugia: 'menor',
    intervencion: 'Limpieza dental profunda',
    consentimientoFirmado: true,
    costoAdicional: 0,
    fechaCirugia: new Date(getRelativeDate(2) + 'T14:00:00'),
    fechaHoraCirugia: getRelativeDate(2) + ' 14:00'
  }
];
export const hospitalizacionesDB: Hospitalizacion[] = [
  { id: 1, pacienteId: 5,  salaId: 1, fechaIngreso: new Date('2026-06-29T08:30:00'), fechaAlta: null, costoDia: 35000, estado: 'activo' },
  { id: 2, pacienteId: 3,  salaId: 2, fechaIngreso: new Date('2026-06-28T14:00:00'), fechaAlta: null, costoDia: 22000, estado: 'activo' },
  { id: 3, pacienteId: 7,  salaId: 2, fechaIngreso: new Date('2026-06-30T09:00:00'), fechaAlta: null, costoDia: 22000, estado: 'activo' },
  { id: 4, pacienteId: 9,  salaId: 3, fechaIngreso: new Date('2026-07-01T07:00:00'), fechaAlta: null, costoDia: 18000, estado: 'activo' },
  { id: 5, pacienteId: 2,  salaId: 2, fechaIngreso: new Date('2026-06-26T08:00:00'), fechaAlta: new Date('2026-06-27T18:00:00'), costoDia: 22000, estado: 'alta' }
];
export const signosVitalesDB: SignosVitales[] = [
  {
    id: 1,
    hospitalizacionId: 5,
    saturacionOxigeno: 98,
    presionArterialSistolica: 120,
    presionArterialDiastolica: 80,
    fechaRegistro: new Date('2026-06-26T12:00:00')
  },
  {
    id: 2,
    hospitalizacionId: 5,
    saturacionOxigeno: 97,
    presionArterialSistolica: 118,
    presionArterialDiastolica: 78,
    fechaRegistro: new Date('2026-06-27T08:00:00')
  }
];

// Veterinarios cargados por defecto (Veterinarios de turno)
export const veterinariosDB: Veterinario[] = [
  { id: 2, nombre: 'Dr. John Doe', rut: '12345678-9', licenciaMedica: 'VET-9901' },
  { id: 5, nombre: 'Dra. Jane Smith', rut: '98765432-1', licenciaMedica: 'VET-8832' }
];

export const consentimientosDB: Consentimiento[] = [];

// Almacén temporal de reservas de quirófanos para bloqueo pesimista (enlazado a consultas/cirugías)
interface ReservaSalaQuirofano {
  salaId: number;
  bloqueHorario: string; // Formato YYYY-MM-DD HH:MM
  reservadoHasta: Date;
  cirugiaId?: number;
}
export const reservasQuirofanoDB: ReservaSalaQuirofano[] = [
  {
    salaId: 101,
    bloqueHorario: getRelativeDate(2) + ' 14:00',
    reservadoHasta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    cirugiaId: 1
  }
];

// --- IMPLEMENTACIÓN DE ENDPOINTS EP-01 A EP-10 ---

// EP-01: POST /api/v1/clinica/propietarios
export const crearPropietario = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre, rut, email, telefono } = req.body;

    if (!nombre || !rut || !telefono) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar propietario (nombre, rut, telefono)' });
    }

    // CH-04 & CH-05: Validar formato email solo si es proporcionado
    if (email && (!email.includes('@') || !email.includes('.'))) {
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
      email: email || null,
      telefono
    };
    propietariosDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-02: POST /api/v1/clinica/pacientes
export const crearPaciente = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre, especie, raza, edadMeses, pesoKg, propietarioId, fechaNacimiento, fechaNacimientoTipo, sexo, chipNumero, colorMarcas, alergias, notas } = req.body;

    if (!nombre || !especie || !raza || pesoKg === undefined || !propietarioId) {
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

    const edadMesesVal = edadMeses !== undefined && edadMeses !== null ? Number(edadMeses) : 0;

    // CH-01: Validar edad
    if (edadMesesVal < 0) {
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
      edadMeses: edadMesesVal,
      pesoKg,
      propietarioId,
      fechaNacimiento: fechaNacimiento || null,
      fechaNacimientoTipo: fechaNacimientoTipo || null,
      sexo: sexo || null,
      chipNumero: chipNumero || null,
      colorMarcas: colorMarcas || null,
      alergias: alergias || null,
      notas: notas || null
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

// EP-03: POST /api/v1/clinica/triajes
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
      tiempoEsperaMinutos: tiempoEsperaMinutos || 0,
      fechaRegistro: new Date()
    };
    triajesDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-04: GET /api/v1/clinica/pacientes/{id}/historial
export const obtenerHistorialPaciente = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pacienteId = parseInt(req.params.id);
    const historial = historialesDB.find(h => h.pacienteId === pacienteId);

    if (!historial) {
      return res.status(404).json({ error: 'Historial clinico no encontrado para la mascota' });
    }

    const consultas = consultasDB.filter(c => c.historialId === historial.id);
    const consultaIds = consultas.map(c => c.id);
    
    const triajes = triajesDB.filter(t => t.pacienteId === pacienteId);
    const cirugias = cirugiasDB.filter(cir => consultaIds.includes(cir.consultaId));
    const hospitalizaciones = hospitalizacionesDB.filter(h => h.pacienteId === pacienteId);

    // Enriquecer hospitalizaciones con sus signos vitales
    const hospEnriquecidas = hospitalizaciones.map(h => {
      const signos = signosVitalesDB.filter(sv => sv.hospitalizacionId === h.id);
      return { ...h, signos };
    });

    return res.status(200).json({
      historial,
      consultas,
      triajes,
      cirugias,
      hospitalizaciones: hospEnriquecidas
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-05: POST /api/v1/clinica/consultas
export const crearConsulta = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { historialId, veterinarioId, motivo, costoBase, diagnostico } = req.body;

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
      diagnostico: diagnostico || null,
      costoBase,
      fechaConsulta: new Date()
    };
    consultasDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Helper to check if a veterinarian is in surgery during a slot
export const isVetBusyInSurgery = (vetId: number, fecha: string, bloque: string): boolean => {
  return cirugiasDB.some(c => {
    if (c.veterinarioId !== vetId) return false;
    
    // format c.fechaCirugia to YYYY-MM-DD
    const dateStr = c.fechaCirugia.toISOString().split('T')[0];
    if (dateStr !== fecha) return false;
    
    let startHour = "";
    if (c.fechaHoraCirugia) {
      const parts = c.fechaHoraCirugia.split(" ");
      startHour = parts.length > 1 ? parts[1] : "";
    } else {
      const hrs = String(c.fechaCirugia.getHours()).padStart(2, '0');
      const mins = String(c.fechaCirugia.getMinutes()).padStart(2, '0');
      startHour = `${hrs}:${mins}`;
    }
    
    let occupiedBlocks: string[] = [];
    if (startHour === "09:00") occupiedBlocks = ["09:00-10:00", "10:00-11:00"];
    else if (startHour === "11:30") occupiedBlocks = ["11:00-12:00", "13:00-14:00"];
    else if (startHour === "14:00") occupiedBlocks = ["14:00-15:00", "15:00-16:00"];
    else if (startHour === "16:00") occupiedBlocks = ["16:00-17:00", "17:00-18:00"];
    else if (startHour === "18:00") occupiedBlocks = ["17:00-18:00"];
    
    return occupiedBlocks.includes(bloque);
  });
};

// EP-06: POST /api/v1/clinica/cirugias
export const crearCirugia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { consultaId, tipoCirugia, costoAdicional, intervencion } = req.body;
    const rawVetId = req.body.veterinarioId;
    const rawSalaId = req.body.salaId || req.body.quirofanoSalaId;
    const rawBloqueHorario = req.body.bloqueHorario || req.body.fechaHoraCirugia;

    if (!consultaId || !rawVetId || !tipoCirugia || !rawSalaId || !rawBloqueHorario || costoAdicional === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar la cirugia' });
    }

    const veterinarioId = Number(rawVetId);
    const salaId = Number(rawSalaId);
    const bloqueHorario = String(rawBloqueHorario);

    // Validar tipo cirugia (CH-17)
    if (!['mayor', 'menor', 'emergencia', 'estetica'].includes(tipoCirugia)) {
      return res.status(400).json({ error: 'Validacion CH-17 Fallida: Tipo de cirugia invalido' });
    }

    // LÓGICA DE BLOQUEO PESIMISTA (Quirófano)
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

    const cirugiaId = cirugiasDB.length + 1;

    // Reservar el quirófano con un TTL de 10 minutos
    const reservadoHasta = new Date(ahora.getTime() + 10 * 60 * 1000);
    reservasQuirofanoDB.push({
      salaId,
      bloqueHorario,
      reservadoHasta,
      cirugiaId
    } as any);

    const nuevo: Cirugia = {
      id: cirugiaId,
      consultaId,
      veterinarioId,
      tipoCirugia,
      intervencion: intervencion || null,
      consentimientoFirmado: true,
      costoAdicional,
      fechaCirugia: new Date(bloqueHorario.replace(' ', 'T')),
      fechaHoraCirugia: bloqueHorario
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

// GET /api/v1/clinica/cirugias - Listar reservas de quirófanos
export const listarCirugias = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email || '';
    const rol = req.user?.rol || '';
    
    let targetCirugias = cirugiasDB;
    
    if (rol === 'cliente') {
      const prop = propietariosDB.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!prop) return res.status(200).json({ cirugias: [] });
      
      targetCirugias = cirugiasDB.filter(c => {
        const consulta = consultasDB.find(con => con.id === c.consultaId);
        if (!consulta) return false;
        const historial = historialesDB.find(h => h.id === consulta.historialId);
        if (!historial) return false;
        const pac = pacientesDB.find(p => p.id === historial.pacienteId);
        return pac ? pac.propietarioId === prop.id : false;
      });
    }

    const enriched = targetCirugias.map(c => {
      const consulta = consultasDB.find(con => con.id === c.consultaId);
      let pacienteNombre = '(desconocido)';
      let propietarioNombre = '(desconocido)';
      let propietarioRut = '';
      if (consulta) {
        const historial = historialesDB.find(h => h.id === consulta.historialId);
        if (historial) {
          const paciente = pacientesDB.find(p => p.id === historial.pacienteId);
          if (paciente) {
            pacienteNombre = paciente.nombre;
            const propietario = propietariosDB.find(prop => prop.id === paciente.propietarioId);
            if (propietario) {
              propietarioNombre = propietario.nombre;
              propietarioRut = propietario.rut;
            }
          }
        }
      }
      const vet = veterinariosDB.find(v => v.id === c.veterinarioId);
      const resv = reservasQuirofanoDB.find(r => r.cirugiaId === c.id);
      
      return {
        ...c,
        pacienteNombre,
        propietarioNombre,
        propietarioRut,
        quirofanoSalaId: resv?.salaId || 101,
        veterinarioNombre: vet?.nombre || '(desconocido)'
      };
    });
    return res.status(200).json({ cirugias: enriched });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE /api/v1/clinica/cirugias/:id - Cancelar/Eliminar reserva de quirófano
export const eliminarCirugia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const index = cirugiasDB.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cirugía/Reserva no encontrada en el sistema' });
    }

    cirugiasDB.splice(index, 1);

    // Liberar de reservasQuirofanoDB
    const rIndex = reservasQuirofanoDB.findIndex(r => r.cirugiaId === id);
    if (rIndex !== -1) {
      reservasQuirofanoDB.splice(rIndex, 1);
    }

    // Borrado de base de datos relacional
    const pgPool = (global as any).pgPool;
    if (pgPool) {
      await pgPool.query('DELETE FROM cirugias WHERE id = $1', [id]);
    }

    return res.status(200).json({ success: true, message: 'Reserva de quirófano cancelada exitosamente' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar todas las hospitalizaciones
export const listarHospitalizaciones = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(hospitalizacionesDB);
};

// EP-07: POST /api/v1/clinica/hospitalizaciones — Ingresar paciente a sala
export const ingresarHospitalizacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, salaId, costoDia } = req.body;

    if (!pacienteId || !salaId || costoDia === undefined) {
      return res.status(400).json({ error: 'Faltan campos del ingreso (pacienteId, salaId, costoDia)' });
    }
    if (costoDia < 0.0) {
      return res.status(400).json({ error: 'El costo por dia no puede ser negativo' });
    }
    const paciente = pacientesDB.find(p => p.id === Number(pacienteId));
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    // Verificar que el paciente no está ya hospitalizado activamente
    const yaHospitalizado = hospitalizacionesDB.find(h => h.pacienteId === Number(pacienteId) && h.estado === 'activo');
    if (yaHospitalizado) {
      return res.status(409).json({ error: `${paciente.nombre} ya se encuentra hospitalizado/a en sala ${yaHospitalizado.salaId}. Dé de alta primero o traslade.` });
    }

    const nuevo: Hospitalizacion = {
      id: hospitalizacionesDB.reduce((m, h) => Math.max(m, h.id), 0) + 1,
      pacienteId: Number(pacienteId),
      salaId: Number(salaId),
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

// PUT /api/v1/clinica/hospitalizaciones/:id/sala — Trasladar a otra sala
export const cambiarSalaHospitalizacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { salaId } = req.body;
    if (!salaId) return res.status(400).json({ error: 'salaId es requerido' });

    const hosp = hospitalizacionesDB.find(h => h.id === id);
    if (!hosp) return res.status(404).json({ error: 'Hospitalización no encontrada' });
    if (hosp.estado !== 'activo') return res.status(409).json({ error: 'Solo se puede trasladar una hospitalización activa' });
    if (hosp.salaId === Number(salaId)) return res.status(400).json({ error: 'El paciente ya está en esa sala' });

    const salaAnterior = hosp.salaId;
    hosp.salaId = Number(salaId);
    return res.status(200).json({ success: true, hospitalizacion: hosp, salaAnterior });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// PUT /api/v1/clinica/hospitalizaciones/:id/alta — Dar de alta o registrar fallecimiento
export const darAltaHospitalizacion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body; // 'alta' | 'fallecido'

    if (!estado || !['alta', 'fallecido'].includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser "alta" o "fallecido"' });
    }
    const hosp = hospitalizacionesDB.find(h => h.id === id);
    if (!hosp) return res.status(404).json({ error: 'Hospitalización no encontrada' });
    if (hosp.estado !== 'activo') return res.status(409).json({ error: 'La hospitalización ya está cerrada' });

    hosp.estado = estado as 'alta' | 'fallecido';
    hosp.fechaAlta = new Date();
    return res.status(200).json({ success: true, hospitalizacion: hosp });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-08: POST /api/v1/clinica/hospitalizaciones/{id}/signos
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

// EP-09: GET /api/v1/clinica/veterinarios
export const listarVeterinarios = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json(veterinariosDB);
};

// EP-10: GET /api/v1/clinica/cirugias/salas-disponibles
export const obtenerSalasDisponibles = async (req: AuthenticatedRequest, res: Response) => {
  // Salas estáticas configuradas en la clínica
  const salasConfiguradas = [
    { salaId: 101, nombre: 'Quirófano A - Mayor' },
    { salaId: 102, nombre: 'Quirófano B - Menor' }
  ];
  return res.status(200).json(salasConfiguradas);
};

// EP-11: GET /api/v1/clinica/propietario/perfil
export const obtenerPerfilPropietario = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email || '';
    const prop = propietariosDB.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!prop) {
      // Registrar un perfil propietario al vuelo para nuevos usuarios registrados por auth
      const propNuevo = {
        id: propietariosDB.length + 1,
        nombre: req.user?.nombre || 'Propietario',
        rut: `RUT-${10000000 + Math.floor(Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`,
        email: email.toLowerCase(),
        telefono: '9' + Math.floor(10000000 + Math.random() * 90000000)
      };
      propietariosDB.push(propNuevo);
      return res.status(200).json({ propietario: propNuevo, pacientes: [] });
    }
    const pacs = pacientesDB.filter(p => p.propietarioId === prop.id);
    return res.status(200).json({ propietario: prop, pacientes: pacs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// =============================================================
// MÓDULO DE CITAS (SCR-32)
// =============================================================

export interface Cita {
  id: number;
  propietarioId: number;
  pacienteId: number;
  tipo: 'clinica' | 'domicilio';
  fecha: string;          // YYYY-MM-DD
  bloque: string;         // "09:00-10:00"
  motivo: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  veterinarioAsignadoId?: number;
  motivoCancelacion?: string;
  tarifaEstimada: number;
  creadaEn: string;
}



export const citasDB: Cita[] = [
  {
    id: 1,
    propietarioId: 3,
    pacienteId: 1,
    tipo: 'clinica',
    fecha: getRelativeDate(1), // mañana
    bloque: '09:00-10:00',
    motivo: 'Vacuna octuple y control de peso',
    estado: 'confirmada',
    veterinarioAsignadoId: 2, // Dr. John Doe (user id 2)
    tarifaEstimada: 12000,
    creadaEn: new Date().toISOString()
  },
  {
    id: 2,
    propietarioId: 4, // Fabián Sanhueza
    pacienteId: 2, // Coco
    tipo: 'clinica',
    fecha: getRelativeDate(1), // mañana
    bloque: '10:00-11:00',
    motivo: 'Control post-quirúrgico y revisión de suturas',
    estado: 'confirmada',
    veterinarioAsignadoId: 2,
    tarifaEstimada: 12000,
    creadaEn: new Date().toISOString()
  },
  {
    id: 3,
    propietarioId: 4, // Fabián Sanhueza
    pacienteId: 2, // Coco
    tipo: 'clinica',
    fecha: getRelativeDate(0), // hoy
    bloque: '15:00-16:00',
    motivo: 'Limpieza dental de rutina y sarro',
    estado: 'confirmada',
    veterinarioAsignadoId: 5, // Dra. Jane Smith (user id 5)
    tarifaEstimada: 12000,
    creadaEn: new Date().toISOString()
  },
  {
    id: 4,
    propietarioId: 4, // Fabián Sanhueza
    pacienteId: 2, // Coco
    tipo: 'domicilio',
    fecha: getRelativeDate(2), // pasado mañana
    bloque: '10:00-11:00',
    motivo: 'Vacunación gatito y revisión de orejas',
    estado: 'pendiente',
    tarifaEstimada: 22000,
    creadaEn: new Date().toISOString()
  }
];

const TARIFAS: Record<string, number> = {
  clinica: 12000,
  domicilio: 22000
};

// Bloques horarios disponibles (08:00 - 18:00, bloques de 1h)
const BLOQUES_DIA = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

// EP-C1: POST /api/v1/citas — Crear cita (cliente, vet, admin)
export const crearCita = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pacienteId, tipo, fecha, bloque, motivo, veterinarioAsignadoId } = req.body;
    if (!pacienteId || !tipo || !fecha || !bloque || !motivo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: pacienteId, tipo, fecha, bloque, motivo' });
    }
    if (!['clinica', 'domicilio'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser "clinica" o "domicilio"' });
    }
    if (!BLOQUES_DIA.includes(bloque)) {
      return res.status(400).json({ error: `Bloque inválido. Opciones: ${BLOQUES_DIA.join(', ')}` });
    }

    // Buscar propietario por email del usuario logueado
    const email = req.user?.email || '';
    const rol = req.user?.rol || '';
    let propietarioId: number;

    if (rol === 'cliente') {
      const prop = propietariosDB.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!prop) return res.status(404).json({ error: 'Propietario no encontrado para este usuario' });
      propietarioId = prop.id;

      // Verificar que la mascota pertenece al cliente
      const paciente = pacientesDB.find(p => p.id === Number(pacienteId) && p.propietarioId === propietarioId);
      if (!paciente) return res.status(403).json({ error: 'La mascota no pertenece a este propietario' });
    } else {
      // Vet o admin pueden crear cita para cualquier propietario
      const paciente = pacientesDB.find(p => p.id === Number(pacienteId));
      if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
      propietarioId = paciente.propietarioId;
    }

    // Verificar disponibilidad (bloque no ocupado en esa fecha)
    const ocupado = citasDB.some(c =>
      c.fecha === fecha && c.bloque === bloque && c.estado !== 'cancelada'
    );
    if (ocupado) {
      return res.status(409).json({ error: 'El bloque horario ya está ocupado en esa fecha' });
    }

    if (veterinarioAsignadoId && isVetBusyInSurgery(Number(veterinarioAsignadoId), fecha, bloque)) {
      return res.status(409).json({ error: 'El veterinario asignado tiene una cirugía programada en ese bloque horario' });
    }

    const nueva: Cita = {
      id: citasDB.length + 1,
      propietarioId,
      pacienteId: Number(pacienteId),
      tipo: tipo as 'clinica' | 'domicilio',
      fecha,
      bloque,
      motivo,
      estado: 'pendiente',
      veterinarioAsignadoId: veterinarioAsignadoId ? Number(veterinarioAsignadoId) : undefined,
      tarifaEstimada: TARIFAS[tipo] || 12000,
      creadaEn: new Date().toISOString()
    };
    citasDB.push(nueva);
    return res.status(201).json({ success: true, cita: nueva });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-C2: GET /api/v1/citas — Listar citas según rol
export const listarCitas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const email = req.user?.email || '';
    const rol = req.user?.rol || '';

    let result: Cita[];

    if (rol === 'cliente') {
      const prop = propietariosDB.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!prop) return res.status(200).json({ citas: [] });
      result = citasDB.filter(c => c.propietarioId === prop.id);
    } else {
      // Vet y admin ven todas
      result = [...citasDB];
    }

    // Enriquecer con datos de paciente y propietario
    const enriched = result.map(c => {
      const paciente = pacientesDB.find(p => p.id === c.pacienteId);
      const propietario = propietariosDB.find(p => p.id === c.propietarioId);
      const vet = c.veterinarioAsignadoId ? veterinariosDB.find(v => v.id === c.veterinarioAsignadoId) : null;
      return {
        ...c,
        pacienteNombre: paciente?.nombre || '(desconocido)',
        pacienteEspecie: paciente?.especie || '',
        propietarioNombre: propietario?.nombre || '(desconocido)',
        propietarioEmail: propietario?.email || '',
        veterinarioNombre: vet?.nombre || null
      };
    });

    // Orden: pendientes primero, luego confirmadas, por fecha
    enriched.sort((a, b) => {
      const prioridad: Record<string, number> = { pendiente: 0, confirmada: 1, completada: 2, cancelada: 3 };
      const pa = prioridad[a.estado] ?? 4;
      const pb = prioridad[b.estado] ?? 4;
      if (pa !== pb) return pa - pb;
      const rawA: any = a.fecha;
      const rawB: any = b.fecha;
      const dateA = rawA instanceof Date ? rawA : new Date(rawA);
      const dateB = rawB instanceof Date ? rawB : new Date(rawB);
      return dateA.getTime() - dateB.getTime();
    });

    return res.status(200).json({ citas: enriched });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-C3: GET /api/v1/citas/disponibilidad?fecha=YYYY-MM-DD — Bloques disponibles
export const obtenerDisponibilidad = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: 'Parámetro fecha requerido (YYYY-MM-DD)' });

    const ocupados = citasDB
      .filter(c => c.fecha === fecha && c.estado !== 'cancelada')
      .map(c => c.bloque);

    const disponibles = BLOQUES_DIA.filter(b => !ocupados.includes(b));
    return res.status(200).json({ fecha, disponibles, ocupados, todos: BLOQUES_DIA });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-C4: PUT /api/v1/citas/:id/confirmar — Vet/Admin confirma y asigna veterinario
export const confirmarCita = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { veterinarioAsignadoId } = req.body;

    if (!veterinarioAsignadoId) {
      return res.status(400).json({ error: 'veterinarioAsignadoId es requerido para confirmar la cita' });
    }

    const cita = citasDB.find(c => c.id === id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    if (cita.estado !== 'pendiente') {
      return res.status(409).json({ error: `La cita no está en estado pendiente (estado actual: ${cita.estado})` });
    }

    const vet = veterinariosDB.find(v => v.id === Number(veterinarioAsignadoId));
    if (!vet) return res.status(404).json({ error: 'Veterinario asignado no encontrado' });

    // Verificar si el veterinario tiene cirugía a esa hora
    if (isVetBusyInSurgery(vet.id, cita.fecha, cita.bloque)) {
      return res.status(409).json({ error: 'El veterinario asignado tiene una cirugía programada en ese bloque horario' });
    }

    cita.estado = 'confirmada';
    cita.veterinarioAsignadoId = vet.id;

    return res.status(200).json({ success: true, cita, veterinarioNombre: vet.nombre });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// EP-C5: PUT /api/v1/citas/:id/cancelar — Cancelar cita con motivo
export const cancelarCita = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { motivoCancelacion } = req.body;

    const cita = citasDB.find(c => c.id === id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    if (['cancelada', 'completada'].includes(cita.estado)) {
      return res.status(409).json({ error: `No se puede cancelar una cita en estado: ${cita.estado}` });
    }

    // Clientes solo pueden cancelar sus propias citas
    if (req.user?.rol === 'cliente') {
      const prop = propietariosDB.find(p => p.email.toLowerCase() === (req.user?.email || '').toLowerCase());
      if (!prop || cita.propietarioId !== prop.id) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita' });
      }
    }

    cita.estado = 'cancelada';
    cita.motivoCancelacion = motivoCancelacion || 'Sin motivo especificado';

    return res.status(200).json({ success: true, cita });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/clinica/propietarios
export const listarPropietarios = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(200).json(propietariosDB);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/clinica/pacientes
export const listarPacientes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const propId = req.query.propietarioId;
    if (propId) {
      const filtrados = pacientesDB.filter(p => p.propietarioId === Number(propId));
      return res.status(200).json(filtrados);
    }
    return res.status(200).json(pacientesDB);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/v1/clinica/consentimientos
export const crearConsentimiento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propietarioId, pacienteId, tipo, detallesIntervencion, firmaPropietario } = req.body;

    if (!propietarioId || !pacienteId || !tipo || !detallesIntervencion || !firmaPropietario) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el consentimiento' });
    }

    const nuevo: Consentimiento = {
      id: consentimientosDB.length + 1,
      propietarioId,
      pacienteId,
      tipo,
      detallesIntervencion,
      firmaPropietario,
      fechaFirma: new Date()
    };
    consentimientosDB.push(nuevo);

    return res.status(201).json(nuevo);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/clinica/consentimientos
export const obtenerConsentimientos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listado = consentimientosDB.map(c => {
      const prop = propietariosDB.find(p => p.id === c.propietarioId);
      const pac = pacientesDB.find(p => p.id === c.pacienteId);
      return {
        ...c,
        propietarioNombre: prop ? prop.nombre : `Propietario #${c.propietarioId}`,
        propietarioRut: prop ? prop.rut : '',
        pacienteNombre: pac ? pac.nombre : `Paciente #${c.pacienteId}`
      };
    });
    return res.status(200).json(listado);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


