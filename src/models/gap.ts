/**
 * TypeScript Backend Models & Interfaces
 * Submódulo: Guardería y Peluquería (GAP)
 * Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD
 *
 * Mapeo uno a uno con el esquema relacional DDL (T-31 a T-40)
 * y validaciones de la rúbrica (CH-76 a CH-100).
 */

// T-31: Canil
export type EstadoCanilTipo = 'libre' | 'llena' | 'mantenimiento';

export interface Canil {
  id: number;
  nombre: string; // CH-79: >= 3 caracteres
  capacidadMaxima: number; // CH-76, CH-77: >= 1 y <= 50
  estado: EstadoCanilTipo; // CH-78
}

// T-32: ReservaGuarderia
export type EstadoReservaGuarderiaTipo = 'reservada' | 'activa' | 'completada' | 'cancelada';

export interface ReservaGuarderia {
  id: number;
  pacienteId: number; // FK -> Paciente.id (HCC Módulo 1)
  canilId: number; // FK -> Canil.id
  fechaCheckin: Date;
  fechaCheckout: Date; // CH-80: >= fechaCheckin
  costoTotal: number; // CH-82: >= 0.0
  estado: EstadoReservaGuarderiaTipo; // CH-81
}

// T-33: ServicioEstetica
export interface ServicioEstetica {
  id: number;
  nombreServicio: string;
  duracionEstimadaMinutos: number; // CH-94, CH-95: >= 15 y <= 180
}

// T-34: TurnoCuidador
export type TipoTurnoCuidadorTipo = 'mañana' | 'tarde' | 'noche';

export interface TurnoCuidador {
  id: number;
  cuidadorNombre: string;
  rut: string;
  fechaTurno: Date;
  turnoTipo: TipoTurnoCuidadorTipo; // CH-100
}

// T-35: RegistroActividad
export type TipoActividadGuarderiaTipo = 'alimentacion' | 'recreacion' | 'medicacion' | 'descanso';

export interface RegistroActividad {
  id: number;
  reservaId: number; // FK -> ReservaGuarderia.id
  tipoActividad: TipoActividadGuarderiaTipo; // CH-88
  horaRegistro: Date; // CH-89: obligatoria
  comentario: string | null;
  medicamentoInsumoId: number | null; // FK logic -> Medicamento.id (ILM Módulo 2)
}

// T-36: DietaEspecial
export type TipoAlimentoDietaTipo = 'seco' | 'humedo' | 'barf' | 'prescrito';

export interface DietaEspecial {
  id: number;
  pacienteId: number; // FK -> Paciente.id (HCC Módulo 1)
  tipoAlimento: TipoAlimentoDietaTipo; // CH-91
  porcionGramos: number; // CH-90: > 0
  observaciones: string | null;
}

// T-37: InspeccionSaludIngreso
export type EstadoGeneralSaludTipo = 'bueno' | 'regular' | 'critico';

export interface InspeccionSaludIngreso {
  id: number;
  reservaId: number; // FK -> ReservaGuarderia.id
  temperaturaIngreso: number; // CH-83, CH-84: >= 35.0 y <= 42.0
  pesoIngreso: number; // CH-85, CH-86: > 0.0 y <= 150.0
  estadoGeneral: EstadoGeneralSaludTipo; // CH-87
  observaciones: string | null;
}

// T-38: ControlPertenencia
export type EstadoPertenenciaTipo = 'bueno' | 'dañado' | 'sucio';

export interface ControlPertenencia {
  id: number;
  reservaId: number; // FK -> ReservaGuarderia.id
  itemNombre: string;
  cantidad: number; // CH-92: > 0
  estadoRecibido: EstadoPertenenciaTipo; // CH-93
}

// T-39: HistorialEstetica
export interface HistorialEstetica {
  id: number;
  pacienteId: number; // FK -> Paciente.id (HCC Módulo 1)
  servicioId: number; // FK -> ServicioEstetica.id
  fechaServicio: Date;
  estilistaNombre: string; // CH-97: >= 3 caracteres
  costoEfectivo: number; // CH-96: >= 0.0
  observaciones: string | null;
}

// T-40: TarifaTemporada
export type TipoTemporadaTarifaTipo = 'base' | 'festivo' | 'alta_demanda';

export interface TarifaTemporada {
  id: number;
  servicioId: number; // FK -> ServicioEstetica.id
  tipoTemporada: TipoTemporadaTarifaTipo; // CH-98
  monto: number; // CH-99: >= 0.0
}

/**
 * Global Schema Registry integration metadata for GAP
 */
export const GAP_SCHEMA_REGISTRY = {
  version: '0.1.0',
  module: 'Guarderia y Peluqueria',
  tables: [
    'caniles',
    'reservas_guarderia',
    'servicios_estetica',
    'turnos_cuidadores',
    'registro_actividades',
    'dietas_especiales',
    'inspecciones_salud_ingreso',
    'control_pertenencias',
    'historial_estetica',
    'tarifas_temporada',
  ],
  relationships: [
    { from: 'reservas_guarderia.paciente_id', to: 'pacientes.id', type: 'many-to-one' },
    { from: 'reservas_guarderia.canil_id', to: 'caniles.id', type: 'many-to-one' },
    { from: 'registro_actividades.reserva_id', to: 'reservas_guarderia.id', type: 'many-to-one' },
    { from: 'registro_actividades.medicamento_insumo_id', to: 'medicamentos.id', type: 'many-to-one' },
    { from: 'dietas_especiales.paciente_id', to: 'pacientes.id', type: 'many-to-one' },
    { from: 'inspecciones_salud_ingreso.reserva_id', to: 'reservas_guarderia.id', type: 'many-to-one' },
    { from: 'control_pertenencias.reserva_id', to: 'reservas_guarderia.id', type: 'many-to-one' },
    { from: 'historial_estetica.paciente_id', to: 'pacientes.id', type: 'many-to-one' },
    { from: 'historial_estetica.servicio_id', to: 'servicios_estetica.id', type: 'many-to-one' },
    { from: 'tarifas_temporada.servicio_id', to: 'servicios_estetica.id', type: 'many-to-one' },
  ],
};
