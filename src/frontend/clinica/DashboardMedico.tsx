import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR01Props {
  currentRole: UserRole;
}

export const DashboardMedico: React.FC<SCR01Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');

  const triajesMock = [
    { id: 1, paciente: 'Thor', especie: 'canino', urgencia: 'rojo', hora: '15:30', diagnostico: 'Torsión gástrica' },
    { id: 2, paciente: 'Mimi', especie: 'felino', urgencia: 'naranja', hora: '15:45', diagnostico: 'Obstrucción urinaria' },
    { id: 3, paciente: 'Loki', especie: 'canino', urgencia: 'amarillo', hora: '16:00', diagnostico: 'Fractura expuesta' },
  ];

  const quirofanosMock = [
    { salaId: 101, nombre: 'Quirófano A - Mayor', estado: 'Ocupado', paciente: 'Thor', cirugia: 'Gastropexia de Urgencia' },
    { salaId: 102, nombre: 'Quirófano B - Menor', estado: 'Desinfectando', paciente: 'N/A', cirugia: 'Ventana de desinfección BR-10' },
  ];

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard Médico Principal</h1>
          <p className="text-slate-400 text-sm">Monitoreo en tiempo real de urgencias, hospitalizaciones y quirófanos (L5).</p>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-red-400 font-semibold uppercase">Urgencias Rojas</span>
            <h2 className="text-3xl font-bold mt-2">1</h2>
          </div>
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-amber-400 font-semibold uppercase">En Triaje Naranja/Amarillo</span>
            <h2 className="text-3xl font-bold mt-2">2</h2>
          </div>
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-emerald-400 font-semibold uppercase">Quirófanos Ocupados</span>
            <h2 className="text-3xl font-bold mt-2">1 / 2</h2>
          </div>
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-teal-400 font-semibold uppercase">Hospitalizados Críticos</span>
            <h2 className="text-3xl font-bold mt-2">4</h2>
          </div>
        </div>

        {/* Grid de Secciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cola de Triaje de Emergencias */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              Pacientes en Triaje
            </h3>
            <div className="space-y-2">
              {triajesMock.map(t => (
                <div key={t.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200">{t.paciente}</span>
                      <span className="text-xs text-slate-500">({t.especie})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t.diagnostico}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">Hora: {t.hora}</span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      t.urgencia === 'rojo'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : t.urgencia === 'naranja'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {t.urgencia}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ocupación de Quirófanos */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Estado de Quirófanos</h3>
            <div className="space-y-2">
              {quirofanosMock.map(q => (
                <div key={q.salaId} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{q.nombre}</h4>
                    <p className="text-xs text-slate-400 mt-1">Cirugía: {q.cirugia}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      q.estado === 'Ocupado'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {q.estado}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Mascota: {q.paciente}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StateWrapper>
  );
};
