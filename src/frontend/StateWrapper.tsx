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
