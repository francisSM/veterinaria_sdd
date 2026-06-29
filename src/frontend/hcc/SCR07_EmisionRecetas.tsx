import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR07Props {
  currentRole: UserRole;
}

export const SCR07_EmisionRecetas: React.FC<SCR07Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [consultaId, setConsultaId] = useState('');
  const [medId, setMedId] = useState('1');
  const [dosis, setDosis] = useState('');
  const [duracion, setDuracion] = useState(7);
  const [firma, setFirma] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const emitirReceta = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!consultaId || !dosis || !firma) {
      setErrorMsg('Faltan campos obligatorios para emitir la receta.');
      return;
    }

    // CH-35: Dosis len >= 2
    if (dosis.trim().length < 2) {
      setErrorMsg('Error CH-35: La dosis debe tener al menos 2 caracteres.');
      return;
    }

    // CH-43 & CH-44: Duracion
    if (duracion < 1 || duracion > 365) {
      setErrorMsg('Error CH-43/44: La duracion de la receta debe estar entre 1 y 365 dias.');
      return;
    }

    setSuccessMsg('Receta médica retenida emitida y firmada digitalmente con éxito.');
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
          <h1 className="text-xl font-bold text-slate-100">Emisión de Receta Retenida</h1>
          <p className="text-slate-400 text-xs">Formulario para registrar recetas de psicotrópicos y fármacos controlados (L5).</p>
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

        <form onSubmit={emitirReceta} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="consulta-id" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Consulta Asociada</label>
              <input
                id="consulta-id"
                type="text"
                value={consultaId}
                onChange={e => setConsultaId(e.target.value)}
                placeholder="Ej: 102"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="med-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Medicamento Controlado</label>
              <select
                id="med-select"
                value={medId}
                onChange={e => setMedId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Fenobarbital 100mg (Psicotrópico)</option>
                <option value="2">Ketamina Solución Inyectable (Anestésico)</option>
                <option value="3">Amoxicilina Suspensión (Antibiótico)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dosis-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Dosificación (Dosis)</label>
            <input
              id="dosis-input"
              type="text"
              value={dosis}
              onChange={e => setDosis(e.target.value)}
              placeholder="Ej: 1/2 tableta cada 12 horas"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duracion-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Duración (Días)</label>
              <input
                id="duracion-input"
                type="number"
                value={duracion}
                onChange={e => setDuracion(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="firma-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Firma Digital del Veterinario</label>
              <input
                id="firma-input"
                type="text"
                value={firma}
                onChange={e => setFirma(e.target.value)}
                placeholder="Ej: VET-JOHN-DOE"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Emitir y Guardar Receta
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
