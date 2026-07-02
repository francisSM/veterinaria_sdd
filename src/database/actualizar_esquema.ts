import { Pool } from 'pg';

const PG_CONFIG = {
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'veterinaria_sdd'
};

async function main() {
  const pool = new Pool(PG_CONFIG);
  console.log('[SCHEMA] Conectando a PostgreSQL para verificar y agregar columnas de auditoría de caja...');
  try {
    await pool.query(`
      ALTER TABLE comprobantes_fiscales 
      ADD COLUMN IF NOT EXISTS operador_id INT,
      ADD COLUMN IF NOT EXISTS operador_rol VARCHAR(50);
      
      ALTER TABLE bitacora_transacciones 
      ADD COLUMN IF NOT EXISTS operador_id INT,
      ADD COLUMN IF NOT EXISTS operador_rol VARCHAR(50);

      -- 1. Tabla servicios_tarifas
      CREATE TABLE IF NOT EXISTS servicios_tarifas (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL UNIQUE,
          categoria VARCHAR(100) NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          tarifa_base DECIMAL(10,2) NOT NULL,
          tarifa_max DECIMAL(10,2),
          notas TEXT
      );

      -- 2. Tabla campanas_descuentos
      CREATE TABLE IF NOT EXISTS campanas_descuentos (
          id SERIAL PRIMARY KEY,
          motivo VARCHAR(255) NOT NULL UNIQUE,
          porcentaje DECIMAL(5,2) NOT NULL,
          activo BOOLEAN NOT NULL DEFAULT TRUE,
          tipo_descuento VARCHAR(50) DEFAULT 'general',
          servicios_ids TEXT,
          medicamentos_ids TEXT
      );

      ALTER TABLE campanas_descuentos 
      ADD COLUMN IF NOT EXISTS tipo_descuento VARCHAR(50) DEFAULT 'general',
      ADD COLUMN IF NOT EXISTS servicios_ids TEXT,
      ADD COLUMN IF NOT EXISTS medicamentos_ids TEXT;

      -- 3. Tabla compromisos_pago
      CREATE TABLE IF NOT EXISTS compromisos_pago (
          id SERIAL PRIMARY KEY,
          comprobante_id INT NOT NULL,
          monto_pendiente DECIMAL(10,2) NOT NULL,
          fecha_limite DATE NOT NULL,
          estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
          FOREIGN KEY (comprobante_id) REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE
      );

      -- 4. Columnas en convenios_seguros
      ALTER TABLE convenios_seguros 
      ADD COLUMN IF NOT EXISTS paciente_id INT,
      ADD COLUMN IF NOT EXISTS cobertura_porcentaje DECIMAL(5,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS cubre_cirugias BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS cubre_medicamentos BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS medicamentos_cobertura TEXT,
      ADD COLUMN IF NOT EXISTS cirugias_cobertura TEXT;
    `);
    console.log('[SCHEMA] Esquema actualizado con éxito: se añadieron tablas de tarifas, campañas, compromisos y columnas de seguros.');
  } catch (err: any) {
    console.error('[SCHEMA] Error al actualizar esquema:', err.message);
  } finally {
    await pool.end();
  }
}

main();
