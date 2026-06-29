import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR28Props {
  currentRole: UserRole;
}

export const SCR28_BitacoraActividades: React.FC<SCR28Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const actividadesMock = [
    { id: 1, tipo: 'alimentacion', hora: '08:30', desc: 'Porción BARF 250g consumida con éxito.', cuidador: 'Carlos Ruiz' },
    { id: 2, tipo: 'recreacion', hora: '10:00', desc: 'Paseo interactivo en parque exterior y socialización.', cuidador: 'Carlos Ruiz' },
    { id: 3, tipo: 'medicacion', hora: '12:00', desc: 'Administración de Fenobarbital 50mg según pauta.', cuidador: 'Carlos Ruiz' },
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
          <h1 className="text-2xl font-bold text-slate-100">Bitácora de Actividades Diarias</h1>
          <p className="text-slate-400 text-sm">Bitácora de alimentación, recreación y cuidado médico de mascotas huéspedes (L5/BR-52).</p>
        </div>

        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-slate-200">Hoja de Ruta del Huésped: Thor</h3>
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {actividadesMock.map(act => (
              <div key={act.id} className="relative space-y-1">
                <span className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-950 border-2 border-emerald-550 flex items-center justify-center text-[8px] text-emerald-400">
                  ✓
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Hora: {act.hora}</span>
                  <span className="text-xs text-slate-400 font-medium">Cuidador: {act.cuidador}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-200 capitalize">{act.tipo}</h4>
                  <span className="text-[9px] bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-slate-500">
                    Registrado
                  </span>
                </div>
                <p className="text-xs text-slate-400">{act.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
