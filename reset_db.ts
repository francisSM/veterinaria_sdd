import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'veterinaria_sdd'
});

async function reset() {
  console.log('Limpiando tablas en orden para respetar FKs...');
  
  // Orden respetando FK (hijo primero, padre después)
  const tablas = [
    'signos_vitales',
    'hospitalizaciones',
    'cirugias',
    'consultas',
    'triajes',
    'historiales',
    'reservas_guarderia',
    'citas',
    'pacientes',
    'roles_veterinarios',
    'propietarios',
    'veterinarios',
    'usuarios',
    'caniles',
  ];

  for (const t of tablas) {
    try {
      await pool.query(`DELETE FROM ${t};`);
      await pool.query(`ALTER SEQUENCE IF EXISTS ${t}_id_seq RESTART WITH 1;`);
      console.log(`✔ Limpiada tabla: ${t}`);
    } catch (e: any) {
      console.warn(`⚠ ${t}: ${e.message}`);
    }
  }

  await pool.end();
  console.log('Listo — reinicia el backend ahora.');
}

reset().catch(console.error);
