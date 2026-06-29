import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR24Props {
  currentRole: UserRole;
}

export const SCR24_MapaCaniles: React.FC<SCR24Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const salasMock = [
    { id: 101, nombre: 'Sala Cachorros A', aforo: 8, max: 12, estado: 'libre' },
    { id: 102, nombre: 'Sala Pacientes Gigantes B', aforo: 6, max: 6, estado: 'llena' },
    { id: 103, nombre: 'Sala Cuarentena C', aforo: 0, max: 5, estado: 'mantenimiento' }
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'recepcionista', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mapa Visual de Caniles y Aforo</h1>
          <p className="text-slate-400 text-sm">Monitoreo en tiempo real del estado de aforo en salas del hotel/guardería canina (L5/CH-76/77).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {salasMock.map(s => {
            const isFull = s.aforo >= s.max;
            return (
              <div key={s.id} className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-200">{s.nombre}</h3>
                    <span className="text-[10px] text-slate-500">ID Sala: {s.id}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    s.estado === 'llena'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : s.estado === 'mantenimiento'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {s.estado}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Aforo Utilizado</span>
                    <span className="font-bold">{s.aforo} / {s.max}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div
                      style={{ width: `${(s.aforo / s.max) * 100}%` }}
                      className={`h-2 rounded-full ${
                        isFull
                          ? 'bg-red-500'
                          : s.estado === 'mantenimiento'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StateWrapper>
  );
};
