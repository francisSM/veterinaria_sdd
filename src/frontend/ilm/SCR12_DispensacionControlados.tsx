import React, { useState } from 'react';
import { StateWrapper, UXState } from '../StateWrapper';
import { UserRole } from '../Layout';

interface SCR12Props {
  currentRole: UserRole;
}

export const SCR12_DispensacionControlados: React.FC<SCR12Props> = ({ currentRole }) => {
  const [uxState, setUxState] = useState<UXState>('data');
  const [recetaId, setRecetaId] = useState('');
  const [loteId, setLoteId] = useState('1');
  const [cantidad, setCantidad] = useState(1);
  const [recetaValida, setRecetaValida] = useState<boolean | null>(null);
  const [recetaInfo, setRecetaInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const verificarReceta = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setRecetaValida(null);

    if (!recetaId) {
      setErrorMsg('Por favor ingrese el ID de la receta.');
      return;
    }

    // Simular consulta de receta
    if (recetaId === '1') {
      setRecetaValida(true);
      setRecetaInfo({
        medicamento: 'Fenobarbital 100mg',
        dosis: '1/2 tableta cada 12 horas',
        duracion: '30 días',
        firma: 'VET-JOHN-DOE',
        fechaEmision: '2026-06-28',
        estado: 'emitida'
      });
    } else {
      setRecetaValida(false);
      setErrorMsg('La receta ingresada no existe o ya ha sido dispensada.');
    }
  };

  const dispensar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (cantidad <= 0) {
      setErrorMsg('La cantidad a dispensar debe ser mayor a cero.');
      return;
    }

    setSuccessMsg(`Despacho registrado con éxito. Lote descontado e inventario físico actualizado.`);
    setRecetaValida(null);
    setRecetaId('');
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
          <h1 className="text-xl font-bold text-slate-100">Dispensación de Receta Retenida</h1>
          <p className="text-slate-400 text-xs">Módulo legal obligatorio para la entrega de psicotrópicos y fármacos controlados (L5/BR-17).</p>
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

        {/* Verificación de Receta */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={recetaId}
              onChange={e => setRecetaId(e.target.value)}
              placeholder="Ingrese ID de Receta Retenida"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={verificarReceta}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Validar Receta
          </button>
        </div>

        {/* Renderizado de receta validada */}
        {recetaValida && recetaInfo && (
          <form onSubmit={dispensar} className="space-y-4 border-t border-slate-800 pt-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-sm">
              <h3 className="font-bold text-slate-200">{recetaInfo.medicamento}</h3>
              <p className="text-xs text-slate-400">Dosis: {recetaInfo.dosis} ({recetaInfo.duracion})</p>
              <div className="flex justify-between text-[11px] text-slate-500 pt-2">
                <span>Firma: {recetaInfo.firma}</span>
                <span>Emisión: {recetaInfo.fechaEmision}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lote-select-dispense" className="block text-xs font-semibold text-slate-400 mb-1.5">Lote Asignado (FEFO)</label>
                <select
                  id="lote-select-dispense"
                  value={loteId}
                  onChange={e => setLoteId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="1">LOTE-FN-992 (Vence 2026-12-31, Stock: 15)</option>
                  <option value="2">LOTE-FN-993 (Vence 2027-04-15, Stock: 25)</option>
                </select>
              </div>

              <div>
                <label htmlFor="cant-dispense-input" className="block text-xs font-semibold text-slate-400 mb-1.5">Cantidad a Dispensar</label>
                <input
                  id="cant-dispense-input"
                  type="number"
                  value={cantidad}
                  onChange={e => setCantidad(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Registrar Despacho Legal de Fármaco
            </button>
          </form>
        )}
      </div>
    </StateWrapper>
  );
};
