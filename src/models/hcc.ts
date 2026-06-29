/**
 * TypeScript Backend Models & Interfaces
 * Submódulo: Historial Clínico Crítico (HCC) y Persistencia
 * Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD
 *
 * Mapeo uno a uno con el esquema relacional DDL (T-01 a T-10)
 * y validaciones de la rúbrica (CH-01 a CH-25).
 */

// T-01: Propietario
export interface Propietario {
  id: number;
  nombre: string;
  rut: string; // UNIQUE
  email: string; // CH-04, CH-05: debe contener '@' y '.'
  telefono: string; // CH-06, CH-07: >= 8 caracteres, solo dígitos
}

// T-03: Veterinario
export interface Veterinario {
  id: number;
  nombre: string;
  rut: string; // UNIQUE
  licenciaMedica: string;
}

// T-04: RolVeterinario
export type RolVeterinarioTipo = 'general' | 'cirujano' | 'anestesista' | 'hospitalizador';

export interface RolVeterinario {
  id: number;
  veterinarioId: number; // FK -> Veterinario.id
  rol: RolVeterinarioTipo;
}

// T-02: Paciente
export type EspecieTipo = 'canino' | 'felino' | 'exotico' | 'equino';

export interface Paciente {
  id: number;
  nombre: string;
  especie: EspecieTipo;
  raza: string;
  edadMeses: number; // CH-01: >= 0
  pesoKg: number; // CH-02, CH-03: > 0.0 y <= 150.0
  propietarioId: number; // FK -> Propietario.id
}

// T-05: Triaje
export type NivelUrgenciaTipo = 'rojo' | 'naranja' | 'amarillo' | 'verde' | 'azul';

export interface Triaje {
  id: number;
  pacienteId: number; // FK -> Paciente.id
  veterinarioId: number; // FK -> Veterinario.id
  nivelUrgencia: NivelUrgenciaTipo; // CH-08
  temperaturaC: number; // CH-09, CH-10: >= 30.0 y <= 45.0
  frecuenciaCardiaca: number; // CH-11, CH-12: >= 20 y <= 350
  frecuenciaRespiratoria: number; // CH-13, CH-14: >= 5 y <= 150
  escalaDolor: number; // CH-15, CH-16: >= 1 y <= 10
  tiempoEsperaMinutos: number; // >= 0
}

// T-06: Historial
export interface Historial {
  id: number;
  pacienteId: number; // FK -> Paciente.id, UNIQUE
  fechaCreacion: Date;
}

// T-07: Consulta
export interface Consulta {
  id: number;
  historialId: number; // FK -> Historial.id
  veterinarioId: number; // FK -> Veterinario.id
  motivo: string; // longitud >= 5
  costoBase: number; // >= 0.0
  fechaConsulta: Date;
}

// T-08: Cirugia
export type TipoCirugiaTipo = 'mayor' | 'menor' | 'emergencia' | 'estetica';

export interface Cirugia {
  id: number;
  consultaId: number; // FK -> Consulta.id
  veterinarioId: number; // FK -> Veterinario.id
  tipoCirugia: TipoCirugiaTipo; // CH-17
  consentimientoFirmado: boolean;
  costoAdicional: number; // >= 0.0
  fechaCirugia: Date; // CH-18: >= Consulta.fechaConsulta
}

// T-09: Hospitalizacion
export type EstadoHospitalizacionTipo = 'activo' | 'alta' | 'fallecido';

export interface Hospitalizacion {
  id: number;
  pacienteId: number; // FK -> Paciente.id
  salaId: number;
  fechaIngreso: Date;
  fechaAlta: Date | null; // CH-19: fechaAlta >= fechaIngreso
  costoDia: number; // >= 0.0
  estado: EstadoHospitalizacionTipo;
}

// T-10: SignosVitales
export interface SignosVitales {
  id: number;
  hospitalizacionId: number; // FK -> Hospitalizacion.id
  saturacionOxigeno: number; // CH-20, CH-21: >= 50 y <= 100
  presionArterialSistolica: number; // CH-22, CH-23: >= 50 y <= 250
  presionArterialDiastolica: number; // CH-24, CH-25: >= 30 y <= 180
  fechaRegistro: Date;
}

/**
 * Global Schema Registry integration metadata
 */
export const HCC_SCHEMA_REGISTRY = {
  version: '0.1.0',
  module: 'Historial Clinico Critico',
  tables: [
    'propietarios',
    'pacientes',
    'veterinarios',
    'roles_veterinarios',
    'triajes',
    'historiales',
    'consultas',
    'cirugias',
    'hospitalizaciones',
    'signos_vitales',
  ],
  relationships: [
    { from: 'pacientes.propietario_id', to: 'propietarios.id', type: 'many-to-one' },
    { from: 'roles_veterinarios.veterinario_id', to: 'veterinarios.id', type: 'many-to-one' },
    { from: 'triajes.paciente_id', to: 'pacientes.id', type: 'many-to-one' },
    { from: 'triajes.veterinario_id', to: 'veterinarios.id', type: 'many-to-one' },
    { from: 'historiales.paciente_id', to: 'pacientes.id', type: 'one-to-one' },
    { from: 'consultas.historial_id', to: 'historiales.id', type: 'many-to-one' },
    { from: 'consultas.veterinario_id', to: 'veterinarios.id', type: 'many-to-one' },
    { from: 'cirugias.consulta_id', to: 'consultas.id', type: 'many-to-one' },
    { from: 'cirugias.veterinario_id', to: 'veterinarios.id', type: 'many-to-one' },
    { from: 'hospitalizaciones.paciente_id', to: 'pacientes.id', type: 'many-to-one' },
    { from: 'signos_vitales.hospitalizacion_id', to: 'hospitalizaciones.id', type: 'many-to-one' },
  ],
};
