import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR16Props {
  currentRole: UserRole;
}

export const SCR16_AperturaCierreCaja: React.FC<SCR16Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [montoApertura, setMontoApertura] = useState(50000);
  const [cajaActiva, setCajaActiva] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const abrirCaja = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // CH-51 & CH-52: Limite apertura
    if (montoApertura < 0.0 || montoApertura > 1000000.0) {
      setErrorMsg('Error CH-51/52: El monto de apertura debe estar entre $0 y $1,000,000 CLP.');
      return;
    }

    setCajaActiva(true);
    setSuccessMsg(`Caja abierta exitosamente con fondo inicial de $${montoApertura} CLP.`);
  };

  const cerrarCaja = () => {
    setCajaActiva(false);
    setSuccessMsg('Sesión de caja diaria cerrada correctamente. Proceder a arqueo ciego.');
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
          <h1 className="text-xl font-bold text-slate-100">Apertura y Cierre de Caja Diaria</h1>
          <p className="text-slate-400 text-xs">Apertura de sesión financiera y cierre diario para cajeros autorizados (L5).</p>
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

        {!cajaActiva ? (
          <form onSubmit={abrirCaja} className="space-y-4">
            <div>
              <label htmlFor="apertura-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Fondo Inicial de Caja ($ CLP)</label>
              <input
                id="apertura-input"
                type="number"
                value={montoApertura}
                onChange={e => setMontoApertura(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">El fondo inicial recomendado no debe superar los $100,000 CLP (BR-43).</span>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Abrir Caja y Habilitar Cobros
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-6">
            <div className="text-sm text-slate-300">
              La sesión de caja está <span className="text-emerald-400 font-bold">ACTIVA</span>.
            </div>
            <button
              type="button"
              onClick={cerrarCaja}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Cerrar Sesión de Caja Diaria
            </button>
          </div>
        )}
      </div>
    </StateWrapper>
  );
};
