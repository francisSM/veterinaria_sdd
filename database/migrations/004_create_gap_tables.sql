-- SQL Migration: 004_create_gap_tables.sql
-- Submódulo: Guardería y Peluquería (GAP)
-- Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD

-- T-31: caniles
CREATE TABLE caniles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    capacidad_maxima INT NOT NULL DEFAULT 1,
    estado VARCHAR(50) NOT NULL DEFAULT 'libre',
    -- CH-76 & CH-77: Capacidad maxima del canil (aforo)
    CONSTRAINT check_capacidad_maxima CHECK (capacidad_maxima >= 1 AND capacidad_maxima <= 50),
    -- CH-78: Estado del canil
    CONSTRAINT check_canil_estado CHECK (estado IN ('libre', 'llena', 'mantenimiento')),
    -- CH-79: Nombre del canil longitud minima
    CONSTRAINT check_canil_nombre_len CHECK (LENGTH(nombre) >= 3)
);

-- T-32: reservas_guarderia
CREATE TABLE reservas_guarderia (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL, -- FK -> pacientes (M1)
    canil_id INT NOT NULL, -- FK -> caniles
    fecha_checkin TIMESTAMP NOT NULL,
    fecha_checkout TIMESTAMP NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'reservada',
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (canil_id) REFERENCES caniles(id) ON DELETE RESTRICT,
    -- CH-80: Fecha checkout posterior a checkin
    CONSTRAINT check_fecha_checkout_valida CHECK (fecha_checkout >= fecha_checkin),
    -- CH-81: Estados de la reserva de guarderia
    CONSTRAINT check_reserva_estado CHECK (estado IN ('reservada', 'activa', 'completada', 'cancelada')),
    -- CH-82: Costo total positivo
    CONSTRAINT check_costo_total CHECK (costo_total >= 0.0)
);

-- T-33: servicios_estetica
CREATE TABLE servicios_estetica (
    id SERIAL PRIMARY KEY,
    nombre_servicio VARCHAR(255) NOT NULL,
    duracion_estimada_minutos INT NOT NULL,
    -- CH-94 & CH-95: Duracion estimada entre 15 y 180 minutos
    CONSTRAINT check_duracion_servicio CHECK (duracion_estimada_minutos >= 15 AND duracion_estimada_minutos <= 180)
);

-- T-34: turnos_cuidadores
CREATE TABLE turnos_cuidadores (
    id SERIAL PRIMARY KEY,
    cuidador_nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL,
    fecha_turno DATE NOT NULL,
    turno_tipo VARCHAR(50) NOT NULL,
    -- CH-100: Tipos de turnos de cuidadores
    CONSTRAINT check_turno_tipo CHECK (turno_tipo IN ('mañana', 'tarde', 'noche'))
);

-- T-35: registro_actividades
CREATE TABLE registro_actividades (
    id SERIAL PRIMARY KEY,
    reserva_id INT NOT NULL,
    tipo_actividad VARCHAR(50) NOT NULL,
    hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT,
    medicamento_insumo_id INT, -- FK logic -> medicamentos (M2) para registrar mermas o dosis
    FOREIGN KEY (reserva_id) REFERENCES reservas_guarderia(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_insumo_id) REFERENCES medicamentos(id) ON DELETE SET NULL,
    -- CH-88: Tipos de actividades permitidos
    CONSTRAINT check_tipo_actividad CHECK (tipo_actividad IN ('alimentacion', 'recreacion', 'medicacion', 'descanso')),
    -- CH-89: Hora registro obligatoria (por default en DDL)
    CONSTRAINT check_hora_registro_no_nula CHECK (hora_registro IS NOT NULL)
);

-- T-36: dietas_especiales
CREATE TABLE dietas_especiales (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL, -- FK -> pacientes (M1)
    tipo_alimento VARCHAR(100) NOT NULL,
    porcion_gramos INT NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    -- CH-90: Porcion en gramos positiva
    CONSTRAINT check_porcion_gramos CHECK (porcion_gramos > 0),
    -- CH-91: Tipos de alimentos permitidos
    CONSTRAINT check_tipo_alimento CHECK (tipo_alimento IN ('seco', 'humedo', 'barf', 'prescrito'))
);

-- T-37: inspecciones_salud_ingreso
CREATE TABLE inspecciones_salud_ingreso (
    id SERIAL PRIMARY KEY,
    reserva_id INT NOT NULL,
    temperatura_ingreso DECIMAL(4,2) NOT NULL,
    peso_ingreso DECIMAL(5,2) NOT NULL,
    estado_general VARCHAR(50) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (reserva_id) REFERENCES reservas_guarderia(id) ON DELETE CASCADE,
    -- CH-83 & CH-84: Temperatura de ingreso normal veterinaria
    CONSTRAINT check_temperatura_ingreso_min CHECK (temperatura_ingreso >= 35.0),
    CONSTRAINT check_temperatura_ingreso_max CHECK (temperatura_ingreso <= 42.0),
    -- CH-85 & CH-86: Peso en kg veterinario
    CONSTRAINT check_peso_ingreso_min CHECK (peso_ingreso > 0.0),
    CONSTRAINT check_peso_ingreso_max CHECK (peso_ingreso <= 150.0),
    -- CH-87: Estados generales de salud
    CONSTRAINT check_estado_general CHECK (estado_general IN ('bueno', 'regular', 'critico'))
);

-- T-38: control_pertenencias
CREATE TABLE control_pertenencias (
    id SERIAL PRIMARY KEY,
    reserva_id INT NOT NULL,
    item_nombre VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    estado_recibido VARCHAR(50) NOT NULL DEFAULT 'bueno',
    FOREIGN KEY (reserva_id) REFERENCES reservas_guarderia(id) ON DELETE CASCADE,
    -- CH-92: Cantidad positiva
    CONSTRAINT check_pertenencia_cantidad CHECK (cantidad > 0),
    -- CH-93: Estados de pertenencias
    CONSTRAINT check_estado_recibido CHECK (estado_recibido IN ('bueno', 'dañado', 'sucio'))
);

-- T-39: historial_estetica
CREATE TABLE historial_estetica (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL, -- FK -> pacientes (M1)
    servicio_id INT NOT NULL, -- FK -> servicios_estetica
    fecha_servicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estilista_nombre VARCHAR(255) NOT NULL,
    costo_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (servicio_id) REFERENCES servicios_estetica(id) ON DELETE RESTRICT,
    -- CH-96: Costo efectivo positivo
    CONSTRAINT check_costo_efectivo CHECK (costo_efectivo >= 0.0),
    -- CH-97: Estilista nombre longitud minima
    CONSTRAINT check_estilista_nombre_len CHECK (LENGTH(estilista_nombre) >= 3)
);

-- T-40: tarifas_temporada
CREATE TABLE tarifas_temporada (
    id SERIAL PRIMARY KEY,
    servicio_id INT NOT NULL,
    tipo_temporada VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (servicio_id) REFERENCES servicios_estetica(id) ON DELETE CASCADE,
    -- CH-98: Tipos de temporada permitidos
    CONSTRAINT check_tipo_temporada CHECK (tipo_temporada IN ('base', 'festivo', 'alta_demanda')),
    -- CH-99: Monto positivo
    CONSTRAINT check_tarifa_monto CHECK (monto >= 0.0)
);
