import { Request, Response, NextFunction } from 'express';
import { veterinariosDB, propietariosDB } from '../controllers/clinica.controller';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nombre: string;
    rol: 'administrador' | 'veterinario' | 'cliente';
    email: string;
  };
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'administrador' | 'veterinario' | 'cliente';
  passwordHash: string;
}

export const usuariosDB: Usuario[] = [
  { id: 1, email: 'admin@vetguard.com', nombre: 'Admin General', rol: 'administrador', passwordHash: 'admin123' },
  { id: 2, email: 'vet@vetguard.com', nombre: 'Dr. John Doe', rol: 'veterinario', passwordHash: 'vet123' },
  { id: 3, email: 'cliente@vetguard.com', nombre: 'Marta Gomez', rol: 'cliente', passwordHash: 'cliente123' },
  { id: 4, email: 'fbisanhueza@gmail.com', nombre: 'Fabián Sanhueza', rol: 'cliente', passwordHash: 'fbiza1' },
  { id: 5, email: 'vet2@vetguard.com', nombre: 'Dra. Jane Smith', rol: 'veterinario', passwordHash: 'vet456' }
];

export const activeTokensDB: Record<string, { id: number; nombre: string; rol: 'administrador' | 'veterinario' | 'cliente'; email: string }> = {
  'token-admin': { id: 1, nombre: 'Admin General', rol: 'administrador', email: 'admin@vetguard.com' },
  'token-vet': { id: 2, nombre: 'Dr. John Doe', rol: 'veterinario', email: 'vet@vetguard.com' },
  'token-cliente': { id: 3, nombre: 'Marta Gomez', rol: 'cliente', email: 'cliente@vetguard.com' },
  'token-fabian': { id: 4, nombre: 'Fabián Sanhueza', rol: 'cliente', email: 'fbisanhueza@gmail.com' },
  'token-vet2': { id: 5, nombre: 'Dra. Jane Smith', rol: 'veterinario', email: 'vet2@vetguard.com' }
};

// Middleware de autenticación de token
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Falta token de autenticacion en cabecera Authorization Bearer' });
  }

  try {
    const user = activeTokensDB[token];
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

// Handlers para Endpoints de Autenticación
export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const user = usuariosDB.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  // Generar un token aleatorio simple
  const token = `token-${user.rol}-${Math.random().toString(36).substring(2, 10)}`;
  activeTokensDB[token] = { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email };

  return res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email } });
};

export const handleSignupCliente = async (req: Request, res: Response) => {
  const { email, nombre, password, rut, telefono } = req.body;
  if (!email || !nombre || !password || !rut || !telefono) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validaciones del teléfono (CH-06, CH-07)
  if (telefono.length < 8 || !/^\d+$/.test(telefono)) {
    return res.status(400).json({ error: 'Validación CH-06/CH-07: El teléfono debe tener al menos 8 dígitos y contener solo números.' });
  }

  const existeUsuario = usuariosDB.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (existeUsuario) {
    return res.status(400).json({ error: 'El correo ya se encuentra registrado' });
  }

  // Validar si el correo o RUT ya existe en el sistema clínico propietariosDB (con seguridad nula para el email)
  const existingPropIndex = propietariosDB.findIndex(p => 
    (p.email && p.email.toLowerCase() === email.toLowerCase()) || 
    p.rut.toLowerCase() === rut.toLowerCase()
  );

  const newUser: Usuario = {
    id: usuariosDB.length + 1,
    email: email.toLowerCase(),
    nombre,
    rol: 'cliente',
    passwordHash: password
  };
  usuariosDB.push(newUser);

  if (existingPropIndex !== -1) {
    // Si ya existe el propietario (creado físicamente), vinculamos los datos actualizándolos
    propietariosDB[existingPropIndex].email = email.toLowerCase();
    propietariosDB[existingPropIndex].nombre = nombre;
    propietariosDB[existingPropIndex].telefono = telefono;
    console.log(`[AUTH] Cliente registrado y vinculado a propietario existente: ${email}`);
  } else {
    // Si no existe, creamos un nuevo Propietario
    propietariosDB.push({
      id: propietariosDB.length + 1,
      nombre,
      rut,
      email: email.toLowerCase(),
      telefono
    });
    console.log(`[AUTH] Nuevo cliente registrado con nuevo propietario: ${email}`);
  }

  return res.json({ success: true, user: { id: newUser.id, nombre: newUser.nombre, rol: newUser.rol, email: newUser.email } });
};

export const handleCreateVeterinario = async (req: AuthenticatedRequest, res: Response) => {
  const { email, nombre, password, rut, licenciaMedica } = req.body;
  if (!email || !nombre || !password || !rut || !licenciaMedica) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const existe = usuariosDB.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (existe) {
    return res.status(400).json({ error: 'El correo ya se encuentra registrado' });
  }

  const newUser: Usuario = {
    id: usuariosDB.length + 1,
    email: email.toLowerCase(),
    nombre,
    rol: 'veterinario',
    passwordHash: password
  };
  usuariosDB.push(newUser);

  // Agregar al módulo clínico
  veterinariosDB.push({
    id: newUser.id,
    nombre,
    rut,
    licenciaMedica
  });

  console.log(`[AUTH] Nuevo veterinario creado por admin: ${email}`);
  return res.json({ success: true, user: { id: newUser.id, nombre: newUser.nombre, rol: newUser.rol, email: newUser.email } });
};
