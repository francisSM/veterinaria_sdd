import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';

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

// Mock Auth Middleware: Validador de Tokens y Roles JWT
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nombre: string;
    rol: 'administrador' | 'veterinario' | 'cirujano' | 'farmaceutico' | 'cajero' | 'recepcionista' | 'cliente';
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Falta token de autenticacion en cabecera Authorization Bearer' });
  }

  // Simulación de decodificación de JWT (para fines del Sandbox de pruebas)
  // En producción real, se utiliza jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  try {
    const mockPayloads: Record<string, any> = {
      'token-admin': { id: 1, nombre: 'Admin Root', rol: 'administrador' },
      'token-vet': { id: 2, nombre: 'Dr. John Doe', rol: 'veterinario' },
      'token-cirujano': { id: 3, nombre: 'Dra. Jane Smith', rol: 'cirujano' },
      'token-farmaceutico': { id: 4, nombre: 'Q.F. Alan Turing', rol: 'farmaceutico' },
      'token-cajero': { id: 5, nombre: 'Lucia Cajera', rol: 'cajero' },
      'token-recepcionista': { id: 6, nombre: 'Pedro Recepcionista', rol: 'recepcionista' },
      'token-cliente': { id: 7, nombre: 'Marta Gomez', rol: 'cliente' },
    };

    const user = mockPayloads[token];
    if (!user) {
      return res.status(403).json({ error: 'Token invalido o expirado' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Fallo al autenticar token' });
  }
};

// Middleware de autorización por roles
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { rol } = req.user;
    if (!allowedRoles.includes(rol)) {
      return res.status(403).json({
        error: `Acceso denegado: El rol '${rol}' no cuenta con los permisos requeridos para esta operacion`
      });
    }

    next();
  };
};

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
