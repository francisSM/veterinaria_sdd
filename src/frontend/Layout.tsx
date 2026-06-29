import React, { useState } from 'react';

export type UserRole = 'administrador' | 'veterinario' | 'cirujano' | 'farmaceutico' | 'cajero' | 'recepcionista' | 'cliente';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentRole, setCurrentRole }) => {
  const roles: UserRole[] = ['administrador', 'veterinario', 'cirujano', 'farmaceutico', 'cajero', 'recepcionista', 'cliente'];

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard Médico', roleRequired: ['administrador', 'veterinario', 'cirujano'] },
    { id: 'triaje', label: '🚨 Triaje e Ingresos', roleRequired: ['administrador', 'recepcionista', 'veterinario'] },
    { id: 'ficha', label: '🐶 Ficha Paciente', roleRequired: ['administrador', 'veterinario', 'recepcionista', 'cliente'] },
    { id: 'quirofano', label: '✂️ Quirófano', roleRequired: ['administrador', 'cirujano'] },
    { id: 'hospitalizacion', label: '🏥 Hospitalización', roleRequired: ['administrador', 'veterinario'] },
    { id: 'consulta', label: '🩺 Consulta Externa', roleRequired: ['administrador', 'veterinario'] },
    { id: 'receta', label: '📝 Emisión Recetas', roleRequired: ['administrador', 'veterinario'] },
    { id: 'consentimiento', label: '✍️ Consentimientos', roleRequired: ['administrador', 'recepcionista', 'veterinario'] },
    { id: 'catalogo', label: '💊 Catálogo Fármacos', roleRequired: ['administrador', 'farmaceutico', 'veterinario'] },
    { id: 'ingreso-lotes', label: '📥 Recepción Lotes', roleRequired: ['administrador', 'farmaceutico'] },
    { id: 'alertas-stock', label: '⚠️ Alertas Stock / FEFO', roleRequired: ['administrador', 'farmaceutico'] },
    { id: 'dispensacion', label: '🔓 Dispensar Recetas', roleRequired: ['administrador', 'farmaceutico'] },
    { id: 'movimientos', label: '🔄 Ajustes Manuales', roleRequired: ['administrador', 'farmaceutico'] },
    { id: 'proveedores', label: '🤝 Proveedores', roleRequired: ['administrador', 'farmaceutico'] },
    { id: 'auditoria', label: '🔍 Auditoría Stock', roleRequired: ['administrador', 'farmaceutico'] },
    { id: 'apertura-cierre', label: '🔑 Apertura/Cierre Caja', roleRequired: ['administrador', 'cajero'] },
    { id: 'arqueo-cieo', label: '💰 Arqueo Ciego', roleRequired: ['administrador', 'cajero'] },
    { id: 'punto-venta', label: '🛒 Punto de Venta (POS)', roleRequired: ['administrador', 'cajero'] },
    { id: 'historial-comprobantes', label: '📄 Historial Facturas', roleRequired: ['administrador', 'cajero'] },
    { id: 'anulaciones', label: '❌ Notas de Crédito', roleRequired: ['administrador', 'cajero'] },
    { id: 'seguros', label: '🛡️ Convenios Seguros', roleRequired: ['administrador', 'cajero'] },
    { id: 'descuentos', label: '🎟️ Campañas Descuentos', roleRequired: ['administrador', 'cajero'] },
    { id: 'bitacora-financiera', label: '📈 Bitácora Caja', roleRequired: ['administrador'] },
    { id: 'mapa-caniles', label: '🏨 Aforo Hotel', roleRequired: ['administrador', 'recepcionista', 'veterinario'] },
    { id: 'admision-guarderia', label: '🐾 Admisión Guardería', roleRequired: ['administrador', 'recepcionista'] },
    { id: ' checklist-pertenencias', label: '🎒 Custodia Equipaje', roleRequired: ['administrador', 'recepcionista'] },
    { id: 'dietas', label: '🍲 Dietas Especiales', roleRequired: ['administrador', 'recepcionista', 'veterinario'] },
    { id: 'bitacora-actividades', label: '📅 Agenda Diaria', roleRequired: ['administrador', 'recepcionista', 'veterinario'] },
    { id: 'agenda-estetica', label: '✂️ Agenda Estética', roleRequired: ['administrador', 'recepcionista'] },
    { id: 'gestion-cuidadores', label: '👥 Personal Hotel', roleRequired: ['administrador'] },
  ];

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar de Navegación Lateral */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Título */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              VetGuard L5
            </span>
          </div>

          {/* Menú de Opciones */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {menuItems.map((item) => {
              const isAllowed = item.roleRequired.includes(currentRole);
              return (
                <button
                  key={item.id}
                  disabled={!isAllowed}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                    activeTab === item.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium'
                      : isAllowed
                      ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      : 'text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {!isAllowed && (
                    <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                      Bloqueado
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>Sandbox de Operaciones L5</p>
          <p className="mt-1 text-slate-600">v0.1.0-alpha</p>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Encabezado / Header */}
        <header className="h-16 bg-slate-950/50 backdrop-blur border-b border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-200">Consola del Centro Veterinario</h2>
          </div>

          {/* Selector de Roles Ficticios */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="role-select" className="text-xs text-slate-400 font-medium">Actuar como:</label>
              <select
                id="role-select"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Avatar / Usuario */}
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-semibold text-emerald-400">
              {currentRole[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenedor de Vista / children */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-900/50">
          {children}
        </main>
      </div>
    </div>
  );
};
