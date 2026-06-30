import React from 'react';
import {
  LayoutDashboard,
  Activity,
  User,
  Scissors,
  Home,
  Stethoscope,
  FileText,
  PenTool,
  Database,
  Inbox,
  AlertTriangle,
  CheckSquare,
  RefreshCw,
  Truck,
  Search,
  Key,
  DollarSign,
  ShoppingCart,
  Receipt,
  XCircle,
  Shield,
  Tag,
  TrendingUp,
  Grid,
  PlusCircle,
  Briefcase,
  Utensils,
  Calendar,
  Sparkles,
  UserCheck,
  LogOut
} from 'lucide-react';

export type UserRole = 'administrador' | 'veterinario' | 'cirujano' | 'farmaceutico' | 'cajero' | 'recepcionista' | 'cliente';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  onLogout
}) => {
  const roles: UserRole[] = ['administrador', 'veterinario', 'cirujano', 'farmaceutico', 'cajero', 'recepcionista', 'cliente'];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Médico', roleRequired: ['administrador', 'veterinario', 'cirujano'], icon: LayoutDashboard },
    { id: 'triaje', label: 'Triaje e Ingresos', roleRequired: ['administrador', 'recepcionista', 'veterinario'], icon: Activity },
    { id: 'ficha', label: 'Ficha Paciente', roleRequired: ['administrador', 'veterinario', 'recepcionista', 'cliente'], icon: User },
    { id: 'quirofano', label: 'Quirófano', roleRequired: ['administrador', 'cirujano'], icon: Scissors },
    { id: 'hospitalizacion', label: 'Hospitalización', roleRequired: ['administrador', 'veterinario'], icon: Home },
    { id: 'consulta', label: 'Consulta Externa', roleRequired: ['administrador', 'veterinario'], icon: Stethoscope },
    { id: 'receta', label: 'Emisión Recetas', roleRequired: ['administrador', 'veterinario'], icon: FileText },
    { id: 'consentimiento', label: 'Consentimientos', roleRequired: ['administrador', 'recepcionista', 'veterinario'], icon: PenTool },
    { id: 'catalogo', label: 'Catálogo Fármacos', roleRequired: ['administrador', 'farmaceutico', 'veterinario'], icon: Database },
    { id: 'ingreso-lotes', label: 'Recepción Lotes', roleRequired: ['administrador', 'farmaceutico'], icon: Inbox },
    { id: 'alertas-stock', label: 'Alertas Stock / FEFO', roleRequired: ['administrador', 'farmaceutico'], icon: AlertTriangle },
    { id: 'dispensacion', label: 'Dispensar Recetas', roleRequired: ['administrador', 'farmaceutico'], icon: CheckSquare },
    { id: 'movimientos', label: 'Ajustes Manuales', roleRequired: ['administrador', 'farmaceutico'], icon: RefreshCw },
    { id: 'proveedores', label: 'Proveedores', roleRequired: ['administrador', 'farmaceutico'], icon: Truck },
    { id: 'auditoria', label: 'Auditoría Stock', roleRequired: ['administrador', 'farmaceutico'], icon: Search },
    { id: 'apertura-cierre', label: 'Apertura/Cierre Caja', roleRequired: ['administrador', 'cajero'], icon: Key },
    { id: 'arqueo-cieo', label: 'Arqueo Ciego', roleRequired: ['administrador', 'cajero'], icon: DollarSign },
    { id: 'punto-venta', label: 'Punto de Venta (POS)', roleRequired: ['administrador', 'cajero'], icon: ShoppingCart },
    { id: 'historial-comprobantes', label: 'Historial Facturas', roleRequired: ['administrador', 'cajero'], icon: Receipt },
    { id: 'anulaciones', label: 'Notas de Crédito', roleRequired: ['administrador', 'cajero'], icon: XCircle },
    { id: 'seguros', label: 'Convenios Seguros', roleRequired: ['administrador', 'cajero'], icon: Shield },
    { id: 'descuentos', label: 'Campañas Descuentos', roleRequired: ['administrador', 'cajero'], icon: Tag },
    { id: 'bitacora-financiera', label: 'Bitácora Caja', roleRequired: ['administrador'], icon: TrendingUp },
    { id: 'mapa-caniles', label: 'Aforo Hotel', roleRequired: ['administrador', 'recepcionista', 'veterinario'], icon: Grid },
    { id: 'admision-guarderia', label: 'Admisión Guardería', roleRequired: ['administrador', 'recepcionista'], icon: PlusCircle },
    { id: ' checklist-pertenencias', label: 'Custodia Equipaje', roleRequired: ['administrador', 'recepcionista'], icon: Briefcase },
    { id: 'dietas', label: 'Dietas Especiales', roleRequired: ['administrador', 'recepcionista', 'veterinario'], icon: Utensils },
    { id: 'bitacora-actividades', label: 'Agenda Diaria', roleRequired: ['administrador', 'recepcionista', 'veterinario'], icon: Calendar },
    { id: 'agenda-estetica', label: 'Agenda Estética', roleRequired: ['administrador', 'recepcionista'], icon: Sparkles },
    { id: 'gestion-cuidadores', label: 'Personal Hotel', roleRequired: ['administrador'], icon: UserCheck },
  ];

  // Filtrar ítems del menú para mostrar SOLO los que tienen permiso
  const allowedMenuItems = menuItems.filter(item => item.roleRequired.includes(currentRole));

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar de Navegación Lateral (Fondo Blanco, Bordes Pasteles) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-xs">
        <div>
          {/* Logo / Título */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
              VetGuard L5
            </span>
          </div>

          {/* Menú de Opciones */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {allowedMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 flex items-center gap-3 ${
                    activeTab === item.id
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <IconComponent className={`h-4.5 w-4.5 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
          <p>Sandbox de Operaciones L5</p>
          <p className="mt-0.5 text-slate-400/80">v0.1.0-alpha</p>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Encabezado / Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 z-10 sticky top-0 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-600">Consola del Centro Veterinario</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Selector de Roles Ficticios */}
            <div className="flex items-center gap-2">
              <label htmlFor="role-select" className="text-xs text-slate-400 font-medium">Actuar como:</label>
              <select
                id="role-select"
                value={currentRole}
                onChange={(e) => {
                  const selectedRole = e.target.value as UserRole;
                  setCurrentRole(selectedRole);
                  // Si el rol actual no tiene permiso en la pestaña activa, mover a la primera permitida
                  const item = menuItems.find(m => m.id === activeTab);
                  if (item && !item.roleRequired.includes(selectedRole)) {
                    const firstAllowed = menuItems.find(m => m.roleRequired.includes(selectedRole));
                    if (firstAllowed) setActiveTab(firstAllowed.id);
                  }
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Usuario Activo */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
                {currentRole[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-500 capitalize">{currentRole}</span>
            </div>

            {/* Botón Salir */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Contenedor de Vista */}
        <main className="flex-1 p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};
