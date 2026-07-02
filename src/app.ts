import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes/api';
import { loadAllDatabases, startAutoSaveWatcher } from './database/persistence';

// Cargar bases de datos y activar autoguardado local
loadAllDatabases();
startAutoSaveWatcher();

// Re-exportar desde middleware/auth para compatibilidad con imports existentes
export { authenticateToken, authorizeRoles, AuthenticatedRequest } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de parsing de JSON y CORS
app.use(express.json());
app.use(cors());

// Middleware global de logging para observabilidad
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check público (sin auth) — usado por el pipeline de CI/CD
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// Página de inicio — panel de exploración de la API
app.get('/api-explorer', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Veterinaria SDD — API v1</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh;padding:2rem}
    h1{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.25rem}
    .subtitle{color:#64748b;margin-bottom:2rem;font-size:.95rem}
    .badge{display:inline-block;background:#22c55e22;border:1px solid #22c55e55;color:#22c55e;padding:.2rem .6rem;border-radius:999px;font-size:.75rem;margin-left:.5rem;vertical-align:middle}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem}
    .card{background:#1e2130;border:1px solid #2d3148;border-radius:12px;padding:1.25rem}
    .card h2{font-size:1rem;font-weight:600;color:#818cf8;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .card h2 span{font-size:1.1rem}
    .ep{display:flex;align-items:flex-start;gap:.6rem;padding:.45rem 0;border-bottom:1px solid #2d314822;font-size:.82rem}
    .ep:last-child{border-bottom:none}
    .method{font-weight:700;font-size:.7rem;padding:.15rem .4rem;border-radius:4px;min-width:38px;text-align:center;flex-shrink:0;margin-top:1px}
    .GET{background:#0ea5e922;color:#38bdf8;border:1px solid #38bdf855}
    .POST{background:#22c55e22;color:#4ade80;border:1px solid #4ade8055}
    .path{color:#cbd5e1;font-family:monospace}
    .desc{color:#64748b;margin-top:2px}
    .auth-tag{background:#f59e0b22;border:1px solid #f59e0b55;color:#fbbf24;padding:.1rem .35rem;border-radius:4px;font-size:.65rem;margin-left:auto;flex-shrink:0}
    .health-box{background:#22c55e11;border:1px solid #22c55e44;border-radius:8px;padding:.75rem 1rem;margin-bottom:2rem;font-size:.85rem;display:flex;align-items:center;gap:.75rem}
    .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  </style>
</head>
<body>
  <h1>Veterinaria SDD <span class="badge">API OK</span></h1>
  <p class="subtitle">Sistema de Gestión Integral · Puerto ${PORT} · Modo L5</p>
  <div class="health-box">
    <div class="dot"></div>
    <span>Servidor activo · <a href="/health" style="color:#38bdf8">/health</a> · Todos los endpoints requieren JWT excepto /health</span>
  </div>
  <div class="grid">

    <div class="card">
      <h2><span>🏥</span> HCC — Módulo Clínico</h2>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/propietarios</div><div class="desc">Registrar propietario</div></div><span class="auth-tag">admin · recep</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/pacientes</div><div class="desc">Registrar paciente</div></div><span class="auth-tag">vet · admin</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/triajes</div><div class="desc">Ingesta de triaje</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/clinica/pacientes/:id/historial</div><div class="desc">Historial clínico</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/consultas</div><div class="desc">Registrar consulta</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/cirugias</div><div class="desc">Programar cirugía</div></div><span class="auth-tag">cirujano</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/hospitalizaciones</div><div class="desc">Ingresar hospitalización</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/clinica/signos-vitales</div><div class="desc">Registrar signos vitales</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/clinica/veterinarios</div><div class="desc">Listar veterinarios</div></div><span class="auth-tag">admin</span></div>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/clinica/salas</div><div class="desc">Salas disponibles</div></div><span class="auth-tag">vet</span></div>
    </div>

    <div class="card">
      <h2><span>💊</span> ILM — Inventario</h2>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/inventario/medicamentos</div><div class="desc">Crear medicamento</div></div><span class="auth-tag">farm</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/inventario/proveedores</div><div class="desc">Crear proveedor</div></div><span class="auth-tag">admin</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/inventario/compras</div><div class="desc">Registrar compra</div></div><span class="auth-tag">farm</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/inventario/lotes</div><div class="desc">Crear lote</div></div><span class="auth-tag">farm</span></div>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/inventario/stock</div><div class="desc">Stock de medicamentos</div></div><span class="auth-tag">farm</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/inventario/recetas</div><div class="desc">Crear receta</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/inventario/despachos</div><div class="desc">Registrar despacho</div></div><span class="auth-tag">farm</span></div>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/inventario/alertas</div><div class="desc">Alertas de stock</div></div><span class="auth-tag">farm</span></div>
    </div>

    <div class="card">
      <h2><span>💰</span> FAP — Finanzas</h2>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/finanzas/cajas/abrir</div><div class="desc">Abrir caja</div></div><span class="auth-tag">cajero</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/finanzas/arqueos</div><div class="desc">Registrar arqueo ciego</div></div><span class="auth-tag">cajero</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/finanzas/cajas/cerrar</div><div class="desc">Cerrar caja</div></div><span class="auth-tag">cajero</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/finanzas/comprobantes</div><div class="desc">Crear comprobante</div></div><span class="auth-tag">cajero</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/finanzas/pagos</div><div class="desc">Registrar pago</div></div><span class="auth-tag">cajero</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/finanzas/descuentos</div><div class="desc">Aplicar descuento</div></div><span class="auth-tag">admin</span></div>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/finanzas/cajas/historico</div><div class="desc">Histórico de cajas</div></div><span class="auth-tag">admin</span></div>
    </div>

    <div class="card">
      <h2><span>🐾</span> GAP — Guardería</h2>
      <div class="ep"><span class="method GET">GET</span><div><div class="path">/api/v1/servicios/caniles</div><div class="desc">Caniles disponibles</div></div><span class="auth-tag">admin</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/servicios/reservas</div><div class="desc">Crear reserva guardería</div></div><span class="auth-tag">recep</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/servicios/inspecciones</div><div class="desc">Inspección de salud</div></div><span class="auth-tag">vet</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/servicios/pertenencias</div><div class="desc">Registrar pertenencia</div></div><span class="auth-tag">recep</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/servicios/estetica</div><div class="desc">Servicio de estética</div></div><span class="auth-tag">admin</span></div>
      <div class="ep"><span class="method POST">POST</span><div><div class="path">/api/v1/servicios/turnos</div><div class="desc">Agendar turno estética</div></div><span class="auth-tag">recep</span></div>
    </div>

  </div>
</body>
</html>`);
});


// Rutas de la API
app.use('/api/v1', apiRouter);

// Servir archivos estáticos del frontend en producción
const distPath = path.join(process.cwd(), 'dist-frontend');
app.use(express.static(distPath));
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Manejo centralizado de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Fallo interno del servidor API', detalle: err.message });
});

// Inicialización del servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor de la veterinaria corriendo en puerto ${PORT} en modo L5.`);
  });
}

export default app;
