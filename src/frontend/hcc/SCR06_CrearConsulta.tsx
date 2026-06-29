import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR06Props {
  currentRole: UserRole;
}

export const SCR06_CrearConsulta: React.FC<SCR06Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [historialId, setHistorialId] = useState('');
  const [veterinarioId, setVeterinarioId] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [costo, setCosto] = useState(25000);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrarConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!historialId || !motivo || !diagnostico) {
      setErrorMsg('Faltan campos obligatorios para registrar la consulta.');
      return;
    }

    if (motivo.trim().length < 5) {
      setErrorMsg('El motivo de la consulta debe tener al menos 5 caracteres.');
      return;
    }

    if (costo < 0) {
      setErrorMsg('El costo no puede ser un valor negativo.');
      return;
    }

    setSuccessMsg('Consulta externa y diagnostico guardados exitosamente en la ficha del paciente.');
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Creación de Consulta y Diagnóstico</h1>
          <p className="text-slate-400 text-xs">Formulario para el registro de consultas veterinarias y emisión de diagnósticos (L5).</p>
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

        <form onSubmit={registrarConsulta} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="historial-id" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Historial Clínico</label>
              <input
                id="historial-id"
                type="text"
                value={historialId}
                onChange={e => setHistorialId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="vet-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Veterinario Tratante</label>
              <select
                id="vet-select"
                value={veterinarioId}
                onChange={e => setVeterinarioId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Dr. John Doe (Licencia VET-9901)</option>
                <option value="2">Dra. Jane Smith (Licencia VET-8832)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="motivo-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Motivo de Consulta</label>
            <input
              id="motivo-input"
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Decaimiento y diarrea por 24 horas"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="diagnostico-textarea" className="block text-xs font-semibold text-slate-400 mb-1.5">Diagnóstico Clínico</label>
            <textarea
              id="diagnostico-textarea"
              rows={3}
              value={diagnostico}
              onChange={e => setDiagnostico(e.target.value)}
              placeholder="Escriba los hallazgos y el diagnóstico definitivo..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="costo-base-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Costo Base Consulta ($)</label>
            <input
              id="costo-base-input"
              type="number"
              value={costo}
              onChange={e => setCosto(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Registrar Consulta Externa
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
