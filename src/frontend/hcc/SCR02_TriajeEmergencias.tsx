import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR02Props {
  currentRole: UserRole;
}

export const SCR02_TriajeEmergencias: React.FC<SCR02Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [pacienteId, setPacienteId] = useState('');
  const [urgencia, setUrgencia] = useState('rojo');
  const [temperatura, setTemperatura] = useState(38.5);
  const [frecuenciaC, setFrecuenciaC] = useState(120);
  const [frecuenciaR, setFrecuenciaR] = useState(30);
  const [escalaDolor, setEscalaDolor] = useState(5);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrarTriaje = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pacienteId) {
      setErrorMsg('Debe seleccionar o ingresar el ID del paciente.');
      return;
    }

    // CH-09 & CH-10: Temperatura
    if (temperatura < 30.0 || temperatura > 45.0) {
      setErrorMsg('Error CH-09/10: La temperatura debe situarse entre 30C y 45C.');
      return;
    }

    // CH-11 & CH-12: Frecuencia cardíaca
    if (frecuenciaC < 20 || frecuenciaC > 350) {
      setErrorMsg('Error CH-11/12: Frecuencia cardiaca fuera de rango fisiologico.');
      return;
    }

    // CH-13 & CH-14: Frecuencia respiratoria
    if (frecuenciaR < 5 || frecuenciaR > 150) {
      setErrorMsg('Error CH-13/14: Frecuencia respiratoria fuera de rango.');
      return;
    }

    // CH-15 & CH-16: Escala dolor
    if (escalaDolor < 1 || escalaDolor > 10) {
      setErrorMsg('Error CH-15/16: Escala de dolor debe estar entre 1 y 10.');
      return;
    }

    setSuccessMsg('Triaje registrado exitosamente. Clasificación inyectada en cola de atención médica.');
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'recepcionista', 'veterinario']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Ingreso y Triaje de Emergencias</h1>
          <p className="text-slate-400 text-xs">Clasificación cromática del paciente basada en signos vitales inmediatos (L5).</p>
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

        <form onSubmit={registrarTriaje} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="paciente-id" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Paciente</label>
              <input
                id="paciente-id"
                type="text"
                value={pacienteId}
                onChange={e => setPacienteId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="urgencia-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Nivel de Urgencia</label>
              <select
                id="urgencia-select"
                value={urgencia}
                onChange={e => setUrgencia(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="rojo">Rojo (Paro, hemorragia masiva)</option>
                <option value="naranja">Naranja (Shock, dolor severo)</option>
                <option value="amarillo">Amarillo (Estable con dolor)</option>
                <option value="verde">Verde (Consulta no urgente)</option>
                <option value="azul">Azul (Control general)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="temperatura-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Temp. (°C)</label>
              <input
                id="temperatura-input"
                type="number"
                step="0.1"
                value={temperatura}
                onChange={e => setTemperatura(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="frec-c-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Frec. Cardiaca (lpm)</label>
              <input
                id="frec-c-input"
                type="number"
                value={frecuenciaC}
                onChange={e => setFrecuenciaC(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="frec-r-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Frec. Resp. (rpm)</label>
              <input
                id="frec-r-input"
                type="number"
                value={frecuenciaR}
                onChange={e => setFrecuenciaR(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dolor-range" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Escala de Dolor (1 al 10): <span className="text-emerald-400 font-bold">{escalaDolor}</span>
            </label>
            <input
              id="dolor-range"
              type="range"
              min="1"
              max="10"
              value={escalaDolor}
              onChange={e => setEscalaDolor(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-900 border border-slate-700 rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Registrar Triaje Crítico
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
