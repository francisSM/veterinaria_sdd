import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR22Props {
  currentRole: UserRole;
}

export const SCR22_DescuentosCampanas: React.FC<SCR22Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [motivo, setMotivo] = useState('');
  const [porcentaje, setPorcentaje] = useState(10);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const aplicarDescuento = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!motivo) {
      setErrorMsg('Debe escribir el motivo del descuento.');
      return;
    }

    // CH-68 & CH-69: Porcentaje max 50%
    if (porcentaje < 0.0 || porcentaje > 50.0) {
      setErrorMsg('Error CH-68/69: El porcentaje de descuento aplicado no puede superar el 50% (BR-39).');
      return;
    }

    setSuccessMsg(`Campaña de descuento del ${porcentaje}% ('${motivo}') configurada con éxito.`);
    setMotivo('');
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
          <h1 className="text-xl font-bold text-slate-100">Gestión de Descuentos y Campañas</h1>
          <p className="text-slate-400 text-xs">Configuración y control de rebajas autorizadas para convenios de protección animal (L5/CH-68).</p>
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

        <form onSubmit={aplicarDescuento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="motivo-disc-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Motivo / Campaña</label>
              <input
                id="motivo-disc-input"
                type="text"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: Descuento Protectora Mascotas"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="porc-disc-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Porcentaje Descuento (%)</label>
              <input
                id="porc-disc-input"
                type="number"
                value={porcentaje}
                onChange={e => setPorcentaje(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Crear Descuento
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
