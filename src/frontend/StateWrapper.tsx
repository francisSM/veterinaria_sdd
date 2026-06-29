import React from 'react';

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
      {/* Controles de Simulación de Estados de UX */}
      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simular Estado UX:</span>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(['loading', 'empty', 'data', 'error', 'permission'] as UXState[]).map((state) => (
              <button
                key={state}
                onClick={() => onStateChange(state)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentState === state
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {state.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Rol actual: <span className="font-semibold text-emerald-400">{currentRole}</span>
        </div>
      </div>

      {/* Renderizado Condicional de Estados */}
      {(!isAllowed || currentState === 'permission') ? (
        <div className="bg-red-950/30 border border-red-500/20 p-12 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <span className="text-red-400 font-bold text-lg">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-slate-200">Acceso Restringido</h3>
          <p className="text-sm text-slate-400">
            Tu rol actual (<span className="text-red-400 font-medium">{currentRole}</span>) no cuenta con privilegios de seguridad suficientes para visualizar este módulo clínico o de inventario.
          </p>
        </div>
      ) : currentState === 'loading' ? (
        <div className="p-24 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-10 w-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 animate-pulse">Cargando flujos de datos relacionales...</p>
        </div>
      ) : currentState === 'error' ? (
        <div className="bg-amber-950/20 border border-amber-500/20 p-12 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <span className="text-amber-400 font-bold text-lg">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-slate-200">Error de Conexión</h3>
          <p className="text-sm text-slate-400">{errorMessage}</p>
        </div>
      ) : currentState === 'empty' ? (
        <div className="bg-slate-950/40 border border-dashed border-slate-800 p-16 rounded-2xl text-center max-w-md mx-auto mt-12 space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
            📭
          </div>
          <h3 className="text-base font-semibold text-slate-300">Bandeja Vacía</h3>
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        /* Estado Data (Renderizado Normal) */
        <div className="animate-fadeIn">{children}</div>
      )}
    </div>
  );
};
