import React, { useState } from "react";
import { LayoutDashboard, Activity, User, Scissors, Home, Stethoscope, FileText, PenTool, Database, Inbox, AlertTriangle, CheckSquare, RefreshCw, Truck, Search, Key, DollarSign, ShoppingCart, Receipt, XCircle, Shield, Tag, TrendingUp, Grid, PlusCircle, Briefcase, Utensils, Calendar, Sparkles, UserCheck, LogOut, CalendarCheck, Clock, ChevronDown, ChevronRight } from "lucide-react";

export type UserRole = "administrador" | "veterinario" | "cliente";

interface MenuItem { id: string; label: string; roleRequired: UserRole[]; icon: React.ComponentType<any>; }
interface MenuGroup { label: string; roles: UserRole[]; items: MenuItem[]; }
interface LayoutProps { children: React.ReactNode; activeTab: string; setActiveTab: (tab: string) => void; currentRole: UserRole; setCurrentRole: (role: UserRole) => void; currentUser: { id: number; nombre: string; email: string; rol: UserRole } | null; onLogout: () => void; }

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentRole, currentUser, onLogout }) => {
  const menuGroups: MenuGroup[] = [
    // ─────────────────── CLIENTE ───────────────────
    { label: 'Mi Espacio', roles: ['cliente'], items: [
      { id: 'ficha',        label: 'Mis Mascotas',  roleRequired: ['cliente'], icon: User },
      { id: 'agenda-citas', label: 'Mis Citas',     roleRequired: ['cliente'], icon: CalendarCheck },
      { id: 'tarifas',      label: 'Tarifas',       roleRequired: ['cliente'], icon: DollarSign },
      { id: 'mis-boletas',  label: 'Mis Boletas',   roleRequired: ['cliente'], icon: Receipt },
    ]},

    // ─────────────────── VETERINARIO ───────────────
    { label: 'Pacientes', roles: ['veterinario'], items: [
      { id: 'ficha',        label: 'Ficha Paciente',    roleRequired: ['veterinario'], icon: User },
      { id: 'triaje',       label: 'Triaje e Ingresos', roleRequired: ['veterinario'], icon: Activity },
      { id: 'consulta',     label: 'Consulta Externa',  roleRequired: ['veterinario'], icon: Stethoscope },
      { id: 'agenda-citas', label: 'Agenda de Citas',   roleRequired: ['veterinario'], icon: CalendarCheck },
    ]},
    { label: 'Mi Agenda', roles: ['veterinario'], items: [
      { id: 'mi-horario', label: 'Mi Horario Semanal', roleRequired: ['veterinario'], icon: Clock },
    ]},
    { label: 'Clínica', roles: ['veterinario'], items: [
      { id: 'quirofano',       label: 'Quirófano',         roleRequired: ['veterinario'], icon: Scissors },
      { id: 'hospitalizacion', label: 'Hospitalización',   roleRequired: ['veterinario'], icon: Home },
      { id: 'receta',          label: 'Emisión Recetas',   roleRequired: ['veterinario'], icon: FileText },
      { id: 'consentimiento',  label: 'Consentimientos',   roleRequired: ['veterinario'], icon: PenTool },
    ]},
    { label: 'Farmacia', roles: ['veterinario'], items: [
      { id: 'catalogo',      label: 'Catálogo Fármacos',  roleRequired: ['veterinario'], icon: Database },
      { id: 'dispensacion',  label: 'Dispensar Recetas',  roleRequired: ['veterinario'], icon: CheckSquare },
      { id: 'alertas-stock', label: 'Alertas Stock/FEFO', roleRequired: ['veterinario'], icon: AlertTriangle },
    ]},
    { label: 'Caja', roles: ['veterinario'], items: [
      { id: 'punto-venta',            label: 'Punto de Venta',    roleRequired: ['veterinario'], icon: ShoppingCart },
      { id: 'historial-comprobantes', label: 'Historial Facturas', roleRequired: ['veterinario'], icon: Receipt },
      { id: 'tarifas',                label: 'Tarifas Servicios', roleRequired: ['veterinario'], icon: DollarSign }
    ]},

    // ─────────────────── ADMINISTRADOR ─────────────
    { label: 'Inicio', roles: ['administrador'], items: [
      { id: 'dashboard', label: 'Dashboard', roleRequired: ['administrador'], icon: LayoutDashboard },
    ]},
    { label: 'Recepción', roles: ['administrador'], items: [
      { id: 'agenda-citas', label: 'Agenda de Citas',      roleRequired: ['administrador'], icon: CalendarCheck },
      { id: 'ficha',        label: 'Registro de Clientes', roleRequired: ['administrador'], icon: User },
    ]},
    { label: 'Hotel y Estética', roles: ['administrador'], items: [
      { id: 'mapa-caniles',       label: 'Aforo Hotel',        roleRequired: ['administrador'], icon: Grid },
      { id: 'admision-guarderia', label: 'Admisión Guardería', roleRequired: ['administrador'], icon: PlusCircle },
      { id: 'agenda-estetica',    label: 'Agenda Estética',    roleRequired: ['administrador'], icon: Sparkles },
    ]},
    { label: 'Inventario / Farmacia', roles: ['administrador'], items: [
      { id: 'catalogo',      label: 'Catálogo Fármacos',  roleRequired: ['administrador'], icon: Database },
      { id: 'alertas-stock', label: 'Alertas Stock/FEFO', roleRequired: ['administrador'], icon: AlertTriangle },
      { id: 'ingreso-lotes', label: 'Recepción Lotes',    roleRequired: ['administrador'], icon: Inbox },
      { id: 'movimientos',   label: 'Ajustes Manuales',   roleRequired: ['administrador'], icon: RefreshCw },
      { id: 'auditoria',     label: 'Auditoría Stock',    roleRequired: ['administrador'], icon: Search },
      { id: 'bitacora-inventario', label: 'Bitácora Movimientos', roleRequired: ['administrador'], icon: FileText },
      { id: 'proveedores',   label: 'Proveedores',        roleRequired: ['administrador'], icon: Truck },
    ]},
    { label: 'Caja / Finanzas', roles: ['administrador'], items: [
      { id: 'punto-venta',            label: 'Punto de Venta',    roleRequired: ['administrador'], icon: ShoppingCart },
      { id: 'historial-comprobantes', label: 'Historial Facturas', roleRequired: ['administrador'], icon: Receipt },
      { id: 'apertura-cierre',        label: 'Apertura/Cierre Caja', roleRequired: ['administrador'], icon: Key },
      { id: 'arqueo-cieo',            label: 'Arqueo Ciego',         roleRequired: ['administrador'], icon: DollarSign },
      { id: 'anulaciones',            label: 'Notas de Crédito',     roleRequired: ['administrador'], icon: XCircle },
      { id: 'bitacora-financiera',    label: 'Bitácora Caja',        roleRequired: ['administrador'], icon: TrendingUp },
      { id: 'seguros',                label: 'Convenios Seguros',    roleRequired: ['administrador'], icon: Shield },
      { id: 'descuentos',             label: 'Campañas Descuentos',  roleRequired: ['administrador'], icon: Tag },
      { id: 'tarifas',                label: 'Tarifas Servicios',    roleRequired: ['administrador'], icon: DollarSign },
    ]},
    { label: 'Hospitalización', roles: ['administrador'], items: [
      { id: 'hospitalizacion', label: 'Aforo Clínico', roleRequired: ['administrador'], icon: Activity },
    ]},
    { label: 'Personal', roles: ['administrador'], items: [
      { id: 'gestion-veterinarios', label: 'Gestión Veterinarios', roleRequired: ['administrador'], icon: UserCheck },
      { id: 'gestion-cuidadores',   label: 'Personal Hotel',       roleRequired: ['administrador'], icon: Briefcase },
      { id: 'dietas',               label: 'Dietas Especiales',    roleRequired: ['administrador'], icon: Utensils },
      { id: 'bitacora-actividades', label: 'Agenda Diaria',        roleRequired: ['administrador'], icon: Calendar },
    ]},
  ];

  const visibleGroups = menuGroups.filter(g => g.roles.includes(currentRole)).map(g => ({ ...g, items: g.items.filter(item => item.roleRequired.includes(currentRole)) })).filter(g => g.items.length > 0);
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({});
  const toggleGroup = (label: string) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2.5 flex-shrink-0">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center"><Stethoscope className="h-3.5 w-3.5 text-white"/></div>
          <span className="text-base font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">VetGuard L5</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleGroups.map((group) => {
            const isCollapsed = collapsed[group.label];
            return (
              <div key={group.label} className="mb-1">
                <button onClick={() => toggleGroup(group.label)} className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors cursor-pointer">
                  <span>{group.label}</span>
                  {isCollapsed ? <ChevronRight className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-100 flex items-center gap-2.5 cursor-pointer ${isActive ? "bg-indigo-50 text-indigo-600 border border-indigo-100/60 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`}/>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 text-[10px] text-slate-400 flex-shrink-0">
          <p>Consola Operativa VetGuard</p>
          <p className="text-slate-400/70">v0.2.0 - Local</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 z-10 sticky top-0 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Centro Veterinario</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600">{(currentUser?.nombre || "U")[0].toUpperCase()}</div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-700 leading-tight">{currentUser?.nombre || "Usuario"}</span>
                <span className="text-[10px] font-medium text-slate-400 capitalize leading-tight">{currentUser?.rol || currentRole}</span>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <LogOut className="h-3.5 w-3.5"/><span>Salir</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 bg-slate-50/50">{children}</main>
      </div>
    </div>
  );
};