-- =============================================================================
-- VetGuard L5 — Schema Completo y Unificado de Base de Datos
-- Archivo: schema_completo.sql
-- Ubicación: database/migrations/schema_completo.sql
-- Contiene todas las definiciones DDL consolidadas (Módulos HCC, ILM, FAP, GAP)
-- =============================================================================

-- ─────────────────────────────────────────────
-- MÓDULO 0: AUTENTICACIÓN
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- ─────────────────────────────────────────────
-- MÓDULO 1: HISTORIAL CLÍNICO CRÍTICO (HCC)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS veterinarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL UNIQUE,
    licencia_medica VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles_veterinarios (
    id SERIAL PRIMARY KEY,
    veterinario_id INT NOT NULL,
    rol VARCHAR(100) NOT NULL,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE CASCADE,
    CONSTRAINT check_rol_valido CHECK (rol IN ('general', 'cirujano', 'anestesista', 'hospitalizador'))
);

CREATE TABLE IF NOT EXISTS propietarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NULL,
    telefono VARCHAR(50) NOT NULL,
    CONSTRAINT check_email_valido CHECK (email IS NULL OR email LIKE '%@%.%'),
    CONSTRAINT check_telefono_longitud CHECK (LENGTH(telefono) >= 8),
    CONSTRAINT check_telefono_numerico CHECK (telefono ~ '^[0-9]+$')
);

CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    raza VARCHAR(100) NOT NULL,
    edad_meses INT NOT NULL,
    peso_kg DECIMAL(5,2) NOT NULL,
    propietario_id INT NOT NULL,
    FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE RESTRICT,
    CONSTRAINT check_edad_meses CHECK (edad_meses >= 0),
    CONSTRAINT check_peso_min CHECK (peso_kg > 0.0),
    CONSTRAINT check_peso_max CHECK (peso_kg <= 150.0),
    CONSTRAINT check_especie CHECK (especie IN ('canino', 'felino', 'exotico', 'equino'))
);

CREATE TABLE IF NOT EXISTS triajes (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    nivel_urgencia VARCHAR(50) NOT NULL,
    temperatura_c DECIMAL(4,2) NOT NULL,
    frecuencia_cardiaca INT NOT NULL,
    frecuencia_respiratoria INT NOT NULL,
    escala_dolor INT NOT NULL,
    tiempo_espera_minutos INT NOT NULL DEFAULT 0,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT check_nivel_urgencia CHECK (nivel_urgencia IN ('rojo', 'naranja', 'amarillo', 'verde', 'azul')),
    CONSTRAINT check_temperatura_min CHECK (temperatura_c >= 30.0),
    CONSTRAINT check_temperatura_max CHECK (temperatura_c <= 45.0),
    CONSTRAINT check_frecuencia_cardiaca_min CHECK (frecuencia_cardiaca >= 20),
    CONSTRAINT check_frecuencia_cardiaca_max CHECK (frecuencia_cardiaca <= 350),
    CONSTRAINT check_frecuencia_respiratoria_min CHECK (frecuencia_respiratoria >= 5),
    CONSTRAINT check_frecuencia_respiratoria_max CHECK (frecuencia_respiratoria <= 150),
    CONSTRAINT check_escala_dolor_min CHECK (escala_dolor >= 1),
    CONSTRAINT check_escala_dolor_max CHECK (escala_dolor <= 10)
);

CREATE TABLE IF NOT EXISTS historiales (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultas (
    id SERIAL PRIMARY KEY,
    historial_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    motivo TEXT NOT NULL,
    diagnostico TEXT,
    costo_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_consulta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (historial_id) REFERENCES historiales(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT check_costo_base_positivo CHECK (costo_base >= 0.0),
    CONSTRAINT check_motivo_no_vacio CHECK (LENGTH(TRIM(motivo)) >= 5)
);

CREATE TABLE IF NOT EXISTS cirugias (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    tipo_cirugia VARCHAR(100) NOT NULL,
    intervencion TEXT,
    consentimiento_firmado BOOLEAN NOT NULL DEFAULT FALSE,
    costo_adicional DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_cirugia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT check_tipo_cirugia CHECK (tipo_cirugia IN ('mayor', 'menor', 'emergencia', 'estetica')),
    CONSTRAINT check_costo_adicional_positivo CHECK (costo_adicional >= 0.0)
);

CREATE TABLE IF NOT EXISTS hospitalizaciones (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    sala_id INT NOT NULL,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_alta TIMESTAMP,
    costo_dia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo',
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT check_fechas_hospitalizacion CHECK (fecha_alta IS NULL OR fecha_alta >= fecha_ingreso),
    CONSTRAINT check_costo_dia_positivo CHECK (costo_dia >= 0.0),
    CONSTRAINT check_estado_hospitalizacion CHECK (estado IN ('activo', 'alta', 'fallecido'))
);

CREATE TABLE IF NOT EXISTS signos_vitales (
    id SERIAL PRIMARY KEY,
    hospitalizacion_id INT NOT NULL,
    saturacion_oxigeno INT NOT NULL,
    presion_arterial_sistolica INT NOT NULL,
    presion_arterial_diastolica INT NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospitalizacion_id) REFERENCES hospitalizaciones(id) ON DELETE CASCADE,
    CONSTRAINT check_saturacion_oxigeno_min CHECK (saturacion_oxigeno >= 50),
    CONSTRAINT check_saturacion_oxigeno_max CHECK (saturacion_oxigeno <= 100),
    CONSTRAINT check_presion_sistolica_min CHECK (presion_arterial_sistolica >= 50),
    CONSTRAINT check_presion_sistolica_max CHECK (presion_arterial_sistolica <= 250),
    CONSTRAINT check_presion_diastolica_min CHECK (presion_arterial_diastolica >= 30),
    CONSTRAINT check_presion_diastolica_max CHECK (presion_arterial_diastolica <= 180)
);

-- ─────────────────────────────────────────────
-- MÓDULO 2: INVENTARIO Y LOGÍSTICA DE MEDICAMENTOS (ILM)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medicamentos (
    id SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(255) NOT NULL,
    principio_activo VARCHAR(255) NOT NULL,
    forma_farmaceutica VARCHAR(100) NOT NULL DEFAULT 'inyectable',
    concentracion VARCHAR(100) NOT NULL DEFAULT '10%',
    requiere_receta BOOLEAN NOT NULL DEFAULT FALSE,
    stock_minimo INT NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    categoria_id INT,
    CONSTRAINT check_stock_minimo_positivo CHECK (stock_minimo >= 0),
    CONSTRAINT check_forma_farmaceutica CHECK (forma_farmaceutica IN ('comprimido', 'capsula', 'inyectable', 'liquido', 'topico'))
);

CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL UNIQUE,
    contacto_nombre VARCHAR(255) NOT NULL,
    contacto_email VARCHAR(255) NOT NULL,
    contacto_telefono VARCHAR(50) NOT NULL,
    CONSTRAINT check_email_proveedor CHECK (contacto_email LIKE '%@%.%'),
    CONSTRAINT check_telefono_proveedor CHECK (LENGTH(contacto_telefono) >= 8)
);

CREATE TABLE IF NOT EXISTS compras_inventario (
    id SERIAL PRIMARY KEY,
    proveedor_id INT NOT NULL,
    fecha_compra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    numero_factura VARCHAR(100) NOT NULL UNIQUE,
    monto_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
    CONSTRAINT check_monto_compra CHECK (monto_total >= 0.0)
);

CREATE TABLE IF NOT EXISTS detalle_compras (
    id SERIAL PRIMARY KEY,
    compra_id INT NOT NULL,
    medicamento_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras_inventario(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    CONSTRAINT check_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT check_precio_unitario_positivo CHECK (precio_unitario >= 0.0)
);

CREATE TABLE IF NOT EXISTS lotes (
    id SERIAL PRIMARY KEY,
    codigo_lote VARCHAR(100) NOT NULL UNIQUE,
    medicamento_id INT NOT NULL,
    compra_id INT NOT NULL,
    cantidad_inicial INT NOT NULL,
    cantidad_actual INT NOT NULL,
    precio_compra_unitario DECIMAL(10,2) NOT NULL,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'disponible',
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    FOREIGN KEY (compra_id) REFERENCES compras_inventario(id) ON DELETE RESTRICT,
    CONSTRAINT check_cantidad_inicial CHECK (cantidad_inicial > 0),
    CONSTRAINT check_cantidad_actual CHECK (cantidad_actual >= 0),
    CONSTRAINT check_cantidad_actual_max CHECK (cantidad_actual <= cantidad_inicial),
    CONSTRAINT check_precio_compra CHECK (precio_compra_unitario > 0.0),
    CONSTRAINT check_estado_lote CHECK (estado IN ('disponible', 'bloqueado', 'vencido'))
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    medicamento_id INT NOT NULL,
    lote_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    motivo TEXT,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE RESTRICT,
    CONSTRAINT check_tipo_movimiento CHECK (tipo IN ('compra', 'venta', 'merma', 'ajuste')),
    CONSTRAINT check_cantidad_movimiento CHECK (cantidad != 0)
);

CREATE TABLE IF NOT EXISTS recetas_retenidas (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL,
    medicamento_id INT NOT NULL,
    dosis TEXT NOT NULL,
    duracion_dias INT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'emitida',
    firma_veterinario VARCHAR(255) NOT NULL,
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    CONSTRAINT check_duracion_dias CHECK (duracion_dias >= 1 AND duracion_dias <= 365),
    CONSTRAINT check_estado_receta CHECK (estado IN ('emitida', 'despachada', 'vencida'))
);

CREATE TABLE IF NOT EXISTS despachos_medicamentos (
    id SERIAL PRIMARY KEY,
    receta_id INT NOT NULL,
    lote_id INT NOT NULL,
    cantidad_despachada INT NOT NULL,
    fecha_despacho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receta_id) REFERENCES recetas_retenidas(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE RESTRICT,
    CONSTRAINT check_cantidad_despachada CHECK (cantidad_despachada > 0)
);

CREATE TABLE IF NOT EXISTS alertas_stock (
    id SERIAL PRIMARY KEY,
    medicamento_id INT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_alerta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelta BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    CONSTRAINT check_tipo_alerta CHECK (tipo_alerta IN ('stock_bajo', 'vencimiento_proximo', 'vencido'))
);

-- ─────────────────────────────────────────────
-- MÓDULO 3: FACTURACIÓN Y PAGOS (FAP)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cajas_diarias (
    id SERIAL PRIMARY KEY,
    cajero_id INT NOT NULL,
    monto_apertura DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_cierre DECIMAL(10,2),
    estado VARCHAR(50) NOT NULL DEFAULT 'abierta',
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    CONSTRAINT check_monto_apertura CHECK (monto_apertura >= 0.0 AND monto_apertura <= 1000000.0),
    CONSTRAINT check_estado_caja CHECK (estado IN ('abierta', 'cerrada', 'arqueo_pendiente'))
);

CREATE TABLE IF NOT EXISTS arqueos_caja (
    id SERIAL PRIMARY KEY,
    caja_diaria_id INT NOT NULL,
    monto_declarado DECIMAL(10,2) NOT NULL,
    monto_sistema DECIMAL(10,2) NOT NULL,
    diferencia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_arqueo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_diaria_id) REFERENCES cajas_diarias(id) ON DELETE RESTRICT,
    CONSTRAINT check_monto_declarado CHECK (monto_declarado >= 0.0)
);

CREATE TABLE IF NOT EXISTS metodos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS comprobantes_fiscales (
    id SERIAL PRIMARY KEY,
    propietario_id INT NOT NULL,
    caja_diaria_id INT NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    folio_factura VARCHAR(100),
    monto_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'emitida',
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operador_id INT NOT NULL DEFAULT 0,
    operador_rol VARCHAR(50) NOT NULL DEFAULT 'administrador',
    FOREIGN KEY (caja_diaria_id) REFERENCES cajas_diarias(id) ON DELETE RESTRICT,
    CONSTRAINT check_tipo_documento CHECK (tipo_documento IN ('boleta', 'factura', 'nota_credito')),
    CONSTRAINT check_monto_total CHECK (monto_total >= 0.0),
    CONSTRAINT check_estado_comprobante CHECK (estado IN ('emitida', 'pagada', 'anulada'))
);

CREATE INDEX IF NOT EXISTS idx_comprobantes_operador ON comprobantes_fiscales(operador_id, operador_rol);

CREATE TABLE IF NOT EXISTS detalles_comprobantes (
    id SERIAL PRIMARY KEY,
    comprobante_id INT NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    cantidad_items INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_item DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    consulta_id INT,
    despacho_id INT,
    FOREIGN KEY (comprobante_id) REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    CONSTRAINT check_cantidad_items CHECK (cantidad_items > 0),
    CONSTRAINT check_precio_unitario CHECK (precio_unitario >= 0.0),
    CONSTRAINT check_descuento_item CHECK (descuento_item >= 0.0 AND descuento_item <= precio_unitario)
);

CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    boleta_id INT NOT NULL,
    metodo_pago_id INT NOT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boleta_id) REFERENCES comprobantes_fiscales(id) ON DELETE RESTRICT,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE RESTRICT,
    CONSTRAINT check_monto_pagado CHECK (monto_pagado > 0.0)
);

CREATE TABLE IF NOT EXISTS convenios_seguros (
    id SERIAL PRIMARY KEY,
    propietario_id INT NOT NULL,
    compania VARCHAR(255) NOT NULL,
    poliza_numero VARCHAR(100) NOT NULL,
    paciente_id INT,
    cobertura_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    cubre_cirugias BOOLEAN DEFAULT FALSE,
    cubre_medicamentos BOOLEAN DEFAULT FALSE,
    medicamentos_cobertura TEXT,
    cirugias_cobertura TEXT,
    CONSTRAINT check_poliza_longitud CHECK (LENGTH(poliza_numero) >= 5)
);

CREATE TABLE IF NOT EXISTS notas_credito (
    id SERIAL PRIMARY KEY,
    comprobante_original_id INT NOT NULL,
    comprobante_anulacion_id INT NOT NULL,
    motivo TEXT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comprobante_original_id) REFERENCES comprobantes_fiscales(id) ON DELETE RESTRICT,
    FOREIGN KEY (comprobante_anulacion_id) REFERENCES comprobantes_fiscales(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS descuentos_aplicados (
    id SERIAL PRIMARY KEY,
    boleta_id INT NOT NULL,
    motivo TEXT NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (boleta_id) REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    CONSTRAINT check_porcentaje CHECK (porcentaje >= 0.0 AND porcentaje <= 50.0)
);

CREATE TABLE IF NOT EXISTS bitacora_transacciones (
    id SERIAL PRIMARY KEY,
    caja_diaria_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    tipo_transaccion VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operador_id INT,
    operador_rol VARCHAR(50),
    FOREIGN KEY (caja_diaria_id) REFERENCES cajas_diarias(id) ON DELETE RESTRICT,
    CONSTRAINT check_tipo_transaccion CHECK (tipo_transaccion IN ('ingreso', 'egreso', 'ajuste'))
);

CREATE TABLE IF NOT EXISTS servicios_tarifas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    categoria VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    tarifa_base DECIMAL(10,2) NOT NULL,
    tarifa_max DECIMAL(10,2),
    notas TEXT
);

CREATE TABLE IF NOT EXISTS campanas_descuentos (
    id SERIAL PRIMARY KEY,
    motivo VARCHAR(255) NOT NULL UNIQUE,
    porcentaje DECIMAL(5,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_descuento VARCHAR(50) DEFAULT 'general',
    servicios_ids TEXT,
    medicamentos_ids TEXT
);

CREATE TABLE IF NOT EXISTS compromisos_pago (
    id SERIAL PRIMARY KEY,
    comprobante_id INT NOT NULL,
    monto_pendiente DECIMAL(10,2) NOT NULL,
    fecha_limite DATE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    FOREIGN KEY (comprobante_id) REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE
);

-- Trigger para arqueo ciego (FAP-05)
CREATE OR REPLACE FUNCTION process_cash_audit() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.diferencia <> 0 THEN
        INSERT INTO bitacora_transacciones (caja_diaria_id, descripcion, monto, tipo_transaccion, fecha_registro, operador_id, operador_rol)
        VALUES (NEW.caja_diaria_id, 'Diferencia de arqueo registrada', NEW.diferencia, 'ajuste', NOW(), 1, 'administrador');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_process_cash_audit ON arqueos_caja;
CREATE TRIGGER trg_process_cash_audit
BEFORE INSERT OR UPDATE ON arqueos_caja
FOR EACH ROW EXECUTE FUNCTION process_cash_audit();

-- ─────────────────────────────────────────────
-- MÓDULO 4: GUARDERÍA Y PELUQUERÍA (GAP)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS caniles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    capacidad_maxima INT NOT NULL DEFAULT 1,
    estado VARCHAR(50) NOT NULL DEFAULT 'libre',
    tipo_especie VARCHAR(10) NOT NULL DEFAULT 'canino',
    CONSTRAINT check_capacidad_maxima CHECK (capacidad_maxima >= 1 AND capacidad_maxima <= 50),
    CONSTRAINT check_canil_estado CHECK (estado IN ('libre', 'llena', 'mantenimiento')),
    CONSTRAINT check_canil_nombre_len CHECK (LENGTH(nombre) >= 3),
    CONSTRAINT check_canil_especie CHECK (tipo_especie IN ('canino', 'felino'))
);

CREATE TABLE IF NOT EXISTS reservas_guarderia (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    canil_id INT NOT NULL,
    fecha_checkin TIMESTAMP NOT NULL,
    fecha_checkout TIMESTAMP NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'reservada',
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (canil_id) REFERENCES caniles(id) ON DELETE RESTRICT,
    CONSTRAINT check_fecha_checkout_valida CHECK (fecha_checkout >= fecha_checkin),
    CONSTRAINT check_reserva_estado CHECK (estado IN ('reservada', 'activa', 'completada', 'cancelada')),
    CONSTRAINT check_costo_total CHECK (costo_total >= 0.0)
);

CREATE TABLE IF NOT EXISTS servicios_estetica (
    id SERIAL PRIMARY KEY,
    nombre_servicio VARCHAR(255) NOT NULL,
    duracion_estimada_minutos INT NOT NULL,
    CONSTRAINT check_duracion_servicio CHECK (duracion_estimada_minutos >= 15 AND duracion_estimada_minutos <= 180)
);

CREATE TABLE IF NOT EXISTS turnos_cuidadores (
    id SERIAL PRIMARY KEY,
    cuidador_nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL,
    fecha_turno DATE NOT NULL,
    turno_tipo VARCHAR(50) NOT NULL,
    CONSTRAINT check_turno_tipo CHECK (turno_tipo IN ('mañana', 'tarde', 'noche'))
);

CREATE TABLE IF NOT EXISTS registro_actividades (
    id SERIAL PRIMARY KEY,
    reserva_id INT NOT NULL,
    tipo_actividad VARCHAR(50) NOT NULL,
    hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT,
    medicamento_insumo_id INT,
    FOREIGN KEY (reserva_id) REFERENCES reservas_guarderia(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_insumo_id) REFERENCES medicamentos(id) ON DELETE SET NULL,
    CONSTRAINT check_tipo_actividad CHECK (tipo_actividad IN ('alimentacion', 'recreacion', 'medicacion', 'descanso')),
    CONSTRAINT check_hora_registro_no_nula CHECK (hora_registro IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS dietas_especiales (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    tipo_alimento VARCHAR(100) NOT NULL,
    porcion_gramos INT NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT check_porcion_gramos CHECK (porcion_gramos > 0),
    CONSTRAINT check_tipo_alimento CHECK (tipo_alimento IN ('seco', 'humedo', 'barf', 'prescrito'))
);

CREATE TABLE IF NOT EXISTS inspecciones_salud_ingreso (
    id SERIAL PRIMARY KEY,
    reserva_id INT NOT NULL,
    temperatura_ingreso DECIMAL(4,2) NOT NULL,
    peso_ingreso DECIMAL(5,2) NOT NULL,
    estado_general VARCHAR(50) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (reserva_id) REFERENCES reservas_guarderia(id) ON DELETE CASCADE,
    CONSTRAINT check_temperatura_ingreso_min CHECK (temperatura_ingreso >= 35.0),
    CONSTRAINT check_temperatura_ingreso_max CHECK (temperatura_ingreso <= 42.0),
    CONSTRAINT check_peso_ingreso_min CHECK (peso_ingreso > 0.0),
    CONSTRAINT check_peso_ingreso_max CHECK (peso_ingreso <= 150.0),
    CONSTRAINT check_estado_general CHECK (estado_general IN ('bueno', 'regular', 'critico'))
);

CREATE TABLE IF NOT EXISTS control_pertenencias (
    id SERIAL PRIMARY KEY,
    reserva_id INT NOT NULL,
    item_nombre VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    estado_recibido VARCHAR(50) NOT NULL DEFAULT 'bueno',
    FOREIGN KEY (reserva_id) REFERENCES reservas_guarderia(id) ON DELETE CASCADE,
    CONSTRAINT check_pertenencia_cantidad CHECK (cantidad > 0),
    CONSTRAINT check_estado_recibido CHECK (estado_recibido IN ('bueno', 'dañado', 'sucio'))
);

CREATE TABLE IF NOT EXISTS historial_estetica (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha_servicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estilista_nombre VARCHAR(255) NOT NULL,
    costo_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (servicio_id) REFERENCES servicios_estetica(id) ON DELETE RESTRICT,
    CONSTRAINT check_costo_efectivo CHECK (costo_efectivo >= 0.0),
    CONSTRAINT check_estilista_nombre_len CHECK (LENGTH(estilista_nombre) >= 3)
);

CREATE TABLE IF NOT EXISTS tarifas_temporada (
    id SERIAL PRIMARY KEY,
    servicio_id INT NOT NULL,
    tipo_temporada VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (servicio_id) REFERENCES servicios_estetica(id) ON DELETE CASCADE,
    CONSTRAINT check_tipo_temporada CHECK (tipo_temporada IN ('base', 'festivo', 'alta_demanda')),
    CONSTRAINT check_tarifa_monto CHECK (monto >= 0.0)
);

-- ─────────────────────────────────────────────
-- MÓDULO 5: AGENDA Y CITAS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS citas (
  id                      SERIAL PRIMARY KEY,
  propietario_id          INTEGER NOT NULL,
  paciente_id             INTEGER NOT NULL,
  tipo                    VARCHAR(20) NOT NULL CHECK (tipo IN ('clinica', 'domicilio')),
  fecha                   DATE NOT NULL,
  bloque                  VARCHAR(15) NOT NULL,
  motivo                  TEXT NOT NULL,
  estado                  VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                            CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
  veterinario_asignado_id INTEGER,
  motivo_cancelacion      TEXT,
  tarifa_estimada         INTEGER NOT NULL DEFAULT 12000,
  creada_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citas_fecha       ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_propietario ON citas(propietario_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado      ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_paciente    ON citas(paciente_id);
