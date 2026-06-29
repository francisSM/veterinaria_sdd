import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR13Props {
  currentRole: UserRole;
}

export const SCR13_RegistroMovimientos: React.FC<SCR13Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [medId, setMedId] = useState('1');
  const [loteId, setLoteId] = useState('1');
  const [tipo, setTipo] = useState('merma');
  const [cantidad, setCantidad] = useState(-5);
  const [motivo, setMotivo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // CH-34: Cantidad != 0
    if (cantidad === 0) {
      setErrorMsg('Error CH-34: La cantidad a mover del inventario no puede ser cero.');
      return;
    }

    // CH-47: Motivo para merma/ajuste
    if (['merma', 'ajuste'].includes(tipo) && (!motivo || motivo.trim().length < 5)) {
      setErrorMsg('Error CH-47: Se exige un motivo descriptivo (minimo 5 caracteres) para registrar una merma o ajuste.');
      return;
    }

    setSuccessMsg(`Movimiento de tipo '${tipo}' registrado con éxito. Stock de lote ajustado.`);
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
          <h1 className="text-xl font-bold text-slate-100">Registro de Movimientos de Inventario</h1>
          <p className="text-slate-400 text-xs">Formulario para registrar mermas por rotura, vencimiento o ajustes manuales de stock (L5).</p>
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

        <form onSubmit={registrarMovimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-select-movement" className="block text-xs font-semibold text-slate-400 mb-1.5">Medicamento</label>
              <select
                id="med-select-movement"
                value={medId}
                onChange={e => setMedId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">Fenobarbital 100mg</option>
                <option value="2">Ketamina Solución</option>
                <option value="3">Amoxicilina Suspensión</option>
              </select>
            </div>
            <div>
              <label htmlFor="lote-select-movement" className="block text-xs font-semibold text-slate-400 mb-1.5">Lote</label>
              <select
                id="lote-select-movement"
                value={loteId}
                onChange={e => setLoteId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="1">LOTE-FN-992 (Stock: 15)</option>
                <option value="2">LOTE-KB-110 (Stock: 5)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tipo-select-movement" className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo de Movimiento</label>
              <select
                id="tipo-select-movement"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="merma">Merma (Rotura, vencimiento)</option>
                <option value="ajuste">Ajuste Manual</option>
              </select>
            </div>
            <div>
              <label htmlFor="cantidad-movement-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Cantidad (Valor negativo para egreso)</label>
              <input
                id="cantidad-movement-input"
                type="number"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="motivo-movement-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Justificación / Motivo del Movimiento</label>
            <input
              id="motivo-movement-input"
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Rotura de ampolla al descargar lote"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
          >
            Registrar Movimiento
          </button>
        </form>
      </div>
    </StateWrapper>
  );
};
