import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR27Props {
  currentRole: UserRole;
}

export const SCR27_DietasEspeciales: React.FC<SCR27Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [checkinId, setCheckinId] = useState('');
  const [tipoAlimento, setTipoAlimento] = useState('hipoalergenico');
  const [porcionGramos, setPorcionGramos] = useState(250);
  const [alergias, setAlergias] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrarDieta = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!checkinId) {
      setErrorMsg('Debe seleccionar o ingresar el ID de check-in de la mascota.');
      return;
    }

    // CH-90 & CH-91: Porcionamiento y limites
    if (porcionGramos <= 0 || porcionGramos > 2000) {
      setErrorMsg('Error CH-90/91: La porcion de alimento debe estar entre 1 y 2000 gramos.');
      return;
    }

    setSuccessMsg(`Ficha de dieta especial configurada exitosamente para la mascota.`);
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
          <h1 className="text-xl font-bold text-slate-100">Registro de Dieta Especial</h1>
          <p className="text-slate-400 text-xs">Formulario para control de racionamiento de comida y alertas de alergias en guardería (L5/BR-56).</p>
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

        <form onSubmit={registrarDieta} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkin-id-dieta" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Check-in Mascota</label>
              <input
                id="checkin-id-dieta"
                type="text"
                value={checkinId}
                onChange={e => setCheckinId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dieta-type-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo Alimento</label>
              <select
                id="dieta-type-select"
                value={tipoAlimento}
                onChange={e => setTipoAlimento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="hipoalergenico">Hipoalergénico (Especial)</option>
                <option value="barf">Dieta BARF (Cruda)</option>
                <option value="junior">Cachorros (Kibbles)</option>
                <option value="senior">Sénior bajo en sodio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="porcion-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Porción por ración (Gramos)</label>
              <input
                id="porcion-input"
                type="number"
                value={porcionGramos}
                onChange={e => setPorcionGramos(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="alergias-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Alergias o Restricciones (BR-56)</label>
              <input
                id="alergias-input"
                type="text"
                value={alergias}
                onChange={e => setAlergias(e.target.value)}
                placeholder="Ej: Alérgico al pollo y gluten"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Guardar Ficha Nutricional
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
