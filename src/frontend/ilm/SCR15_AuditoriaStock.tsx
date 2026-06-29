import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR15Props {
  currentRole: UserRole;
}

export const SCR15_AuditoriaStock: React.FC<SCR15Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [vetId, setVetId] = useState('1');
  const [diferencia, setDiferencia] = useState(0);
  const [comentarios, setComentarios] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const concluirAuditoria = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // CH-38 & CH-39: Límites de diferencia
    if (diferencia < -100000 || diferencia > 100000) {
      setErrorMsg('Error CH-38/39: La diferencia detectada excede el limite tolerable de auditoria (+/- 100,000).');
      return;
    }

    if (!comentarios || comentarios.trim().length < 5) {
      setErrorMsg('Por favor ingrese un comentario explicativo de al menos 5 caracteres para documentar la conciliacion.');
      return;
    }

    setSuccessMsg('Auditoría física de inventario consolidada y cerrada exitosamente.');
  };

  return (
    <StateWrapper
      currentState={uxState}
      onStateChange={setUxState}
      allowedRoles={['administrador', 'farmaceutico']}
      currentRole={currentRole}
    >
      <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Conciliación de Auditoría de Stock</h1>
          <p className="text-slate-400 text-xs">Cierre formal de auditorías de inventario mensual y registro de cuadres (L5).</p>
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

        <form onSubmit={concluirAuditoria} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="auditor-select" className="block text-xs font-semibold text-slate-400 mb-1.5">Auditor Responsable</label>
              <select
                id="auditor-select"
                value={vetId}
                onChange={e => setVetId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Dr. John Doe</option>
                <option value="2">Dra. Jane Smith</option>
              </select>
            </div>
            <div>
              <label htmlFor="diferencia-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Diferencia Física (Unidades)</label>
              <input
                id="diferencia-input"
                type="number"
                value={diferencia}
                onChange={e => setDiferencia(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comentarios-textarea" className="block text-xs font-semibold text-slate-400 mb-1.5">Observaciones de la Auditoría</label>
            <textarea
              id="comentarios-textarea"
              rows={4}
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              placeholder="Describa el resultado de la auditoría y justificación de cualquier sobrante o faltante detectado..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Concluir y Cerrar Auditoría
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
