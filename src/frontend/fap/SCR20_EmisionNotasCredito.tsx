import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR20Props {
  currentRole: UserRole;
}

export const SCR20_EmisionNotasCredito: React.FC<SCR20Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [boletaId, setBoletaId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [autorizacionSupervisor, setAutorizacionSupervisor] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const emitirNotaCredito = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!boletaId || !motivo || !autorizacionSupervisor) {
      setErrorMsg('Todos los campos son obligatorios para anular un comprobante.');
      return;
    }

    if (motivo.trim().length < 5) {
      setErrorMsg('El motivo de anulación debe tener al menos 5 caracteres.');
      return;
    }

    setSuccessMsg(`Nota de Crédito emitida con éxito para Boleta/Factura #${boletaId}. Devolución aprobada por Supervisor.`);
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
          <h1 className="text-xl font-bold text-slate-100">Emisión de Notas de Crédito</h1>
          <p className="text-slate-400 text-xs">Anulación de ventas y procesamiento de devoluciones autorizadas por supervisor (L5/BR-35).</p>
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

        <form onSubmit={emitirNotaCredito} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="boleta-id-nc" className="block text-xs font-semibold text-slate-400 mb-1.5">ID Boleta / Factura</label>
              <input
                id="boleta-id-nc"
                type="text"
                value={boletaId}
                onChange={e => setBoletaId(e.target.value)}
                placeholder="Ej: 1001"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="auth-sup-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Autorización Supervisor (Firma)</label>
              <input
                id="auth-sup-input"
                type="text"
                value={autorizacionSupervisor}
                onChange={e => setAutorizacionSupervisor(e.target.value)}
                placeholder="Ej: SUP-MARIA-JARA"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="motivo-nc-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Motivo de Anulación</label>
            <input
              id="motivo-nc-input"
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Cobro de consulta duplicado"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Emitir Nota de Crédito
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
