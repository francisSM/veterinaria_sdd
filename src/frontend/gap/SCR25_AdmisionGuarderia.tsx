import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR25Props {
  currentRole: UserRole;
}

export const SCR25_AdmisionGuarderia: React.FC<SCR25Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [reservaId, setReservaId] = useState('');
  const [temperatura, setTemperatura] = useState(38.2);
  const [peso, setPeso] = useState(15.5);
  const [vacunasAlDia, setVacunasAlDia] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const realizarCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!reservaId) {
      setErrorMsg('Debe seleccionar o ingresar el ID de la reserva.');
      return;
    }

    // BR-46: Vacunas al día
    if (!vacunasAlDia) {
      setErrorMsg('Error BR-46: No se permite el check-in de una mascota en guarderia/hotel sin vacunas obligatorias al dia.');
      return;
    }

    // CH-81 & CH-82: Temperatura ingreso
    if (temperatura < 35.0 || temperatura > 42.0) {
      setErrorMsg('Error CH-81/82: Temperatura de ingreso fuera de limites fisiologicos (35.0 - 42.0 C).');
      return;
    }

    // CH-97: Peso ingreso > 0
    if (peso <= 0.0) {
      setErrorMsg('Error CH-97: El peso de ingreso de la mascota debe ser mayor a 0.0.');
      return;
    }

    setSuccessMsg(`Check-in de hotel completado con éxito. Admisión registrada.`);
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'recepcionista']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Admisión y Check-in de Guardería</h1>
          <p className="text-slate-400 text-xs">Formulario de registro y control de constantes biológicas al ingreso (L5/BR-46/CH-81).</p>
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

        <form onSubmit={realizarCheckin} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reserva-id-checkin" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Reserva</label>
              <input
                id="reserva-id-checkin"
                type="text"
                value={reservaId}
                onChange={e => setReservaId(e.target.value)}
                placeholder="Ej: 10"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="temp-checkin-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Temperatura (°C) (CH-81)</label>
              <input
                id="temp-checkin-input"
                type="number"
                step="0.1"
                value={temperatura}
                onChange={e => setTemperatura(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="peso-checkin-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Peso Ingreso (kg)</label>
              <input
                id="peso-checkin-input"
                type="number"
                step="0.1"
                value={peso}
                onChange={e => setPeso(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-sm text-slate-300 font-medium select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={vacunasAlDia}
                  onChange={e => setVacunasAlDia(e.target.checked)}
                  className="accent-emerald-500 h-4 w-4 bg-slate-900 border border-slate-700 rounded"
                />
                Vacunas obligatorias al día
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Registrar Check-in
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
