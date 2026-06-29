import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR17Props {
  currentRole: UserRole;
}

export const SCR17_ArqueoCiegoForm: React.FC<SCR17Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [montoFisico, setMontoFisico] = useState(0);
  const [comentarios, setComentarios] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Balance esperado ficticio del sistema (ciego para el cajero)
  const balanceSistemaCiego = 125000;

  const registrarArqueo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // CH-55: Monto físico no negativo
    if (montoFisico < 0.0) {
      setErrorMsg('Error CH-55: El monto fisico arqueado no puede ser un valor negativo.');
      return;
    }

    const diferencia = montoFisico - balanceSistemaCiego;

    // BR-33 / trg_process_cash_audit: Exige comentario ante cualquier diferencia
    if (diferencia !== 0 && (!comentarios || comentarios.trim().length < 5)) {
      setErrorMsg('Alerta de Auditoría: Se detectó un descuadre en caja. Es obligatorio registrar un comentario explicativo indicando el motivo.');
      return;
    }

    setSuccessMsg(`Arqueo ciego procesado. Diferencia calculada: $${diferencia} CLP. Guardado en bitácora.`);
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
          <h1 className="text-xl font-bold text-slate-100">Arqueo Ciego de Caja</h1>
          <p className="text-slate-400 text-xs">Arqueo restrictivo. El sistema no revela el monto esperado en caja (BR-33/CH-55).</p>
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

        <form onSubmit={registrarArqueo} className="space-y-4">
          <div>
            <label htmlFor="fisico-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Monto Físico Total en Efectivo ($ CLP)</label>
            <input
              id="fisico-input"
              type="number"
              value={montoFisico}
              onChange={e => setMontoFisico(parseInt(e.target.value))}
              placeholder="Ingrese conteo de efectivo"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="arqueo-comment-textarea" className="block text-xs font-semibold text-slate-400 mb-1.5">Comentarios de Conciliación (Obligatorio ante descuadres)</label>
            <textarea
              id="arqueo-comment-textarea"
              rows={3}
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              placeholder="Describa diferencias, billetes falsos o incidencias..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Registrar Arqueo Ciego
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
