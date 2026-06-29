import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR05Props {
  currentRole: UserRole;
}

export const SCR05_MonitoreoHospitalizacion: React.FC<SCR05Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [hospId, setHospId] = useState('1');
  const [sat, setSat] = useState(98);
  const [sis, setSis] = useState(120);
  const [dia, setDia] = useState(80);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pacientesHosp = [
    { id: 1, paciente: 'Thor', sala: 'Box Emergencia 1', estado: 'crítico', ingreso: '2026-06-29 15:30' },
    { id: 2, paciente: 'Mimi', sala: 'Box Felinos', estado: 'estable', ingreso: '2026-06-29 11:00' },
  ];

  const registrarSignos = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // CH-20 & CH-21: Saturacion
    if (sat < 50 || sat > 100) {
      setErrorMsg('Error CH-20/21: Saturacion de oxigeno fuera de rango permitido (50% - 100%).');
      return;
    }

    // CH-22 & CH-23: Presion sistolica
    if (sis < 50 || sis > 250) {
      setErrorMsg('Error CH-22/23: Presion sistolica fuera de rango permitido (50 - 250 mmHg).');
      return;
    }

    // CH-24 & CH-25: Presion diastolica
    if (dia < 30 || dia > 180) {
      setErrorMsg('Error CH-24/25: Presion diastolica fuera de rango permitido (30 - 180 mmHg).');
      return;
    }

    setSuccessMsg(`Signos vitales guardados exitosamente para Hospitalizacion ID ${hospId}. Monitoreo registrado.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pacientes Hospitalizados */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-200">Pacientes Internados Críticos</h2>
          <p className="text-slate-500 text-xs">Es obligatorio registrar signos vitales al menos cada 2 horas para pacientes críticos (BR-06).</p>
          <div className="space-y-3">
            {pacientesHosp.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">{p.paciente}</span>
                    <span className="text-[10px] text-slate-400">ID Hosp: {p.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Sala: {p.sala} | Ingresó: {p.ingreso}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                    p.estado === 'crítico'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Toma de Signos */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Registrar Signos Vitales</h3>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg">
              {successMsg}
            </div>
          )}

          <form onSubmit={registrarSignos} className="space-y-4">
            <div>
              <label htmlFor="hosp-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Seleccionar Paciente</label>
              <select
                id="hosp-select"
                value={hospId}
                onChange={e => setHospId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Thor (Emergencia 1)</option>
                <option value="2">Mimi (Box Felinos)</option>
              </select>
            </div>

            <div>
              <label htmlFor="saturacion-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Saturación O₂ (%)</label>
              <input
                id="saturacion-input"
                type="number"
                value={sat}
                onChange={e => setSat(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="presion-sis-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Presión Sistólica (mmHg)</label>
              <input
                id="presion-sis-input"
                type="number"
                value={sis}
                onChange={e => setSis(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="presion-dia-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Presión Diastólica (mmHg)</label>
              <input
                id="presion-dia-input"
                type="number"
                value={dia}
                onChange={e => setDia(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Guardar Monitoreo
            </button>
          </form>
        </div>
      </div>
    </StateWrapper>
  );
};
