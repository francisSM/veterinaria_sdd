import React from 'react';
import { AlertTriangle, WifiOff, FolderOpen, Loader2 } from 'lucide-react';

export type UXState = 'loading' | 'empty' | 'data' | 'error' | 'permission';

interface StateWrapperProps {
  currentState: UXState;
  onStateChange: (state: UXState) => void;
  allowedRoles: string[];
  currentRole: string;
  children: React.ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
}

export const StateWrapper: React.FC<StateWrapperProps> = ({
  currentState,
  onStateChange,
  allowedRoles,
  currentRole,
  children,
  emptyMessage = 'No se encontraron registros en el sistema.',
  errorMessage = 'Ha ocurrido una excepción de red al intentar conectar con la API de la clínica L5.'
}) => {
  const isAllowed = allowedRoles.includes(currentRole);

  return (
    <div className="space-y-6">
      {/* Controles de Simulación de Estados de UX (Pastel & Clean styling) */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simular Estado UX:</span>
          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {(['loading', 'empty', 'data', 'error', 'permission'] as UXState[]).map((state) => (
              <button
                key={state}
                onClick={() => onStateChange(state)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentState === state
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                {state.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Rol actual: <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{currentRole}</span>
        </div>
      </div>

      {/* Renderizado Condicional de Estados */}
      {(!isAllowed || currentState === 'permission') ? (
        <div className="bg-rose-50 border border-rose-200 p-12 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Acceso Restringido</h3>
          <p className="text-sm text-slate-600">
            Tu rol actual (<span className="text-rose-600 font-medium">{currentRole}</span>) no cuenta con privilegios de seguridad suficientes para visualizar este módulo clínico o de inventario.
          </p>
        </div>
      ) : currentState === 'loading' ? (
        <div className="p-24 flex flex-col items-center justify-center space-y-4 text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 animate-pulse">Cargando flujos de datos relacionales...</p>
        </div>
      ) : currentState === 'error' ? (
        <div className="bg-amber-50 border border-amber-200 p-12 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <WifiOff className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Error de Conexión</h3>
          <p className="text-sm text-slate-600">{errorMessage}</p>
        </div>
      ) : currentState === 'empty' ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 p-16 rounded-2xl text-center max-w-md mx-auto mt-12 space-y-4 shadow-xs">
          <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">Bandeja Vacía</h3>
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        /* Estado Data (Renderizado Normal) */
        <div className="animate-fadeIn">{children}</div>
      )}
    </div>
  );
};
