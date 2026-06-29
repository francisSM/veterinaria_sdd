-- SQL Migration: 002_create_ilm_tables.sql
-- Submódulo: Inventario y Logística de Medicamentos (ILM)
-- Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD

-- T-11: categorias_insumos
CREATE TABLE categorias_insumos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    -- CH-41: Categorías permitidas
    CONSTRAINT check_categoria_nombre CHECK (nombre IN ('antibiotico', 'analgesico', 'anestesico', 'vacuna', 'desparasitante', 'psicotropico'))
);

-- T-12: medicamentos
CREATE TABLE medicamentos (
    id SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(255) NOT NULL,
    principio_activo VARCHAR(255) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock_minimo INT NOT NULL DEFAULT 0,
    categoria_id INT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias_insumos(id) ON DELETE RESTRICT,
    -- CH-26: Precio de venta positivo
    CONSTRAINT check_precio_venta CHECK (precio_venta >= 0.0),
    -- CH-27: Stock mínimo positivo
    CONSTRAINT check_stock_minimo CHECK (stock_minimo >= 0),
    -- CH-49 & CH-50: Longitud mínima de nombres
    CONSTRAINT check_nombre_comercial_len CHECK (LENGTH(nombre_comercial) >= 3),
    CONSTRAINT check_principio_activo_len CHECK (LENGTH(principio_activo) >= 3)
);

-- T-13: proveedores
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    rut VARCHAR(50) NOT NULL UNIQUE,
    -- CH-45: RUT del proveedor
    CONSTRAINT check_proveedor_rut_len CHECK (LENGTH(rut) >= 9)
);

-- T-14: compras_inventario
CREATE TABLE compras_inventario (
    id SERIAL PRIMARY KEY,
    proveedor_id INT NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    fecha_compra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
    -- CH-40: Monto total compra >= 0
    CONSTRAINT check_monto_total_compra CHECK (monto_total >= 0.0)
);

-- T-14b: detalle_compras
CREATE TABLE detalle_compras (
    id SERIAL PRIMARY KEY,
    compra_id INT NOT NULL,
    medicamento_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras_inventario(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    CONSTRAINT check_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT check_detalle_precio CHECK (precio_unitario > 0.0)
);

-- T-15: lotes
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    codigo_lote VARCHAR(100) NOT NULL UNIQUE,
    medicamento_id INT NOT NULL,
    compra_id INT NOT NULL,
    cantidad_inicial INT NOT NULL,
    cantidad_actual INT NOT NULL,
    precio_compra_unitario DECIMAL(10,2) NOT NULL,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'disponible',
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    FOREIGN KEY (compra_id) REFERENCES compras_inventario(id) ON DELETE RESTRICT,
    -- CH-28: Cantidad inicial > 0
    CONSTRAINT check_cantidad_inicial CHECK (cantidad_inicial > 0),
    -- CH-29: Cantidad actual >= 0
    CONSTRAINT check_cantidad_actual CHECK (cantidad_actual >= 0),
    -- CH-30: Cantidad actual <= cantidad inicial
    CONSTRAINT check_cantidad_actual_limite CHECK (cantidad_actual <= cantidad_inicial),
    -- CH-31: Fecha vencimiento posterior a ingreso
    CONSTRAINT check_fecha_vencimiento CHECK (fecha_vencimiento > fecha_ingreso),
    -- CH-32: Estado del lote
    CONSTRAINT check_lote_estado CHECK (estado IN ('disponible', 'bloqueado', 'vencido')),
    -- CH-42: Precio compra unitario > 0
    CONSTRAINT check_precio_compra_unitario CHECK (precio_compra_unitario > 0.0)
);

-- T-16: movimientos_inventario
CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    medicamento_id INT NOT NULL,
    lote_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE RESTRICT,
    -- CH-33: Tipos de movimientos autorizados
    CONSTRAINT check_tipo_movimiento CHECK (tipo IN ('compra', 'venta', 'merma', 'ajuste')),
    -- CH-34: Cantidad distinta de 0
    CONSTRAINT check_movimiento_cantidad CHECK (cantidad != 0),
    -- CH-47: Si es merma o ajuste, el motivo no debe ser nulo o vacío
    CONSTRAINT check_motivo_movimiento CHECK (tipo NOT IN ('merma', 'ajuste') OR (motivo IS NOT NULL AND LENGTH(TRIM(motivo)) >= 5))
);

-- T-17: recetas_retenidas
CREATE TABLE recetas_retenidas (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL, -- FK -> consultas de M1
    medicamento_id INT NOT NULL,
    dosis VARCHAR(255) NOT NULL,
    duracion_dias INT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'emitida',
    firma_veterinario VARCHAR(255) NOT NULL,
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    -- CH-35: Dosis longitud >= 2
    CONSTRAINT check_receta_dosis_len CHECK (LENGTH(dosis) >= 2),
    -- CH-43 & CH-44: Duracion entre 1 y 365 dias
    CONSTRAINT check_receta_duracion_min CHECK (duracion_dias >= 1),
    CONSTRAINT check_receta_duracion_max CHECK (duracion_dias <= 365),
    -- Estado de la receta
    CONSTRAINT check_receta_estado CHECK (estado IN ('emitida', 'despachada', 'vencida'))
);

-- T-18: despachos_medicamentos
CREATE TABLE despachos_medicamentos (
    id SERIAL PRIMARY KEY,
    receta_id INT NOT NULL,
    lote_id INT NOT NULL,
    cantidad_despachada INT NOT NULL,
    fecha_despacho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receta_id) REFERENCES recetas_retenidas(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE RESTRICT,
    -- CH-36: Cantidad despachada > 0
    CONSTRAINT check_cantidad_despachada CHECK (cantidad_despachada > 0),
    -- CH-48: Fecha despacho <= fecha actual
    CONSTRAINT check_fecha_despacho CHECK (fecha_despacho <= CURRENT_TIMESTAMP)
);

-- T-19: alertas_stock
CREATE TABLE alertas_stock (
    id SERIAL PRIMARY KEY,
    medicamento_id INT NOT NULL,
    nivel_alerta VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    -- CH-37: Nivel de alerta
    CONSTRAINT check_nivel_alerta CHECK (nivel_alerta IN ('bajo', 'critico')),
    -- CH-46: Fecha de creacion <= fecha actual
    CONSTRAINT check_alerta_fecha CHECK (fecha_creacion <= CURRENT_TIMESTAMP)
);


-- =========================================================================
-- LOGICA FEFO (First Expired, First Out) Y COMPROBACION DE VENCIMIENTO
-- Trigger para impedir despacho de lotes vencidos o bloqueados
-- =========================================================================

CREATE OR REPLACE FUNCTION check_fefo_dispatch()
RETURNS TRIGGER AS $$
DECLARE
    vencimiento TIMESTAMP;
    estado_lote VARCHAR;
BEGIN
    -- Recupera la fecha de vencimiento y estado del lote
    SELECT fecha_vencimiento, estado INTO vencimiento, estado_lote
    FROM lotes WHERE id = NEW.lote_id;
    
    -- Validar disponibilidad del lote
    IF estado_lote != 'disponible' THEN
        RAISE EXCEPTION 'No se puede despachar: El lote no esta disponible (Estado: %)', estado_lote;
    END IF;
    
    -- Validar regla FEFO / Vencimiento
    IF vencimiento < NEW.fecha_despacho THEN
        RAISE EXCEPTION 'Violacion de regla FEFO: El lote % expiro en % y el despacho es en %', NEW.lote_id, vencimiento, NEW.fecha_despacho;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_fefo_dispatch
BEFORE INSERT OR UPDATE ON despachos_medicamentos
FOR EACH ROW EXECUTE FUNCTION check_fefo_dispatch();
