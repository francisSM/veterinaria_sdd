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
  try {
    console.log('--- MÉTODOS DE PAGO EXISTENTES ---');
    const res = await pool.query('SELECT id, nombre, codigo FROM metodos_pago;');
    res.rows.forEach(row => {
      console.log(`ID: ${row.id} - Nombre: ${row.nombre} - Código: ${row.codigo}`);
    });
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
