-- SQL Migration: 003_create_fap_tables.sql
-- Submódulo: Facturación y Pagos (FAP)
-- Autor: Ingeniero de Plataforma de la Fábrica ARNES/SDD

-- T-21: cajas_diarias
CREATE TABLE cajas_diarias (
    id SERIAL PRIMARY KEY,
    cajero_id INT NOT NULL, -- FK logic / ID del usuario
    monto_apertura DECIMAL(10,2) NOT NULL,
    monto_cierre DECIMAL(10,2),
    estado VARCHAR(50) NOT NULL DEFAULT 'abierta',
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    -- CH-51 & CH-52: Monto apertura entre 0 y 1000000
    CONSTRAINT check_monto_apertura CHECK (monto_apertura >= 0.0 AND monto_apertura <= 1000000.0),
    -- CH-53: Monto cierre positivo
    CONSTRAINT check_monto_cierre CHECK (monto_cierre IS NULL OR monto_cierre >= 0.0),
    -- CH-54: Estado de caja
    CONSTRAINT check_caja_estado CHECK (estado IN ('abierta', 'cerrada', 'auditada')),
    -- CH-70: Fecha cierre >= fecha apertura
    CONSTRAINT check_fecha_cierre CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_apertura)
);

-- T-22: arqueos_caja
CREATE TABLE arqueos_caja (
    id SERIAL PRIMARY KEY,
    caja_diaria_id INT NOT NULL,
    monto_fisico DECIMAL(10,2) NOT NULL,
    balance_sistema DECIMAL(10,2) NOT NULL,
    diferencia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tipo_arqueo VARCHAR(50) NOT NULL,
    comentario_supervisor TEXT,
    fecha_arqueo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_diaria_id) REFERENCES cajas_diarias(id) ON DELETE RESTRICT,
    -- CH-55: Monto físico positivo
    CONSTRAINT check_monto_fisico CHECK (monto_fisico >= 0.0),
    -- CH-71: Tipos de arqueos permitidos
    CONSTRAINT check_tipo_arqueo CHECK (tipo_arqueo IN ('apertura', 'cierre', 'auditoria'))
);

-- T-23: metodos_pago
CREATE TABLE metodos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    -- CH-63: Métodos de pago permitidos
    CONSTRAINT check_metodo_pago_codigo CHECK (codigo IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'seguro'))
);

-- T-24: comprobantes_fiscales (boletas_facturas)
CREATE TABLE comprobantes_fiscales (
    id SERIAL PRIMARY KEY,
    propietario_id INT NOT NULL, -- FK -> propietarios de M1
    caja_diaria_id INT NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    folio_factura VARCHAR(100),
    monto_total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'emitida',
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (caja_diaria_id) REFERENCES cajas_diarias(id) ON DELETE RESTRICT,
    -- CH-59: Tipos de comprobantes permitidos
    CONSTRAINT check_tipo_documento CHECK (tipo_documento IN ('boleta', 'factura', 'nota_credito')),
    -- CH-60: Monto total positivo
    CONSTRAINT check_monto_total_comprobante CHECK (monto_total >= 0.0),
    -- CH-72: Estado comprobante
    CONSTRAINT check_comprobante_estado CHECK (estado IN ('emitida', 'pagada', 'anulada'))
);

-- T-25: detalles_comprobantes (detalle_boleta)
CREATE TABLE detalles_comprobantes (
    id SERIAL PRIMARY KEY,
    comprobante_id INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad_items INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_item DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    consulta_id INT, -- FK logic -> consulta opcional
    despacho_id INT, -- FK logic -> despacho opcional
    FOREIGN KEY (comprobante_id) REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    FOREIGN KEY (despacho_id) REFERENCES despachos_medicamentos(id) ON DELETE SET NULL,
    -- CH-61: Cantidad mayor a 0
    CONSTRAINT check_cantidad_items CHECK (cantidad_items > 0),
    -- CH-62: Precio unitario positivo
    CONSTRAINT check_precio_unitario CHECK (precio_unitario >= 0.0),
    -- CH-73 & CH-74: Descuento unitario válido
    CONSTRAINT check_descuento_item CHECK (descuento_item >= 0.0 AND descuento_item <= precio_unitario)
);

-- T-26: pagos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    boleta_id INT NOT NULL,
    metodo_pago_id INT NOT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boleta_id) REFERENCES comprobantes_fiscales(id) ON DELETE RESTRICT,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE RESTRICT,
    -- CH-64: Monto pagado > 0
    CONSTRAINT check_monto_pagado CHECK (monto_pagado > 0.0),
    -- CH-73: Fecha de pago <= actual
    CONSTRAINT check_fecha_pago CHECK (fecha_pago <= CURRENT_TIMESTAMP)
);

-- T-27: convenios_seguros (seguros_mascotas)
CREATE TABLE convenios_seguros (
    id SERIAL PRIMARY KEY,
    propietario_id INT NOT NULL, -- FK -> propietarios de M1
    compania VARCHAR(100) NOT NULL,
    poliza_numero VARCHAR(100) NOT NULL,
    FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE RESTRICT,
    -- CH-65: Numero de poliza longitud >= 5
    CONSTRAINT check_poliza_numero_len CHECK (LENGTH(poliza_numero) >= 5)
);

-- T-28: notas_credito
CREATE TABLE notas_credito (
    id SERIAL PRIMARY KEY,
    comprobante_original_id INT NOT NULL,
    comprobante_anulacion_id INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comprobante_original_id) REFERENCES comprobantes_fiscales(id) ON DELETE RESTRICT,
    FOREIGN KEY (comprobante_anulacion_id) REFERENCES comprobantes_fiscales(id) ON DELETE RESTRICT
);

-- T-29: descuentos_aplicados
CREATE TABLE descuentos_aplicados (
    id SERIAL PRIMARY KEY,
    boleta_id INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (boleta_id) REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    -- CH-68 & CH-69: Porcentaje entre 0 y 50%
    CONSTRAINT check_porcentaje_descuento CHECK (porcentaje >= 0.0 AND porcentaje <= 50.0)
);

-- T-30: bitacora_transacciones
CREATE TABLE bitacora_transacciones (
    id SERIAL PRIMARY KEY,
    caja_diaria_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    tipo_transaccion VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_diaria_id) REFERENCES cajas_diarias(id) ON DELETE RESTRICT,
    CONSTRAINT check_tipo_transaccion CHECK (tipo_transaccion IN ('ingreso', 'egreso', 'ajuste'))
);


-- =========================================================================
-- LOGICA DE ARQUEO CIEGO:
-- Trigger para autocalcular diferencias y validar comentarios
-- =========================================================================

CREATE OR REPLACE FUNCTION process_cash_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Autocalcular diferencia
    NEW.diferencia := NEW.monto_fisico - NEW.balance_sistema;
    
    -- CH-75: Exigir comentario si hay diferencias detectadas en el arqueo
    IF NEW.diferencia != 0.00 AND (NEW.comentario_supervisor IS NULL OR LENGTH(TRIM(NEW.comentario_supervisor)) < 5) THEN
        RAISE EXCEPTION 'Control de Arqueo: Se requiere un comentario de supervisor descriptivo (minimo 5 caracteres) para registrar diferencias de caja';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_cash_audit
BEFORE INSERT OR UPDATE ON arqueos_caja
FOR EACH ROW EXECUTE FUNCTION process_cash_audit();
