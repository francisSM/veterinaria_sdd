import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';

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

// Rutas de la API
app.use('/api/v1', apiRouter);

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
