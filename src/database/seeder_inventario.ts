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
  console.log('[SEEDER] Conectando a PostgreSQL para poblar catálogo de fármacos y movimientos...');

  try {
    // 1. Limpiar ordenadamente las tablas dependientes en cascada inversa
    console.log('[SEEDER] Limpiando tablas de inventario previas...');
    await pool.query('DELETE FROM alertas_stock;');
    await pool.query('DELETE FROM despachos_medicamentos;');
    await pool.query('DELETE FROM movimientos_inventario;');
    await pool.query('DELETE FROM recetas_retenidas;');
    await pool.query('DELETE FROM detalle_compras;');
    await pool.query('DELETE FROM lotes;');
    await pool.query('DELETE FROM medicamentos;');

    // 2. Insertar Medicamentos
    console.log('[SEEDER] Insertando medicamentos semilla...');
    const meds = [
      { id: 1, nombre_comercial: 'Ketamina Inyectable 10%', principio_activo: 'Ketamina', precio_venta: 45000, stock_minimo: 10, categoria_id: 3 }, // anestésico
      { id: 2, nombre_comercial: 'Tramadol Gotas 100mg/ml', principio_activo: 'Tramadol', precio_venta: 12000, stock_minimo: 5, categoria_id: 2 }, // analgésico
      { id: 3, nombre_comercial: 'Amoxicilina Suspensión 250mg/5ml', principio_activo: 'Amoxicilina', precio_venta: 8500, stock_minimo: 20, categoria_id: 1 }, // antibiótico
      { id: 4, nombre_comercial: 'Fenobarbital Gotas 4%', principio_activo: 'Fenobarbital', precio_venta: 18900, stock_minimo: 8, categoria_id: 6 }, // psicotrópico
      { id: 5, nombre_comercial: 'Paracetamol Suspensión 120mg/5ml', principio_activo: 'Paracetamol', precio_venta: 5900, stock_minimo: 15, categoria_id: 2 } // analgésico
    ];

    for (const m of meds) {
      await pool.query(`
        INSERT INTO medicamentos (id, nombre_comercial, principio_activo, precio_venta, stock_minimo, categoria_id)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [m.id, m.nombre_comercial, m.principio_activo, m.precio_venta, m.stock_minimo, m.categoria_id]);
    }

    // 3. Insertar Lotes de Origen
    console.log('[SEEDER] Insertando lotes (múltiples lotes para priorización FEFO)...');
    const lotes = [
      // Ketamina Lotes (2 lotes para ver priorización FEFO)
      { id: 1, codigo_lote: 'KET-992-A', medicamento_id: 1, compra_id: 1, cantidad_inicial: 30, cantidad_actual: 15, precio_compra_unitario: 18000, fecha_ingreso: '2026-06-01 09:00:00', fecha_vencimiento: '2526-12-31 00:00:00', estado: 'disponible' },
      { id: 2, codigo_lote: 'KET-001-B', medicamento_id: 1, compra_id: 1, cantidad_inicial: 40, cantidad_actual: 35, precio_compra_unitario: 19000, fecha_ingreso: '2026-06-15 10:00:00', fecha_vencimiento: '2026-07-15 00:00:00', estado: 'disponible' }, // VENCE PRONTO! Debe ser FEFO prioritario

      // Tramadol Lotes
      { id: 3, codigo_lote: 'TRA-102-X', medicamento_id: 2, compra_id: 1, cantidad_inicial: 25, cantidad_actual: 20, precio_compra_unitario: 5000, fecha_ingreso: '2026-05-10 08:30:00', fecha_vencimiento: '2027-05-10 00:00:00', estado: 'disponible' },

      // Amoxicilina Lotes
      { id: 4, codigo_lote: 'AMO-334-L', medicamento_id: 3, compra_id: 1, cantidad_inicial: 100, cantidad_actual: 80, precio_compra_unitario: 3500, fecha_ingreso: '2026-06-01 09:30:00', fecha_vencimiento: '2028-06-01 00:00:00', estado: 'disponible' },

      // Fenobarbital Lotes (2 lotes: uno vencido para cuarentena)
      { id: 5, codigo_lote: 'FEN-091-M', medicamento_id: 4, compra_id: 1, cantidad_inicial: 15, cantidad_actual: 12, precio_compra_unitario: 7500, fecha_ingreso: '2026-04-10 11:00:00', fecha_vencimiento: '2027-04-10 00:00:00', estado: 'disponible' },
      { id: 6, codigo_lote: 'FEN-012-V', medicamento_id: 4, compra_id: 1, cantidad_inicial: 10, cantidad_actual: 10, precio_compra_unitario: 7000, fecha_ingreso: '2026-01-01 09:00:00', fecha_vencimiento: '2026-06-01 00:00:00', estado: 'vencido' }, // VENCIDO! En cuarentena

      // Paracetamol Lotes
      { id: 7, codigo_lote: 'PAR-402-K', medicamento_id: 5, compra_id: 1, cantidad_inicial: 50, cantidad_actual: 50, precio_compra_unitario: 2200, fecha_ingreso: '2026-06-25 14:00:00', fecha_vencimiento: '2029-06-25 00:00:00', estado: 'disponible' }
    ];

    for (const l of lotes) {
      await pool.query(`
        INSERT INTO lotes (id, codigo_lote, medicamento_id, compra_id, cantidad_inicial, cantidad_actual, precio_compra_unitario, fecha_ingreso, fecha_vencimiento, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [l.id, l.codigo_lote, l.medicamento_id, l.compra_id, l.cantidad_inicial, l.cantidad_actual, l.precio_compra_unitario, l.fecha_ingreso, l.fecha_vencimiento, l.estado]);
    }

    // 4. Insertar Movimientos de Inventario (incluyendo cada tipo para la bitácora)
    console.log('[SEEDER] Insertando movimientos de cada tipo (compra, venta, merma, ajuste)...');
    const movimientos = [
      // 1. Tipo 'compra' (Ingresos iniciales)
      { id: 1, medicamento_id: 1, lote_id: 1, tipo: 'compra', cantidad: 30, motivo: 'Ingreso lote inicial por compra a Laboratorio Chile', fecha_movimiento: '2026-06-01 09:15:00' },
      { id: 2, medicamento_id: 1, lote_id: 2, tipo: 'compra', cantidad: 40, motivo: 'Recepción de compra internacional de emergencia', fecha_movimiento: '2026-06-15 10:30:00' },
      { id: 3, medicamento_id: 2, lote_id: 3, tipo: 'compra', cantidad: 25, motivo: 'Ingreso lote inicial por compra consolidada', fecha_movimiento: '2026-05-10 09:00:00' },
      { id: 4, medicamento_id: 3, lote_id: 4, tipo: 'compra', cantidad: 100, motivo: 'Ingreso lote inicial por licitación anual', fecha_movimiento: '2026-06-01 10:00:00' },
      { id: 5, medicamento_id: 4, lote_id: 5, tipo: 'compra', cantidad: 15, motivo: 'Compra inicial de psicotrópicos controlados', fecha_movimiento: '2026-04-10 11:30:00' },

      // 2. Tipo 'venta' (Despachos por recetas)
      { id: 6, medicamento_id: 1, lote_id: 2, tipo: 'venta', cantidad: -3, motivo: 'Despacho por receta retenida #12 - Cirugía Paciente "Toby"', fecha_movimiento: '2026-06-18 15:40:00' },
      { id: 7, medicamento_id: 1, lote_id: 2, tipo: 'venta', cantidad: -2, motivo: 'Despacho por receta retenida #14 - Sedación Paciente "Luna"', fecha_movimiento: '2026-06-20 11:20:00' },
      { id: 8, medicamento_id: 2, lote_id: 3, tipo: 'venta', cantidad: -5, motivo: 'Despacho por receta #15 - Tratamiento analgésico post-operatorio', fecha_movimiento: '2026-06-22 16:10:00' },
      { id: 9, medicamento_id: 3, lote_id: 4, tipo: 'venta', cantidad: -20, motivo: 'Dispensación antibiótica Paciente "Rex"', fecha_movimiento: '2026-06-25 12:45:00' },

      // 3. Tipo 'merma' (Pérdidas, roturas, vencidos)
      { id: 10, medicamento_id: 4, lote_id: 6, tipo: 'merma', cantidad: -10, motivo: 'Lote FEN-012-V expirado. Retirado de circulación para destrucción controlada', fecha_movimiento: '2026-06-01 23:59:59' },
      { id: 11, medicamento_id: 2, lote_id: 3, tipo: 'merma', cantidad: -1, motivo: 'Rotura física de ampolla al descargar la caja de reposición', fecha_movimiento: '2026-06-10 13:15:00' },

      // 4. Tipo 'ajuste' (Auditorías manuales de control)
      { id: 12, medicamento_id: 4, lote_id: 5, tipo: 'ajuste', cantidad: -3, motivo: 'Ajuste por auditoría de stock: diferencia de 3 unidades en el conteo físico mensual', fecha_movimiento: '2026-06-28 17:30:00' },
      { id: 13, medicamento_id: 3, lote_id: 4, tipo: 'ajuste', cantidad: 5, motivo: 'Ajuste manual: reincorporación de saldo sobrante de hospitalizaciones anteriores', fecha_movimiento: '2026-06-29 09:00:00' }
    ];

    for (const mov of movimientos) {
      await pool.query(`
        INSERT INTO movimientos_inventario (id, medicamento_id, lote_id, tipo, cantidad, motivo, fecha_movimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [mov.id, mov.medicamento_id, mov.lote_id, mov.tipo, mov.cantidad, mov.motivo, mov.fecha_movimiento]);
    }

    // 5. Insertar Recetas y Despachos para consistencia relacional
    console.log('[SEEDER] Insertando recetas y despachos relacionados...');
    await pool.query(`
      INSERT INTO recetas_retenidas (id, consulta_id, medicamento_id, dosis, duracion_dias, estado, firma_veterinario, fecha_emision)
      VALUES 
        (1, 1, 1, '1ml IM dosis única', 1, 'despachada', 'VET-RODRIGO-DIAZ', '2026-06-18 15:00:00'),
        (2, 2, 4, '5 gotas cada 12 hrs', 30, 'emitida', 'VET-RODRIGO-DIAZ', '2026-06-29 10:00:00');
    `);

    await pool.query(`
      INSERT INTO despachos_medicamentos (id, receta_id, lote_id, cantidad_despachada, fecha_despacho)
      VALUES (1, 1, 2, 3, '2026-06-18 15:40:00');
    `);

    // 6. Limpiar y Sembrar Tablas Financieras (FAP)
    console.log('[SEEDER] Limpiando tablas financieras...');
    await pool.query('DELETE FROM bitacora_transacciones;');
    await pool.query('DELETE FROM compromisos_pago;');
    await pool.query('DELETE FROM pagos;');
    await pool.query('DELETE FROM metodos_pago;');
    await pool.query('DELETE FROM detalles_comprobantes;');
    await pool.query('DELETE FROM comprobantes_fiscales;');
    await pool.query('DELETE FROM arqueos_caja;');
    await pool.query('DELETE FROM cajas_diarias;');
    await pool.query('DELETE FROM campanas_descuentos;');
    await pool.query('DELETE FROM servicios_tarifas;');

    console.log('[SEEDER] Insertando métodos de pago semilla...');
    await pool.query(`
      INSERT INTO metodos_pago (id, nombre, codigo)
      VALUES 
        (1, 'Efectivo', 'efectivo'),
        (2, 'Tarjeta de Débito', 'tarjeta_debito'),
        (3, 'Tarjeta de Crédito', 'tarjeta_credito'),
        (4, 'Transferencia', 'transferencia'),
        (5, 'Seguro Mascota', 'seguro')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('[SEEDER] Insertando tarifas de servicios clínicas y estéticas...');
    const tarifas = [
      { id: 1, nombre: 'Consulta General', categoria: 'Consultas', tipo: 'clinica', tarifa_base: 12000, tarifa_max: null, notas: 'Sin procedimientos adicionales' },
      { id: 2, nombre: 'Consulta a Domicilio', categoria: 'Consultas', tipo: 'domicilio', tarifa_base: 22000, tarifa_max: null, notas: 'Incluye desplazamiento dentro del radio' },
      { id: 3, nombre: 'Control Post-Operatorio', categoria: 'Consultas', tipo: 'clinica', tarifa_base: 10000, tarifa_max: null, notas: 'Seguimiento de cirugia previa' },
      { id: 4, nombre: 'Vacunación (por dosis)', categoria: 'Preventiva', tipo: 'clinica', tarifa_base: 8000, tarifa_max: null, notas: 'Antirabica, Polivalente, etc.' },
      { id: 5, nombre: 'Desparasitación Interna', categoria: 'Preventiva', tipo: 'clinica', tarifa_base: 6000, tarifa_max: null, notas: 'Tableta o pipeta segun peso' },
      { id: 6, nombre: 'Desparasitación Externa', categoria: 'Preventiva', tipo: 'clinica', tarifa_base: 5000, tarifa_max: null, notas: 'Antipulgas y garrapatas' },
      { id: 7, nombre: 'Limpieza Dental', categoria: 'Procedimientos', tipo: 'clinica', tarifa_base: 45000, tarifa_max: null, notas: 'Incluye anestesia general' },
      { id: 8, nombre: 'Cirugía Menor', categoria: 'Cirugia', tipo: 'clinica', tarifa_base: 85000, tarifa_max: 150000, notas: 'Heridas, biopsias, extirpaciones' },
      { id: 9, nombre: 'Cirugía Mayor', categoria: 'Cirugia', tipo: 'clinica', tarifa_base: 180000, tarifa_max: 500000, notas: 'Cotizacion segun complejidad' },
      { id: 10, nombre: 'Esterilización (hembra)', categoria: 'Cirugia', tipo: 'clinica', tarifa_base: 120000, tarifa_max: 180000, notas: 'Segun peso y especie' },
      { id: 11, nombre: 'Esterilización (macho)', categoria: 'Cirugia', tipo: 'clinica', tarifa_base: 70000, tarifa_max: 100000, notas: 'Segun peso y especie' },
      { id: 12, nombre: 'Hospitalización (por dia)', categoria: 'Hospitalizacion', tipo: 'clinica', tarifa_base: 35000, tarifa_max: null, notas: 'Incluye supervision y alimentacion basica' },
      { id: 13, nombre: 'Hospitalización UCI', categoria: 'Hospitalizacion', tipo: 'clinica', tarifa_base: 65000, tarifa_max: null, notas: 'Cuidados intensivos' },
      { id: 14, nombre: 'Baño Básico', categoria: 'Estetica', tipo: 'clinica', tarifa_base: 12000, tarifa_max: 18000, notas: 'Segun tamano del animal' },
      { id: 15, nombre: 'Baño y Corte Completo', categoria: 'Estetica', tipo: 'clinica', tarifa_base: 20000, tarifa_max: 35000, notas: 'Segun tamano y raza' },
      { id: 16, nombre: 'Guardería (por noche)', categoria: 'Hotel', tipo: 'clinica', tarifa_base: 18000, tarifa_max: null, notas: 'Caniles individuales climatizados' },
      { id: 17, nombre: 'Guardería (por dia)', categoria: 'Hotel', tipo: 'clinica', tarifa_base: 12000, tarifa_max: null, notas: 'Supervision y alimentacion incluida' },
      { id: 18, nombre: 'Radiografía', categoria: 'Diagnostico', tipo: 'clinica', tarifa_base: 25000, tarifa_max: null, notas: 'Digital, resultado inmediato' },
      { id: 19, nombre: 'Examen de Sangre Completo', categoria: 'Diagnostico', tipo: 'clinica', tarifa_base: 18000, tarifa_max: null, notas: 'Hemograma + bioquimica basica' },
      { id: 20, nombre: 'Ecografía Abdominal', categoria: 'Diagnostico', tipo: 'clinica', tarifa_base: 35000, tarifa_max: null, notas: 'Con reporte del especialista' },
      { id: 21, nombre: 'Urgencia', categoria: 'Consultas', tipo: 'clinica', tarifa_base: 20000, tarifa_max: null, notas: 'Atención de emergencias y urgencias médicas 24/7' }
    ];

    for (const t of tarifas) {
      await pool.query(`
        INSERT INTO servicios_tarifas (id, nombre, categoria, tipo, tarifa_base, tarifa_max, notas)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [t.id, t.nombre, t.categoria, t.tipo, t.tarifa_base, t.tarifa_max, t.notas]);
    }

    console.log('[SEEDER] Limpiando y sembrando convenios de seguros...');
    await pool.query('DELETE FROM convenios_seguros;');
    await pool.query(`
      INSERT INTO convenios_seguros (id, propietario_id, compania, poliza_numero, paciente_id, cobertura_porcentaje, cubre_cirugias, cubre_medicamentos, medicamentos_cobertura, cirugias_cobertura)
      VALUES 
        (1, 3, 'Bupa Pets Cobertura', 'POL-99281', 1, 80.00, true, true, '1,2,4', 'Cirugía Mayor, Esterilización (hembra)'),
        (2, 4, 'Sura Seguros Caninos', 'POL-10023', 2, 70.00, true, false, NULL, 'Esterilización (macho)');
    `);

    console.log('[SEEDER] Insertando campañas de descuento...');
    await pool.query(`
      INSERT INTO campanas_descuentos (id, motivo, porcentaje, activo)
      VALUES 
        (1, 'Campaña Esterilización Invierno', 15.00, true),
        (2, 'Convenio Protectora Mascotas', 25.00, true);
    `);

    console.log('[SEEDER] Insertando cajas y transacciones de prueba...');
    await pool.query(`
      INSERT INTO cajas_diarias (id, cajero_id, monto_apertura, monto_cierre, estado, fecha_apertura, fecha_cierre)
      VALUES (1, 2, 150000.00, NULL, 'abierta', '2026-06-29 08:00:00', NULL);
    `);

    // Insertar comprobantes (incluyendo boleta 3 con abono parcial)
    await pool.query(`
      INSERT INTO comprobantes_fiscales (id, propietario_id, caja_diaria_id, tipo_documento, folio_factura, monto_total, estado, fecha_emision, operador_id, operador_rol)
      VALUES 
        (1, 3, 1, 'boleta', NULL, 35000.00, 'pagada', '2026-06-29 11:15:00', 2, 'veterinario'),
        (2, 4, 1, 'factura', 'F-10029', 120000.00, 'pagada', '2026-06-29 14:30:00', 1, 'administrador'),
        (3, 3, 1, 'boleta', NULL, 80000.00, 'emitida', '2026-06-29 16:30:00', 1, 'administrador');
    `);

    await pool.query(`
      INSERT INTO detalles_comprobantes (id, comprobante_id, descripcion, cantidad_items, precio_unitario, descuento_item)
      VALUES 
        (1, 1, 'Consulta Médica General + Triaje', 1, 35000.00, 0.00),
        (2, 2, 'Procedimiento Quirúrgico Esterilización Completa', 1, 120000.00, 0.00),
        (3, 3, 'Cirugía Mayor con Insumos Especiales', 1, 80000.00, 0.00);
    `);

    await pool.query(`
      INSERT INTO pagos (id, boleta_id, metodo_pago_id, monto_pagado, fecha_pago)
      VALUES 
        (1, 1, 1, 35000.00, '2026-06-29 11:16:00'),
        (2, 2, 2, 120000.00, '2026-06-29 14:31:00'),
        (3, 3, 1, 30000.00, '2026-06-29 16:31:00');
    `);

    // Registrar el compromiso de pago del abono parcial
    await pool.query(`
      INSERT INTO compromisos_pago (id, comprobante_id, monto_pendiente, fecha_limite, estado)
      VALUES (1, 3, 50000.00, '2026-07-29 18:00:00', 'pendiente');
    `);

    await pool.query(`
      INSERT INTO bitacora_transacciones (id, caja_diaria_id, descripcion, monto, tipo_transaccion, fecha_registro, operador_id, operador_rol)
      VALUES 
        (1, 1, 'Apertura de caja diaria con saldo base de $150,000', 150000.00, 'ingreso', '2026-06-29 08:00:05', 1, 'administrador'),
        (2, 1, '[AUDITORÍA] Comprobante #1 (boleta) emitido por veterinario (ID 2) — $35,000', 35000.00, 'ingreso', '2026-06-29 11:15:20', 2, 'veterinario'),
        (3, 1, 'Comprobante #2 (factura) emitido por administrador (ID 1) — $120,000', 120000.00, 'ingreso', '2026-06-29 14:30:45', 1, 'administrador'),
        (4, 1, '[ABONO PARCIAL] Comprobante #3 (boleta) emitido por administrador (ID 1). Abonado: $30,000 (Saldo pendiente: $50,000 con plazo de 30 días)', 30000.00, 'ingreso', '2026-06-29 16:30:50', 1, 'administrador'),
        (5, 1, 'Retiro de efectivo de caja para pago menor de papelería', 15000.00, 'egreso', '2026-06-29 17:00:00', 1, 'administrador'),
        (6, 1, 'Ajuste por arqueo. Diferencia detectada: -5,000 (Faltante sin justificación)', 5000.00, 'ajuste', '2026-06-29 18:30:00', 1, 'administrador');
    `);

    console.log('[SEEDER] Base de datos de inventario, movimientos y finanzas relacionales poblada exitosamente.');
  } catch (err: any) {
    console.error('[SEEDER] Error al sembrar base de datos:', err.message);
  } finally {
    await pool.end();
  }
}

main();
