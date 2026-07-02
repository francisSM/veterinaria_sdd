import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

// Import references from modules to sync them with PostgreSQL tables
import { usuariosDB } from '../middleware/auth';
import {
  propietariosDB,
  pacientesDB,
  triajesDB,
  historialesDB,
  consultasDB,
  cirugiasDB,
  hospitalizacionesDB,
  signosVitalesDB,
  veterinariosDB,
  citasDB,
  consentimientosDB
} from '../controllers/clinica.controller';
import {
  medicamentosDB,
  proveedoresDB,
  comprasDB,
  detallesCompraDB,
  lotesDB,
  movimientosDB,
  recetasDB,
  despachosDB,
  alertasDB
} from '../controllers/inventario.controller';
import {
  cajasDB,
  arqueosDB,
  comprobantesDB,
  detallesComprobantesDB,
  pagosDB,
  conveniosDB,
  bitacoraDB,
  notasCreditoDB,
  tarifasDB,
  campanasDB,
  compromisosDB,
  metodosPagoDB
} from '../controllers/finanzas.controller';
import {
  canilesDB,
  reservasGuarderiaDB,
  serviciosEsteticaDB,
  turnosCuidadoresDB,
  registroActividadesDB,
  dietasEspecialesDB,
  inspeccionesDB,
  pertenenciasDB,
  historialEsteticaDB
} from '../controllers/servicios.controller';

// PostgreSQL configuration parameters for our dedicated database with environment variable fallbacks
const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'veterinaria_sdd'
};

export let appPool: Pool;
export const getPool = () => appPool;

// Registry helper mapping memory arrays to PostgreSQL table names
interface DatabaseRegistry {
  name: string;      // table name in SQL (snake_case)
  ref: any[];        // memory array reference
}

const dbs: DatabaseRegistry[] = [
  { name: 'usuarios', ref: usuariosDB },
  { name: 'propietarios', ref: propietariosDB },
  { name: 'veterinarios', ref: veterinariosDB },
  { name: 'roles_veterinarios', ref: [] }, // Roles_veterinarios is managed in auth/vet creation
  { name: 'pacientes', ref: pacientesDB },
  { name: 'historiales', ref: historialesDB },
  { name: 'consultas', ref: consultasDB },
  { name: 'triajes', ref: triajesDB },
  { name: 'cirugias', ref: cirugiasDB },
  { name: 'hospitalizaciones', ref: hospitalizacionesDB },
  { name: 'signos_vitales', ref: signosVitalesDB },
  { name: 'medicamentos', ref: medicamentosDB },
  { name: 'proveedores', ref: proveedoresDB },
  { name: 'compras_inventario', ref: comprasDB },
  { name: 'detalle_compras', ref: detallesCompraDB },
  { name: 'lotes', ref: lotesDB },
  { name: 'movimientos_inventario', ref: movimientosDB },
  { name: 'recetas_retenidas', ref: recetasDB },
  { name: 'despachos_medicamentos', ref: despachosDB },
  { name: 'alertas_stock', ref: alertasDB },
  { name: 'cajas_diarias', ref: cajasDB },
  { name: 'arqueos_caja', ref: arqueosDB },
  { name: 'comprobantes_fiscales', ref: comprobantesDB },
  { name: 'detalles_comprobantes', ref: detallesComprobantesDB },
  { name: 'metodos_pago', ref: metodosPagoDB },
  { name: 'pagos', ref: pagosDB },
  { name: 'convenios_seguros', ref: conveniosDB },
  { name: 'bitacora_transacciones', ref: bitacoraDB },
  { name: 'notas_credito', ref: notasCreditoDB },
  { name: 'servicios_tarifas', ref: tarifasDB },
  { name: 'campanas_descuentos', ref: campanasDB },
  { name: 'compromisos_pago', ref: compromisosDB },
  { name: 'caniles', ref: canilesDB },
  { name: 'reservas_guarderia', ref: reservasGuarderiaDB },
  { name: 'servicios_estetica', ref: serviciosEsteticaDB },
  { name: 'turnos_cuidadores', ref: turnosCuidadoresDB },
  { name: 'registro_actividades', ref: registroActividadesDB },
  { name: 'dietas_especiales', ref: dietasEspecialesDB },
  { name: 'inspecciones_salud_ingreso', ref: inspeccionesDB },
  { name: 'control_pertenencias', ref: pertenenciasDB },
  { name: 'historial_estetica', ref: historialEsteticaDB },
  { name: 'citas', ref: citasDB },
  { name: 'consentimientos', ref: consentimientosDB }
];

// Utility functions to map camelCase (JS) to snake_case (SQL) and back
const toCamel = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  const res: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    res[camelKey] = obj[key];
  }
  return res;
};

const toSnake = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  const res: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    res[snakeKey] = obj[key];
  }
  return res;
};

// Check if a table exists in the PostgreSQL schema
const checkTableExists = async (pool: Pool, tableName: string): Promise<boolean> => {
  const queryText = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `;
  const res = await pool.query(queryText, [tableName]);
  return res.rows[0].exists;
};

// Execute all migrations to set up the DB schema
const runMigrations = async (pool: Pool) => {
  const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
  const migrationFiles = [
    'schema_completo.sql'
  ];

  console.log('[PERSISTENCIA] Ejecutando archivos de migracion DDL en PostgreSQL...');
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`[PERSISTENCIA] Ejecutando migracion: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
    }
  }
};

// Ejecutar migraciones delta (tablas nuevas sobre BD existente)
const runDeltaMigrations = async (pool: Pool) => {
  const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
  // Las migraciones delta ya están incorporadas en los archivos consolidados.
  // Se mantienen vacías para retrocompatibilidad.
  const deltaFiles: string[] = [];
  for (const file of deltaFiles) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        console.log(`[PERSISTENCIA] Delta migration OK: ${file}`);
      } catch (e: any) {
        console.warn(`[PERSISTENCIA] Delta migration warning (${file}): ${e.message}`);
      }
    }
  }
};

// Save a single record to its PostgreSQL table using UPSERT
const upsertRecord = async (pool: Pool, tableName: string, record: any) => {
  const snakeRecord = toSnake(record);
  const keys = Object.keys(snakeRecord);
  const values = Object.values(snakeRecord);
  
  if (keys.length === 0) return;

  const valuePlaceholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const setStatements = keys
    .filter(k => k !== 'id')
    .map((k) => `${k} = EXCLUDED.${k}`)
    .join(', ');

  const queryText = `
    INSERT INTO ${tableName} (${keys.join(', ')})
    VALUES (${valuePlaceholders})
    ON CONFLICT (id) 
    DO UPDATE SET ${setStatements};
  `;
  
  await pool.query(queryText, values);
};

// Synchronize memory changes back to PostgreSQL tables
export const saveAllDatabases = async () => {
  if (!appPool) return;

  try {
    for (const db of dbs) {
      if (db.ref.length === 0) continue;
      
      for (const record of db.ref) {
        await upsertRecord(appPool, db.name, record);
      }
    }
  } catch (err) {
    console.error('[PERSISTENCIA] Error al guardar cambios en PostgreSQL:', err);
  }
};

// Initialize PostgreSQL database, run migrations and load records
export const loadAllDatabases = async () => {
  try {
    // Conectar directamente a la base de datos veterinaria_sdd en el puerto 5433
    appPool = new Pool(PG_CONFIG);
    (global as any).pgPool = appPool;

    // 4. Crear tabla usuarios para autenticación
    const createUsuariosTable = `
      CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          nombre VARCHAR(255) NOT NULL,
          rol VARCHAR(50) NOT NULL,
          password_hash VARCHAR(255) NOT NULL
      );
    `;
    await appPool.query(createUsuariosTable);
 
    // Crear tabla consentimientos si no existe
    const createConsentimientosTable = `
      CREATE TABLE IF NOT EXISTS consentimientos (
          id SERIAL PRIMARY KEY,
          propietario_id INT NOT NULL,
          paciente_id INT NOT NULL,
          tipo VARCHAR(100) NOT NULL,
          detalles_intervencion TEXT NOT NULL,
          firma_propietario VARCHAR(255) NOT NULL,
          fecha_firma TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await appPool.query(createConsentimientosTable);

    // 5. Verificar o ejecutar migraciones DDL
    const isInitialized = await checkTableExists(appPool, 'propietarios');
    if (!isInitialized) {
      await runMigrations(appPool);
    } else {
      console.log('[PERSISTENCIA] Estructura relacional PostgreSQL ya inicializada.');
      // Ejecutar migraciones delta (tablas nuevas añadidas en versiones posteriores)
      await runDeltaMigrations(appPool);
    }

    // Delta: Agregar columnas de fecha de nacimiento y campos escalables si no existen
    try {
      await appPool.query(`
        ALTER TABLE pacientes 
        ADD COLUMN IF NOT EXISTS fecha_nacimiento VARCHAR(50) NULL,
        ADD COLUMN IF NOT EXISTS fecha_nacimiento_tipo VARCHAR(50) NULL,
        ADD COLUMN IF NOT EXISTS sexo VARCHAR(50) NULL,
        ADD COLUMN IF NOT EXISTS chip_numero VARCHAR(100) NULL,
        ADD COLUMN IF NOT EXISTS color_marcas VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS alergias TEXT NULL,
        ADD COLUMN IF NOT EXISTS notas TEXT NULL;
      `);
      await appPool.query(`
        ALTER TABLE pacientes ALTER COLUMN edad_meses DROP NOT NULL;
      `);
    } catch (e) {
      console.warn('[PERSISTENCIA] Error al aplicar delta a la tabla pacientes:', e);
    }

    // Truncar para re-sembrar datos solicitados
    try {
      await appPool.query('TRUNCATE TABLE consentimientos, citas, cirugias, consultas, triajes, hospitalizaciones, historiales, pacientes, propietarios RESTART IDENTITY CASCADE;');
      console.log('[PERSISTENCIA] Tablas truncadas para re-sembrado limpio de datos.');
    } catch (e) {
      console.warn('[PERSISTENCIA] Error al truncar tablas para re-sembrado:', e);
    }

    // 5. Cargar registros existentes desde PostgreSQL a memoria
    for (const db of dbs) {
      const selectRes = await appPool.query(`SELECT * FROM ${db.name} ORDER BY id ASC;`);
      if (selectRes.rows.length > 0) {
        const camelRows = selectRes.rows.map(toCamel);
        db.ref.splice(0, db.ref.length, ...camelRows);
        console.log(`[PERSISTENCIA] Cargada tabla '${db.name}' (${camelRows.length} registros)`);
      } else {
        // Si la tabla está vacía en PostgreSQL pero tenemos semillas en memoria, escribirlas
        if (db.ref.length > 0) {
          console.log(`[PERSISTENCIA] Escribiendo semillas de '${db.name}' en PostgreSQL...`);
          for (const seed of db.ref) {
            await upsertRecord(appPool, db.name, seed);
          }
        }
      }
    }
    console.log('[PERSISTENCIA] Carga de base de datos PostgreSQL completada.');
  } catch (err) {
    console.error('[PERSISTENCIA] Error crítico en inicialización de PostgreSQL:', err);
  }
};

let lastHashes: Record<string, string> = {};

export const startAutoSaveWatcher = () => {
  // Inicializar hashes
  dbs.forEach(db => {
    lastHashes[db.name] = JSON.stringify(db.ref);
  });

  // Watcher periódico cada 2 segundos
  setInterval(async () => {
    if (!appPool) return;
    
    for (const db of dbs) {
      const currentJson = JSON.stringify(db.ref);
      if (lastHashes[db.name] !== currentJson) {
        try {
          for (const record of db.ref) {
            await upsertRecord(appPool, db.name, record);
          }
          lastHashes[db.name] = currentJson;
          console.log(`[PERSISTENCIA] Cambios guardados en tabla PostgreSQL: ${db.name}`);
        } catch (err: any) {
          console.error(`[PERSISTENCIA] Error al guardar cambios en tabla '${db.name}':`, err.message);
        }
      }
    }
  }, 2000);

  // Hook del proceso para cierre limpio
  const exitHandler = async () => {
    console.log('[PERSISTENCIA] Apagando servidor, guardando cambios finales en PostgreSQL...');
    await saveAllDatabases();
    if (appPool) {
      await appPool.end();
    }
    process.exit(0);
  };

  process.on('SIGINT', exitHandler);
  process.on('SIGTERM', exitHandler);
};
