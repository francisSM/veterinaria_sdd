import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR21Props {
  currentRole: UserRole;
}

export const SCR21_ConveniosSeguros: React.FC<SCR21Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [pacienteId, setPacienteId] = useState('');
  const [compania, setCompania] = useState('Bupa Pets');
  const [poliza, setPoliza] = useState('');
  const [cobertura, setCobertura] = useState(80);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrarSeguro = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pacienteId || !poliza) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    // CH-65: Poliza len >= 5
    if (poliza.trim().length < 5) {
      setErrorMsg('Error CH-65: El numero de poliza debe poseer al menos 5 caracteres de longitud.');
      return;
    }

    setSuccessMsg(`Seguro veterinario de Bupa Pets vinculado con éxito al paciente ID ${pacienteId}.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'cajero']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Convenios de Seguros de Mascotas</h1>
          <p className="text-slate-400 text-xs">Registro y vinculación de pólizas de salud para cobertura de siniestros clínicos (L5/CH-65).</p>
        </div>

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

        <form onSubmit={registrarSeguro} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="paciente-id-seguro" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Paciente</label>
              <input
                id="paciente-id-seguro"
                type="text"
                value={pacienteId}
                onChange={e => setPacienteId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="comp-seguro-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Compañía Aseguradora</label>
              <select
                id="comp-seguro-select"
                value={compania}
                onChange={e => setCompania(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Bupa Pets">Bupa Pets Cobertura</option>
                <option value="Sura Mascotas">Sura Seguros Caninos</option>
                <option value="Consorcio Animal">Consorcio Animal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="poliza-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Número de Póliza (CH-65)</label>
              <input
                id="poliza-input"
                type="text"
                value={poliza}
                onChange={e => setPoliza(e.target.value)}
                placeholder="Ej: POL-55610"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cobertura-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Porcentaje Cobertura (%)</label>
              <input
                id="cobertura-input"
                type="number"
                value={cobertura}
                onChange={e => setCobertura(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Vincular Seguro de Paciente
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
