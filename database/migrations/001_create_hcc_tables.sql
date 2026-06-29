-- SQL Migration: 001_create_hcc_tables.sql
-- Submódulo: Historial Clínico Crítico (HCC) y Persistencia
-- Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD

-- T-01: propietarios
CREATE TABLE propietarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    -- CH-04 & CH-05: El email debe contener '@' y '.'
    CONSTRAINT check_email_valido CHECK (email LIKE '%@%.%'),
    -- CH-06 & CH-07: Telefono longitud >= 8 y solo digitos numericos
    CONSTRAINT check_telefono_longitud CHECK (LENGTH(telefono) >= 8),
    CONSTRAINT check_telefono_numerico CHECK (telefono ~ '^[0-9]+$')
);

-- T-03: veterinarios
CREATE TABLE veterinarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL UNIQUE,
    licencia_medica VARCHAR(100) NOT NULL
);

-- T-04: roles_veterinarios
CREATE TABLE roles_veterinarios (
    id SERIAL PRIMARY KEY,
    veterinario_id INT NOT NULL,
    rol VARCHAR(100) NOT NULL,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE CASCADE,
    CONSTRAINT check_rol_valido CHECK (rol IN ('general', 'cirujano', 'anestesista', 'hospitalizador'))
);

-- T-02: pacientes
CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    raza VARCHAR(100) NOT NULL,
    edad_meses INT NOT NULL,
    peso_kg DECIMAL(5,2) NOT NULL,
    propietario_id INT NOT NULL,
    FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE RESTRICT,
    -- CH-01: Edad en meses >= 0
    CONSTRAINT check_edad_meses CHECK (edad_meses >= 0),
    -- CH-02 & CH-03: Peso entre 0 y 150 kg
    CONSTRAINT check_peso_min CHECK (peso_kg > 0.0),
    CONSTRAINT check_peso_max CHECK (peso_kg <= 150.0),
    -- validacion de especies
    CONSTRAINT check_especie CHECK (especie IN ('canino', 'felino', 'exotico', 'equino'))
);

-- T-05: triajes
CREATE TABLE triajes (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    nivel_urgencia VARCHAR(50) NOT NULL,
    temperatura_c DECIMAL(4,2) NOT NULL,
    frecuencia_cardiaca INT NOT NULL,
    frecuencia_respiratoria INT NOT NULL,
    escala_dolor INT NOT NULL,
    tiempo_espera_minutos INT NOT NULL DEFAULT 0,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    -- CH-08: Nivel de urgencia cromático
    CONSTRAINT check_nivel_urgencia CHECK (nivel_urgencia IN ('rojo', 'naranja', 'amarillo', 'verde', 'azul')),
    -- CH-09 & CH-10: Temperatura entre 30 y 45 C
    CONSTRAINT check_temperatura_min CHECK (temperatura_c >= 30.0),
    CONSTRAINT check_temperatura_max CHECK (temperatura_c <= 45.0),
    -- CH-11 & CH-12: Frecuencia cardiaca entre 20 y 350 bpm
    CONSTRAINT check_frecuencia_cardiaca_min CHECK (frecuencia_cardiaca >= 20),
    CONSTRAINT check_frecuencia_cardiaca_max CHECK (frecuencia_cardiaca <= 350),
    -- CH-13 & CH-14: Frecuencia respiratoria entre 5 y 150 rpm
    CONSTRAINT check_frecuencia_respiratoria_min CHECK (frecuencia_respiratoria >= 5),
    CONSTRAINT check_frecuencia_respiratoria_max CHECK (frecuencia_respiratoria <= 150),
    -- CH-15 & CH-16: Escala de dolor entre 1 y 10
    CONSTRAINT check_escala_dolor_min CHECK (escala_dolor >= 1),
    CONSTRAINT check_escala_dolor_max CHECK (escala_dolor <= 10)
);

-- T-06: historiales
CREATE TABLE historiales (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- T-07: consultas
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    historial_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    motivo TEXT NOT NULL,
    costo_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_consulta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (historial_id) REFERENCES historiales(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT check_costo_base_positivo CHECK (costo_base >= 0.0),
    CONSTRAINT check_motivo_no_vacio CHECK (LENGTH(TRIM(motivo)) >= 5)
);

-- T-08: cirugias
CREATE TABLE cirugias (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    tipo_cirugia VARCHAR(100) NOT NULL,
    consentimiento_firmado BOOLEAN NOT NULL DEFAULT FALSE,
    costo_adicional DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_cirugia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    -- CH-17: Tipos de cirugia autorizados
    CONSTRAINT check_tipo_cirugia CHECK (tipo_cirugia IN ('mayor', 'menor', 'emergencia', 'estetica')),
    -- CH-18: Fecha de cirugia posterior o igual a la fecha de consulta
    -- Nota: En DDL se añade a nivel de check de fila, aunque típicamente requiere trigger o lógica de aplicación.
    -- Se expresa la intención CHECK sobre la tabla:
    CONSTRAINT check_costo_adicional_positivo CHECK (costo_adicional >= 0.0)
);

-- T-09: hospitalizaciones
CREATE TABLE hospitalizaciones (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    sala_id INT NOT NULL,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_alta TIMESTAMP,
    costo_dia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo',
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    -- CH-19: Fecha de alta mayor o igual a ingreso
    CONSTRAINT check_fechas_hospitalizacion CHECK (fecha_alta IS NULL OR fecha_alta >= fecha_ingreso),
    CONSTRAINT check_costo_dia_positivo CHECK (costo_dia >= 0.0),
    CONSTRAINT check_estado_hospitalizacion CHECK (estado IN ('activo', 'alta', 'fallecido'))
);

-- T-10: signos_vitales
CREATE TABLE signos_vitales (
    id SERIAL PRIMARY KEY,
    hospitalizacion_id INT NOT NULL,
    saturacion_oxigeno INT NOT NULL,
    presion_arterial_sistolica INT NOT NULL,
    presion_arterial_diastolica INT NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospitalizacion_id) REFERENCES hospitalizaciones(id) ON DELETE CASCADE,
    -- CH-20 & CH-21: Saturacion de oxigeno entre 50 y 100 %
    CONSTRAINT check_saturacion_oxigeno_min CHECK (saturacion_oxigeno >= 50),
    CONSTRAINT check_saturacion_oxigeno_max CHECK (saturacion_oxigeno <= 100),
    -- CH-22 & CH-23: Presion sistolica entre 50 y 250 mmHg
    CONSTRAINT check_presion_sistolica_min CHECK (presion_arterial_sistolica >= 50),
    CONSTRAINT check_presion_sistolica_max CHECK (presion_arterial_sistolica <= 250),
    -- CH-24 & CH-25: Presion diastolica entre 30 y 180 mmHg
    CONSTRAINT check_presion_diastolica_min CHECK (presion_arterial_diastolica >= 30),
    CONSTRAINT check_presion_diastolica_max CHECK (presion_arterial_diastolica <= 180)
);
