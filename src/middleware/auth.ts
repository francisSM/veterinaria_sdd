import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nombre: string;
    rol: 'administrador' | 'veterinario' | 'cirujano' | 'farmaceutico' | 'cajero' | 'recepcionista' | 'cliente';
  };
}

// Middleware de autenticación de token
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
